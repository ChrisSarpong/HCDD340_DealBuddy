
document.addEventListener("DOMContentLoaded", async () => {
  const video = document.getElementById("cameraVideo");
  const canvas = document.getElementById("cameraCanvas");
  const captureBtn = document.getElementById("cameraCaptureBtn");
  const retakeBtn = document.getElementById("cameraRetakeBtn");
  const useBtn = document.getElementById("cameraUseBtn");
  const cancelBtn = document.getElementById("cameraCancelBtn");

  const AVATAR_STORAGE_KEY = "dealbuddy_profile_avatar";
  let stream = null;
  let capturedDataUrl = null;

  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    await video.play();
  } catch (err) {
    console.error("Could not access camera:", err);
    alert("Could not access camera. Check permissions and try again.");
  }

  captureBtn.addEventListener("click", () => {
    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) {
      console.warn("Video not ready yet.");
      return;
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, width, height);

    capturedDataUrl = canvas.toDataURL("image/png");

    video.style.display = "none";
    canvas.style.display = "block";

    captureBtn.style.display = "none";
    retakeBtn.style.display = "inline-block";
    useBtn.style.display = "inline-block";
  });

  retakeBtn.addEventListener("click", () => {
    capturedDataUrl = null;
    canvas.style.display = "none";
    video.style.display = "block";

    captureBtn.style.display = "inline-block";
    retakeBtn.style.display = "none";
    useBtn.style.display = "none";
  });

useBtn.addEventListener("click", () => {
  if (!capturedDataUrl) return;

  try {
    localStorage.setItem(AVATAR_STORAGE_KEY, capturedDataUrl);
  } catch (e) {
    console.warn("Could not save avatar to localStorage:", e);
  }

  if (window.opener && !window.opener.closed) {
    window.opener.postMessage(
      {
        type: "DEALBUDDY_AVATAR_UPDATED",
        dataUrl: capturedDataUrl,
      },
      "*"
    );
  }

  if (window.opener) {
    window.close();
  } else {
    alert("Photo saved. You can close this tab.");
  }
});


  cancelBtn.addEventListener("click", () => {
    if (window.opener) {
      window.close();
    } else {
      window.history.back();
    }
  });

  window.addEventListener("beforeunload", () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
  });
});