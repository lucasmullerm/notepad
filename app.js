var app = require('express')()
var server = require('http').Server(app)
var io = require('socket.io')(server, {'origins': '*:*'})
var fs = require('fs')
var filename = 'text'

app.all('/', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Headers", "X-Requested-With")
    next()
})

server.listen(80)

app.get('/text', function (req, res) {
    fs.readFile(filename, 'utf8', function(err, data) {
        if (err) throw err
        res.status(200).json({ text: data})
    })
})

io.on('connection', function (socket) {
    console.log('----- EVENT: connection')
    var client = socket.handshake.address
    console.log('Nova conexão de ' + client)
    fs.readFile(filename, 'utf8', function(err, data) {
        if (err) throw err
        socket.emit('connected', { text: data })
    })
    // write event
    socket.on('write', function (data) {
        console.log('----- EVENT: write')
        console.log(client + ' enviou:')
        console.log(data)
        var text  = fs.readFileSync(filename).toString()
        var left  = text.substring(0, data.cursor)
        var right = text.substring(data.cursor, text.length)
        var newText = left + data.char + right

        fs.writeFile('text', newText, function (err) {
            if (err) throw err
            data.client = client
            socket.broadcast.emit('wrote', data)
            data.me = true
            socket.emit('wrote', data)
            // io.sockets.emit('wrote', data)
        })
    })
    // delete event
    socket.on('delete', function (data) {
        console.log('----- EVENT: delete')
        console.log(client + ' enviou:')
        console.log(data)
        var text  = fs.readFileSync(filename).toString()
        var left  = text.substring(0, data.cursor)
        var right = text.substring(data.cursor+1, text.length)
        var newText = left + right

        fs.writeFile('text', newText, function (err) {
            if (err) throw err
            data.client = client
            socket.broadcast.emit('deleted', data)
            data.me = true
            socket.emit('deleted', data)
        })
    })
})
