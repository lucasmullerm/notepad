// Get Cursor Position in TextArea
$.fn.getCursorPosition = function() {
    var el = $(this).get(0)
    var pos = 0
    if('selectionStart' in el) {
        pos = el.selectionStart
    } else if('selection' in document) {
        el.focus()
        var Sel = document.selection.createRange()
        var SelLength = document.selection.createRange().text.length
        Sel.moveStart('character', -el.value.length)
        pos = Sel.text.length - SelLength
    }
    return pos
}

$.fn.setCursorPosition = function(pos) {
    this.each(function(index, elem) {
        if (elem.setSelectionRange) {
            elem.setSelectionRange(pos, pos)
        } else if (elem.createTextRange) {
            var range = elem.createTextRange()
            range.collapse(true)
            range.moveEnd('character', pos)
            range.moveStart('character', pos)
            range.select()
        }
    })
    return this
}

var Keys = {
    BACKSPACE: 8,
    DELETE: 46,
    ENTER: 13
}

$(function() {
    var server = 'http://localhost'
    var socket = io.connect(server)

    // Adding event listeners
    $('textarea')
    .keypress(function(e) {
        // write text
        e.preventDefault()
        console.log()
        var cursor = $(this).getCursorPosition()
        var char = String.fromCharCode(e.charCode)
        if (char == '\r')
            char = '\n'
        var data = {char: char, cursor: cursor}
        console.log("Emitindo write: ")
        console.log(data)
        if (socket.connected)
            socket.emit('write', data)
    })
    .keydown(function(e) {
        // Delete keys
        var cursor = $(this).getCursorPosition()
        switch (e.keyCode) {
            case Keys.BACKSPACE:
                e.preventDefault()
                data = {cursor: cursor-1}
                console.log('Emitindo delete')
                console.log(data)
                if (socket.connected)
                    socket.emit('delete', data)
                break
            case Keys.DELETE:
                e.preventDefault()
                data = {cursor: cursor}
                console.log('Emitindo delete')
                console.log(data)
                if (socket.connected)
                    socket.emit('delete', data)
                break
        }
    })

    console.log('Conectando a ' + server + '...')

    socket.on('connected', function (data) {
        console.log('----- EVENT: connected')
        console.log('Conectado a ' + server)
        console.log('Texto atualizado')
        $('textarea').val(data.text)
    })

    socket.on('wrote', function (data) {
        console.log('----- EVENT: wrote')
        console.log(data)
        var originalCursor = $('textarea').getCursorPosition()
        var text = $('textarea').val()
        var left  = text.substring(0, data.cursor)
        var right = text.substring(data.cursor, text.length)
        var newText = left + data.char + right
        $('textarea').val(newText)
        if (data.me)
            $('textarea').setCursorPosition(data.cursor+1)
        else {
            if (data.cursor < originalCursor)
                originalCursor++
            $('textarea').setCursorPosition(originalCursor)
        }
    })

    socket.on('deleted', function (data) {
        console.log('----- EVENT: deleted')
        console.log(data)
        var originalCursor = $('textarea').getCursorPosition()
        var text = $('textarea').val()
        var left  = text.substring(0, data.cursor)
        var right = text.substring(data.cursor+1, text.length)
        var newText = left + right
        $('textarea').val(newText)
        if (data.me)
            $('textarea').setCursorPosition(data.cursor)
        else {
            if (data.cursor < originalCursor)
                originalCursor--
            $('textarea').setCursorPosition(originalCursor)
        }
    })
})
