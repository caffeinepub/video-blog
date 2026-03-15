import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, Camera, SwitchCamera } from "lucide-react";
import { useCamera } from "../camera/useCamera";

interface CameraCaptureProps {
  onPhotoCapture: (photo: File) => void;
}

export default function CameraCapture({ onPhotoCapture }: CameraCaptureProps) {
  const {
    isActive,
    isSupported,
    error,
    isLoading,
    currentFacingMode,
    startCamera,
    stopCamera,
    capturePhoto,
    switchCamera,
    retry,
    videoRef,
    canvasRef,
  } = useCamera({
    facingMode: "environment",
    quality: 0.9,
    format: "image/jpeg",
  });

  const handleCapture = async () => {
    const photo = await capturePhoto();
    if (photo) {
      onPhotoCapture(photo);
    }
  };

  const handleSwitchCamera = async () => {
    const newMode = currentFacingMode === "user" ? "environment" : "user";
    await switchCamera(newMode);
  };

  if (isSupported === false) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Camera is not supported on this device or browser. Please try using a
          different browser or device.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full aspect-[4/3] bg-muted rounded-2xl overflow-hidden shadow-lg">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ display: isActive ? "block" : "none" }}
        />
        <canvas ref={canvasRef} className="hidden" />

        {!isActive && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="text-center">
              <Camera className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Camera preview will appear here
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error.message}
            {error.type === "permission" &&
              " Please allow camera access in your browser settings."}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap gap-2">
        {!isActive ? (
          <Button
            onClick={error ? retry : startCamera}
            disabled={isLoading}
            size="lg"
            className="flex-1 gap-2"
          >
            <Camera className="w-5 h-5" />
            {error ? "Retry" : isLoading ? "Starting..." : "Start Camera"}
          </Button>
        ) : (
          <>
            <Button
              onClick={handleCapture}
              disabled={!isActive || isLoading}
              size="lg"
              className="flex-1 gap-2"
            >
              <img
                src="/assets/generated/camera-icon.dim_64x64.png"
                alt=""
                className="w-5 h-5"
              />
              Take Photo
            </Button>
            <Button
              onClick={handleSwitchCamera}
              disabled={!isActive || isLoading}
              variant="outline"
              size="lg"
              className="gap-2 sm:hidden"
            >
              <SwitchCamera className="w-5 h-5" />
            </Button>
            <Button
              onClick={handleSwitchCamera}
              disabled={!isActive || isLoading}
              variant="outline"
              size="lg"
              className="gap-2 hidden sm:flex"
            >
              <SwitchCamera className="w-5 h-5" />
              Switch Camera
            </Button>
            <Button
              onClick={stopCamera}
              disabled={isLoading}
              variant="outline"
              size="lg"
            >
              Stop
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
