export const startCamera = async (
  preferBackCamera = true
): Promise<MediaStream> => {
  try {
    if (preferBackCamera) {
      try {
        return await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { exact: "environment" } },
        });
      } catch {
        console.log("無法使用後置相機，嘗試其他相機選項");
      }
    }

    return await navigator.mediaDevices.getUserMedia({
      video: true,
    });
  } catch (error) {
    throw new Error("無法存取相機，請確認相機權限已開啟");
  }
};

export const stopCamera = (stream: MediaStream): void => {
  stream.getTracks().forEach((track) => track.stop());
};

export const captureImage = (video: HTMLVideoElement): string => {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("無法創建 canvas context");
  }

  ctx.drawImage(video, 0, 0);
  return canvas.toDataURL("image/jpeg").split(",")[1];
};
