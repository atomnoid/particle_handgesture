const video = document.getElementById("webcam");

const stream = await navigator.mediaDevices.getUserMedia({
  video: true
});
console.log(landmarks)

video.srcObject = stream;