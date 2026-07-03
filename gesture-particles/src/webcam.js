/**
 * Requests webcam access and wires the stream into the given <video> element.
 * Resolves once the video has usable dimensions (loadeddata), which is the
 * point at which MediaPipe's detectForVideo() can safely start reading frames.
 *
 * @param {HTMLVideoElement} videoEl
 * @returns {Promise<HTMLVideoElement>}
 */
export async function startWebcam(videoEl) {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("getUserMedia is not supported in this browser.");
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: "user",
    },
    audio: false,
  });

  videoEl.srcObject = stream;

  await new Promise((resolve, reject) => {
    videoEl.onloadeddata = () => resolve();
    videoEl.onerror = (e) => reject(e);
  });

  await videoEl.play();

  return videoEl;
}
