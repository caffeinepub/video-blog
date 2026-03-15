import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import CameraCapture from "../components/CameraCapture";
import PhotoUploadForm from "../components/PhotoUploadForm";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function CapturePage() {
  const [capturedPhoto, setCapturedPhoto] = useState<File | null>(null);
  const { identity, login, isLoggingIn } = useInternetIdentity();
  const navigate = useNavigate();

  if (!identity) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h2 className="text-3xl font-display font-black uppercase tracking-tight mb-4">
          Login Required
        </h2>
        <div className="w-16 h-1 bg-primary mb-6" />
        <p className="text-muted-foreground mb-8 max-w-md font-medium">
          You need to login to capture and share photos.
        </p>
        <Button
          size="lg"
          onClick={login}
          disabled={isLoggingIn}
          data-ocid="capture.login.primary_button"
          className="bg-primary text-primary-foreground border-2 border-primary font-bold uppercase tracking-widest hover:bg-foreground hover:border-foreground"
        >
          {isLoggingIn ? "Connecting..." : "Login to Continue"}
        </Button>
      </div>
    );
  }

  const handlePhotoCapture = (photo: File) => {
    setCapturedPhoto(photo);
  };

  const handleUploadComplete = () => {
    setCapturedPhoto(null);
    navigate({ to: "/" });
  };

  const handleCancel = () => {
    setCapturedPhoto(null);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          data-ocid="capture.back.button"
          className="flex items-center gap-2 mb-6 text-sm font-bold uppercase tracking-wide border-2 border-foreground px-3 py-2 hover:bg-foreground hover:text-background transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Feed
        </button>
        <div className="border-l-4 border-primary pl-4">
          <h2 className="text-3xl font-display font-black uppercase tracking-tight">
            Capture Photo
          </h2>
          <p className="text-muted-foreground text-sm font-medium">
            Take a photo to share with your friends
          </p>
        </div>
      </div>

      {!capturedPhoto ? (
        <CameraCapture onPhotoCapture={handlePhotoCapture} />
      ) : (
        <PhotoUploadForm
          photo={capturedPhoto}
          onUploadComplete={handleUploadComplete}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
