const express = require("express")
const app = express()
const server = require("http").Server(app)
const io = require("socket.io").listen(server)

app.use(express.static(__dirname + "/public"))

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html")
})

io.on("connection", (socket) => {
  socket.on("update", (data) => {
    data.id = socket.id
    socket.broadcast.emit("update", data)
  })

  socket.on("shoot", () => {
    io.emit("shoot", socket.id)
  })

  socket.on("disconnect", () => {
    io.emit("disconnect", socket.id)
  })
})

server.listen(8081, () => {
  console.log("listening on " + server.address().port)
})