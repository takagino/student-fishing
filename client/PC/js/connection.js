const socket = io();

socket.emit("register", { clientType: "pc" });

// socket.on("gyroscope", (data) => {
//   document.getElementById("x-value").textContent = data.x.toFixed(2);
//   document.getElementById("y-value").textContent = data.y.toFixed(2);
//   document.getElementById("z-value").textContent = data.z.toFixed(2);
// });

socket.on("close_popup", () => {
  console.log("ボタンが押されました:");
});
