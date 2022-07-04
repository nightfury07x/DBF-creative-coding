var express = require("express");

var app = express();
var server = app.listen(3000);

app.use(express.static('public'));

console.log("my socket server is running");

// var socket = require('socket.io');

const io = require('socket.io')(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        transports: ['websocket', 'polling'],
        credentials: true
    },
    allowEIO3: true
});

io.sockets.on('connection', newConnection);

function newConnection(socket) {
    console.log('new connection');
    console.log(socket.id);

    socket.on('mouse', mouseMsg); // if there is a message called mouse, trigger mouseMsg function

    function mouseMsg(data){
        socket.broadcast.emit('mouse', data);
        console.log(data);
    }
}

