import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

const MODEL_PATH = "/models/hand_landmarker.task";

let handLandmarker = null;

export async function createHandLandmarker() {

    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm"
    );

    handLandmarker = await HandLandmarker.createFromOptions(vision, {

        baseOptions:{

            modelAssetPath:MODEL_PATH,
            delegate:"GPU"

        },

        runningMode:"VIDEO",

        numHands:1,

        minHandDetectionConfidence:0.6,

        minTrackingConfidence:0.6,

        minHandPresenceConfidence:0.6

    });

    return handLandmarker;

}

export function detectHandsForVideo(video, timestamp) {
  return handLandmarker.detectForVideo(video, timestamp);
}