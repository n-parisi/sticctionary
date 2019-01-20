const express = require("express");
const GameServer = require("./GameServer");

const app = express();
const port = process.env.PORT || 3001;

//load static resources
app.use("/static", express.static(__dirname + "/static"));

//sticctionary game
app.get("/sticc", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

var server = app.listen(port, () => {
  let status = GameServer(server);
  console.log(`Started server on port ${port}, sticc server is ${status}`);
});
