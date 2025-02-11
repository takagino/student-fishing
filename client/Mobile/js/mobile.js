const socket = io();
const startButton = document.getElementById("startButton");

startButton.addEventListener("click", async () => {
  try {
    // ジャイロセンサーの許可を要求
    await DeviceOrientationEvent.requestPermission();
    startGyroscope();
    startButton.style.display = "none";
  } catch (error) {
    console.log("ジャイロセンサーの許可が必要です");
  }
});

function startGyroscope() {
  window.addEventListener("deviceorientation", (event) => {
    const x = event.beta || 0;
    const y = event.gamma || 0;
    const z = event.alpha || 0;

    document.getElementById("x-value").textContent = x.toFixed(2);
    document.getElementById("y-value").textContent = y.toFixed(2);
    document.getElementById("z-value").textContent = z.toFixed(2);

    socket.emit("gyroscope", { x, y, z });
  });
}
const closeButton = document.getElementById("closeButton");

socket.on("show_fish_data", (data) => {
  closeButton.style.display = "block";
});

document.getElementById("closeButton").addEventListener("click", () => {
  socket.emit("close_popup");
  closeButton.style.display = "none";
});
