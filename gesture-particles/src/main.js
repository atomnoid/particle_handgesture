import { startWebcam } from "./webcam.js";
import { createHandLandmarker, detectHandsForVideo } from "./handLandmarker.js";
import { HandScene } from "./scene.js";

const videoEl = document.getElementById("webcam");
const canvasEl = document.getElementById("three-canvas");
const statusEl = document.getElementById("status");
const statusTextEl = document.getElementById("status-text");

function setStatus(text, mode = "loading") {
  statusTextEl.textContent = text;
  statusEl.classList.remove("ready", "error");
  if (mode === "ready") statusEl.classList.add("ready");
  if (mode === "error") statusEl.classList.add("error");
}

async function main() {
  try {
    setStatus("Requesting camera access…");
    await startWebcam(videoEl);

    setStatus("Loading hand landmarker model…");
    await createHandLandmarker();

    setStatus("Tracking hand…", "ready");

    const scene = new HandScene(canvasEl, videoEl);

    let lastVideoTime = -1;

    function renderLoop() {
      requestAnimationFrame(renderLoop);

      // detectForVideo requires a new video frame each call; guard against
      // running detection twice on the same frame.
      if (videoEl.currentTime !== lastVideoTime) {
        lastVideoTime = videoEl.currentTime;

        const result = detectHandsForVideo(videoEl, performance.now());

        if (result.landmarks && result.landmarks.length > 0) {
          // Log all 21 landmarks for the first detected hand, as requested.
          console.log("Hand landmarks:", result.landmarks[0]);
        }

        scene.updateLandmarks(result.landmarks);
      }

      scene.render();
    }

    renderLoop();
  } catch (err) {
    console.error(err);
    setStatus(`Error: ${err.message}`, "error");
  }
}

main();
