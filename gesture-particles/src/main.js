import { startWebcam } from "./webcam.js";
import {
  createHandLandmarker,
  detectHandsForVideo,
} from "./handLandmarker.js";

import { HandScene } from "./scene.js";

const video = document.getElementById("webcam");
const canvas = document.getElementById("three-canvas");

const status = document.getElementById("status");
const statusText = document.getElementById("status-text");

function setStatus(text, type = "") {
  status.classList.remove("ready", "error");

  if (type) status.classList.add(type);

  statusText.textContent = text;
}

async function init() {
  try {
    setStatus("Opening Camera...");

    await startWebcam(video);

    setStatus("Loading MediaPipe Model...");

    await createHandLandmarker();

    setStatus("Tracking Hand", "ready");

    const scene = new HandScene(canvas, video);

    let lastTime = -1;

    function animate() {
      requestAnimationFrame(animate);

      if (video.currentTime !== lastTime) {
        lastTime = video.currentTime;

        const result = detectHandsForVideo(
          video,
          performance.now()
        );

        scene.updateLandmarks(result.landmarks);
      }

      scene.render();
    }

    animate();
  } catch (err) {
    console.error(err);

    setStatus(err.message, "error");
  }
}

init();