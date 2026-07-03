import * as THREE from "three";

const NUM_LANDMARKS = 21;

// 21-point hand skeleton connections (MediaPipe hand topology).
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], // thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // index
  [5, 9], [9, 10], [10, 11], [11, 12], // middle
  [9, 13], [13, 14], [14, 15], [15, 16], // ring
  [13, 17], [17, 18], [18, 19], [19, 20], // pinky
  [0, 17], // palm base
];

/**
 * Encapsulates the Three.js side of the app: a fullscreen video-textured
 * background plane (the webcam feed) plus a set of spheres/lines overlaid
 * in screen space to represent the 21 hand landmarks.
 */
export class HandScene {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {HTMLVideoElement} videoEl
   */
  constructor(canvas, videoEl) {
    this.canvas = canvas;
    this.videoEl = videoEl;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.scene = new THREE.Scene();

    // Orthographic camera mapped to normalized [-1, 1] space; makes it easy
    // to place landmark markers directly from MediaPipe's normalized x/y.
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    this.camera.position.z = 1;

    this._buildBackground();
    this._buildLandmarkMarkers();

    window.addEventListener("resize", () => this._onResize());
    this._onResize();
  }

  _buildBackground() {
    this.videoTexture = new THREE.VideoTexture(this.videoEl);
    this.videoTexture.minFilter = THREE.LinearFilter;
    this.videoTexture.magFilter = THREE.LinearFilter;
    this.videoTexture.colorSpace = THREE.SRGBColorSpace;

    // Mirror horizontally so it feels like a mirror, matching how most
    // "selfie view" hand-tracking demos behave.
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.MeshBasicMaterial({ map: this.videoTexture, depthTest: false });
    this.backgroundMesh = new THREE.Mesh(geometry, material);
    this.backgroundMesh.position.z = -1;
    this.backgroundMesh.scale.x = -1; // mirror
    this.scene.add(this.backgroundMesh);
  }

  _buildLandmarkMarkers() {
    // 21 small spheres, one per landmark.
    const sphereGeo = new THREE.SphereGeometry(0.015, 12, 12);
    const sphereMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });

    this.markers = [];
    for (let i = 0; i < NUM_LANDMARKS; i++) {
      const mesh = new THREE.Mesh(sphereGeo, sphereMat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.markers.push(mesh);
    }

    // Skeleton connections, drawn as a single LineSegments object updated
    // every frame from the current landmark positions.
    const lineGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(HAND_CONNECTIONS.length * 2 * 3);
    lineGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x38bdf8 });
    this.skeleton = new THREE.LineSegments(lineGeometry, lineMaterial);
    this.skeleton.visible = false;
    this.scene.add(this.skeleton);
  }

  _onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.renderer.setSize(width, height, false);
  }

  /**
   * Converts MediaPipe normalized landmark coords (x,y in [0,1], origin
   * top-left) into our [-1, 1] orthographic-camera space, applying the same
   * horizontal mirroring as the background plane.
   */
  _toClipSpace(landmark) {
    const x = -(landmark.x * 2 - 1); // mirrored to match background
    const y = -(landmark.y * 2 - 1); // flip Y (image space -> GL space)
    const z = -landmark.z; // MediaPipe z is roughly depth-from-camera, small scale
    return [x, y, z];
  }

  /**
   * Updates marker/skeleton positions from a MediaPipe HandLandmarkerResult.
   * Pass `null`/empty when no hand is currently detected.
   * @param {Array<Array<{x:number,y:number,z:number}>>} handLandmarksList
   */
  updateLandmarks(handLandmarksList) {
    const hasHand = handLandmarksList && handLandmarksList.length > 0;

    if (!hasHand) {
      this.markers.forEach((m) => (m.visible = false));
      this.skeleton.visible = false;
      return;
    }

    const landmarks = handLandmarksList[0]; // numHands: 1

    landmarks.forEach((lm, i) => {
      const [x, y, z] = this._toClipSpace(lm);
      const marker = this.markers[i];
      marker.position.set(x, y, z);
      marker.visible = true;
    });

    const posAttr = this.skeleton.geometry.getAttribute("position");
    HAND_CONNECTIONS.forEach(([a, b], idx) => {
      const [ax, ay, az] = this._toClipSpace(landmarks[a]);
      const [bx, by, bz] = this._toClipSpace(landmarks[b]);
      posAttr.setXYZ(idx * 2, ax, ay, az);
      posAttr.setXYZ(idx * 2 + 1, bx, by, bz);
    });
    posAttr.needsUpdate = true;
    this.skeleton.visible = true;
  }

  render() {
    if (this.videoEl.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      this.videoTexture.needsUpdate = true;
    }
    this.renderer.render(this.scene, this.camera);
  }
}
