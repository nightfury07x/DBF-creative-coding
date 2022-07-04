var socket;

function setup() {
  createCanvas(800, 800);
  background(51);
  strokeWeight(4);
  stroke(255, 255, 0);
  socket = io.connect("http://localhost:3000");
  socket.on("mouse", newDraw);
}

function mouseDragged() {
  var data = {
    x: mouseX,
    y: mouseY,
    px: pmouseX,
    py: pmouseY,
  };

  socket.emit("mouse", data);
  line(pmouseX, pmouseY, mouseX, mouseY);
}

function newDraw(data) {
  const { x, y, px, py } = data;

  stroke(255, 0, 100);
  line(px, py, x, y);
}
