var express = require("express");

var app = express();
var server = app.listen(3000);

app.use(express.static("public"));
console.log("server is running");

var socket = require("socket.io");

var io = socket(server, {
  cors: {
    origin: "http://localhost:8100",
    methods: ["GET", "POST"],
    transports: ["websocket", "polling"],
    credentials: true,
  },
  allowEIO3: true,
});

io.sockets.on("connection", myConnection);

function myConnection(socket) {
  console.log("new connection id :" + socket.id);
  socket.on("mouse", mouseData);

  function mouseData(data) {
    socket.broadcast.emit("mouse", data);
  }
}
