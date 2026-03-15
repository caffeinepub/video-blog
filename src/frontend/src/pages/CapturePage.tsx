import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Camera, Video } from "lucide-react";
import { useState } from "react";
import { MediaType } from "../backend";
import CameraCapture from "../components/CameraCapture";
import PhotoUploadForm from "../components/PhotoUploadForm";
import VideoCapture from "../components/VideoCapture";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

type Mode = "photo" | "video";

export default function CapturePage() {
  const [mode, setMode] = useState<Mode>("photo");
  const [capturedMedia, setCapturedMedia] = useState<File | null>(null);
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
          You need to login to capture and share media.
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

  const handleMediaCapture = (media: File) => {
    setCapturedMedia(media);
  };

  const handleUploadComplete = () => {
    setCapturedMedia(null);
    navigate({ to: "/" });
  };

  const handleCancel = () => {
    setCapturedMedia(null);
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
            Capture Media
          </h2>
          <p className="text-muted-foreground text-sm font-medium">
            Take a photo or record a video to share with friends
          </p>
        </div>
      </div>

      {!capturedMedia && (
        <div className="flex mb-6 border-2 border-foreground">
          <button
            type="button"
            onClick={() => setMode("photo")}
            data-ocid="capture.photo.tab"
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-black uppercase tracking-widest transition-colors ${
              mode === "photo"
                ? "bg-foreground text-background"
                : "bg-background text-foreground hover:bg-muted"
            }`}
          >
            <Camera className="w-4 h-4" />
            Photo
          </button>
          <button
            type="button"
            onClick={() => setMode("video")}
            data-ocid="capture.video.tab"
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-black uppercase tracking-widest transition-colors border-l-2 border-foreground ${
              mode === "video"
                ? "bg-foreground text-background"
                : "bg-background text-foreground hover:bg-muted"
            }`}
          >
            <Video className="w-4 h-4" />
            Video
          </button>
        </div>
      )}

      {!capturedMedia ? (
        mode === "photo" ? (
          <CameraCapture onPhotoCapture={handleMediaCapture} />
        ) : (
          <VideoCapture onVideoCapture={handleMediaCapture} />
        )
      ) : (
        <PhotoUploadForm
          photo={capturedMedia}
          mediaType={mode === "video" ? MediaType.video : MediaType.photo}
          onUploadComplete={handleUploadComplete}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
