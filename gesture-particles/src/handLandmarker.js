import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

/*
 * MODEL FILE
 * ----------
 * The hand landmarker needs a `.task` model bundle. You have two options:
 *
 * 1. LOCAL (recommended for production — no runtime dependency on a CDN):
 *    Download the model from:
 *      https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task
 *    and place it at:
 *      public/models/hand_landmarker.task
 *    Vite serves everything in `public/` from the site root, so the file
 *    will be reachable at `/models/hand_landmarker.task` — which is exactly
 *    the path used below.
 *
 * 2. CDN (fastest to try, but requires network access at runtime):
 *    Replace MODEL_ASSET_PATH below with:
 *      "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task"
 *
 * The WASM runtime files (for FilesetResolver) are loaded from jsDelivr's
 * CDN below. You can also vendor those locally if you need a fully offline
 * build — see the README for instructions.
 */
const MODEL_ASSET_PATH = "/models/hand_landmarker.task";
const WASM_BASE_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm";

let handLandmarker = null;

/**
 * Loads (once) and returns the shared HandLandmarker instance, configured
 * for low-latency VIDEO stream mode and a single tracked hand.
 * @returns {Promise<HandLandmarker>}
 */
export async function createHandLandmarker() {
  if (handLandmarker) return handLandmarker;

  const vision = await FilesetResolver.forVisionTasks(WASM_BASE_URL);

  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: MODEL_ASSET_PATH,
      delegate: "GPU", // falls back to CPU automatically if GPU isn't available
    },
    runningMode: "VIDEO",
    numHands: 1,
    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  return handLandmarker;
}

/**
 * Runs detection on a single video frame.
 * @param {HTMLVideoElement} videoEl
 * @param {number} timestampMs - monotonically increasing timestamp (performance.now())
 * @returns {import("@mediapipe/tasks-vision").HandLandmarkerResult}
 */
export function detectHandsForVideo(videoEl, timestampMs) {
  if (!handLandmarker) {
    throw new Error("HandLandmarker not initialized. Call createHandLandmarker() first.");
  }
  return handLandmarker.detectForVideo(videoEl, timestampMs);
}
