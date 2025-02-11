const express = require("express");
const https = require("https");
const socketIo = require("socket.io");
const path = require("path");
const os = require("os");
const fs = require("fs");

const app = express();

const options = {
  key: fs.readFileSync("./ssl/private.key"),
  cert: fs.readFileSync("./ssl/certificate.pem"),
};

const server = https.createServer(options, app);
const io = socketIo(server);

function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  for (const interfaceName of Object.keys(interfaces)) {
    const addresses = interfaces[interfaceName];
    for (const addr of addresses) {
      if (addr.family === "IPv4" && !addr.internal) {
        return addr.address;
      }
    }
  }
  return "localhost";
}

const PORT = process.env.PORT || 3000;
const HOST = getLocalIPAddress();

app.use("/pc", express.static(path.join(__dirname, "../client/PC")));
app.use("/js", express.static(path.join(__dirname, "../client/PC/js")));
app.use("/css", express.static(path.join(__dirname, "../client/PC/css")));
app.use("/images", express.static(path.join(__dirname, "../client/PC/images")));
app.use("/json", express.static(path.join(__dirname, "../client/PC/json")));
app.use("/mobile", express.static(path.join(__dirname, "../client/Mobile")));
app.use("/js", express.static(path.join(__dirname, "../client/Mobile/js")));

// シンプルなリダイレクト処理
app.get("/", (req, res) => {
  const userAgent = req.headers["user-agent"];
  if (/mobile/i.test(userAgent)) {
    res.sendFile(path.join(__dirname, "../client/Mobile/index.html"));
  } else {
    res.sendFile(path.join(__dirname, "../client/PC/index.html"));
  }
});

io.on("connection", (socket) => {
  // console.log("a user connected with ID:", socket.id);
  socket.on("close_popup", () => {
    io.emit("close_popup");
  });
  socket.on("show_fish_data", (data) => {
    io.emit("show_fish_data", data);
  });

  socket.on("register", (data) => {
    // console.log(`Client ${socket.id} registered as ${data.clientType}`);
    socket.clientType = data.clientType;
  });

  socket.on("buttonPress", (data) => {
    // console.log("Button pressed event received");
    // console.log("Data:", data);
    // console.log("Sending to all clients");
    io.emit("buttonPress", data);
  });

  socket.on("disconnect", () => {
    // console.log("user disconnected:", socket.id);
  });

  socket.on("gyroscope", (data) => {
    io.emit("gyroscope", data);
  });
});

server.listen(PORT, HOST, () => {
  console.log("---------------------------");
  console.log(`https://${HOST}:${PORT}`);
  console.log("---------------------------");
});
