const video = document.getElementById("video");
const requestCameraBtn = document.getElementById("requestCamera");
const takePictureBtn = document.getElementById("takePicture");
const useImageCaptureCheckbox = document.getElementById("useImageCapture");
const currentConstraintsBtn = document.getElementById("currentConstraints");
const fixConstraintsBtn = document.getElementById("fixConstraints");

let currentStream = null;
let imageCapture = null;
let currentConstraints = {
  video: {
    facingMode: "environment",
    frameRate: 20,
    focusMode: "continuous",
    aspectRatio: 1.777777778,
    width: { min: 300, ideal: 1280, max: 5000 },
    height: { min: 300, ideal: 720, max: 5000 },
  },
};

const fixConstraints = {
  video: {
    facingMode: "environment",
    frameRate: 20,
    focusMode: "continuous",
    aspectRatio: 1.777777778,
    width: { min: 300, ideal: 3840, max: 5000 },
    height: { min: 300, ideal: 2160, max: 5000 },
  },
};

// Check if getUserMedia is available
function getUserMedia() {
  // Try modern API first
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    return navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  }
  // Fallback to deprecated API
  if (navigator.getUserMedia) {
    return navigator.getUserMedia.bind(navigator);
  }
  // Webkit prefix
  if (navigator.webkitGetUserMedia) {
    return navigator.webkitGetUserMedia.bind(navigator);
  }
  // Mozilla prefix
  if (navigator.mozGetUserMedia) {
    return navigator.mozGetUserMedia.bind(navigator);
  }
  return null;
}

const getUserMediaFn = getUserMedia();

function stopStream() {
  if (currentStream) {
    currentStream.getTracks().forEach((track) => track.stop());
    currentStream = null;
    imageCapture = null;
  }
}

function requestCamera(constraints) {
  if (!getUserMediaFn) {
    alert("getUserMedia is not supported in this browser");
    return;
  }

  stopStream();

  // Handle different getUserMedia implementations
  let promise;
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    promise = navigator.mediaDevices.getUserMedia(constraints);
  } else {
    // Use callback-based API for older browsers
    promise = new Promise((resolve, reject) => {
      getUserMediaFn(constraints, resolve, reject);
    });
  }

  promise
    .then((stream) => {
      currentStream = stream;
      video.srcObject = stream;

      // Create ImageCapture instance for full resolution photos
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && window.ImageCapture) {
        imageCapture = new ImageCapture(videoTrack);
      } else {
        imageCapture = null;
        console.warn(
          "ImageCapture API not supported, will fallback to canvas method"
        );
      }

      takePictureBtn.disabled = false;
      requestCameraBtn.style.display = "none";
    })
    .catch((error) => {
      console.error("Error accessing camera:", error);
      alert("Error accessing camera: " + error.message);
      takePictureBtn.disabled = true;
      requestCameraBtn.style.display = "block";
    });
}

// Request camera on page load if permission already granted
function checkCameraPermission() {
  if (navigator.permissions) {
    navigator.permissions
      .query({ name: "camera" })
      .then((result) => {
        if (result.state === "granted") {
          requestCamera(currentConstraints);
        } else {
          requestCameraBtn.style.display = "block";
        }
      })
      .catch(() => {
        // Fallback if permission query fails
        requestCameraBtn.style.display = "block";
      });
  } else {
    // Browser doesn't support permission query
    requestCameraBtn.style.display = "block";
  }
}

function takePicture() {
  if (!currentStream) {
    alert("No camera stream available");
    return;
  }

  // Check if checkbox is checked to use ImageCapture
  const useImageCapture = useImageCaptureCheckbox.checked;

  // Use ImageCapture.takePhoto() for full resolution if checkbox is checked and available
  if (useImageCapture && imageCapture) {
    imageCapture
      .takePhoto()
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `picture-${Date.now()}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      })
      .catch((error) => {
        console.error("Error taking photo with ImageCapture:", error);
        // Fallback to canvas method
        takePictureCanvas();
      });
  } else {
    // Use canvas method if checkbox is unchecked or ImageCapture is not available
    takePictureCanvas();
  }
}

function takePictureCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0);

  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `picture-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, "image/png");
}

// Event listeners
requestCameraBtn.addEventListener("click", () => {
  requestCamera(currentConstraints);
});

takePictureBtn.addEventListener("click", takePicture);

currentConstraintsBtn.addEventListener("click", () => {
  currentConstraints = {
    video: {
      facingMode: "environment",
      frameRate: 20,
      focusMode: "continuous",
      aspectRatio: 1.777777778,
      width: { min: 300, ideal: 1280, max: 5000 },
      height: { min: 300, ideal: 720, max: 5000 },
    },
  };

  if (currentStream) {
    requestCamera(currentConstraints);
  }
});

fixConstraintsBtn.addEventListener("click", () => {
  currentConstraints = {
    video: {
      facingMode: "environment",
      frameRate: 20,
      focusMode: "continuous",
      aspectRatio: 1.777777778,
      width: { min: 300, ideal: 1920, max: 5000 },
      height: { min: 300, ideal: 1080, max: 5000 },
    },
  };

  if (currentStream) {
    requestCamera(currentConstraints);
  }
});

// Initialize on page load
checkCameraPermission();
