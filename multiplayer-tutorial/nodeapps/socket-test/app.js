
const express = require('express');
const app = express();
/**
 * same as writing
 * var express = require('express');
 * var app = express();
 */


const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');

// app.get('/', function(req, res) {
//     res.sendFile(__dirname + '/index.html');
// })

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', function(socket){
    console.log(`${socket.id} connected`);
    socket.on('disconnect', function () {
        console.log(`${socket.id} disconnected`);
    })
    socket.on('chat message', function (msg) {
        console.log(msg);
        io.emit('chat message', msg);
    })
})

http.listen(3000, function(){
    console.log("listening on port 3000");
})