import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, Circle, Square, SwitchCamera, Video } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface VideoCaptureProps {
  onVideoCapture: (video: File) => void;
}

export default function VideoCapture({ onVideoCapture }: VideoCaptureProps) {
  const [isActive, setIsActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment",
  );

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  }, []);

  useEffect(() => {
    return () => {
      stopStream();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stopStream]);

  const startCamera = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setIsActive(true);
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setError(
          "Camera/microphone permission denied. Please allow access in your browser settings.",
        );
      } else if (err.name === "NotFoundError") {
        setError("No camera device found.");
      } else {
        setError("Failed to start camera.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    setRecordingDuration(0);

    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : MediaRecorder.isTypeSupported("video/webm")
        ? "video/webm"
        : "video/mp4";

    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const ext = mimeType.includes("mp4") ? "mp4" : "webm";
      const file = new File([blob], `video_${Date.now()}.${ext}`, {
        type: mimeType,
      });
      onVideoCapture(file);
      stopStream();
    };

    recorder.start(100);
    setIsRecording(true);

    timerRef.current = setInterval(() => {
      setRecordingDuration((d) => d + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const switchCamera = async () => {
    const newFacing = facingMode === "user" ? "environment" : "user";
    setFacingMode(newFacing);
    if (isActive) {
      stopStream();
      setIsActive(false);
      // Restart with new facing mode
      setIsLoading(true);
      setError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: newFacing,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: true,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setIsActive(true);
      } catch {
        setError("Failed to switch camera.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="space-y-4">
      <div className="relative w-full aspect-[4/3] bg-foreground border-2 border-foreground overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ display: isActive ? "block" : "none" }}
        />
        {!isActive && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-background">
              <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-sm font-bold uppercase tracking-widest opacity-50">
                Camera Preview
              </p>
            </div>
          </div>
        )}
        {isRecording && (
          <div className="absolute top-3 left-3 flex items-center gap-2 bg-destructive px-3 py-1.5 border-2 border-background">
            <Circle className="w-3 h-3 fill-background text-background animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest text-background">
              REC {formatDuration(recordingDuration)}
            </span>
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive" data-ocid="video.error_state">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap gap-2">
        {!isActive ? (
          <Button
            onClick={startCamera}
            disabled={isLoading}
            size="lg"
            data-ocid="video.primary_button"
            className="flex-1 gap-2 border-2 border-foreground bg-primary text-primary-foreground font-bold uppercase tracking-widest hover:bg-foreground hover:border-foreground"
          >
            <Video className="w-5 h-5" />
            {isLoading ? "Starting..." : error ? "Retry" : "Start Camera"}
          </Button>
        ) : !isRecording ? (
          <>
            <Button
              onClick={startRecording}
              size="lg"
              data-ocid="video.primary_button"
              className="flex-1 gap-2 border-2 border-destructive bg-destructive text-white font-bold uppercase tracking-widest hover:opacity-90"
            >
              <Circle className="w-5 h-5 fill-white" />
              Record
            </Button>
            <Button
              onClick={switchCamera}
              variant="outline"
              size="lg"
              className="gap-2 border-2 border-foreground font-bold uppercase tracking-wide hover:bg-foreground hover:text-background"
            >
              <SwitchCamera className="w-5 h-5" />
              <span className="hidden sm:inline">Switch</span>
            </Button>
            <Button
              onClick={stopStream}
              variant="outline"
              size="lg"
              className="border-2 border-foreground font-bold uppercase tracking-wide hover:bg-foreground hover:text-background"
            >
              Stop
            </Button>
          </>
        ) : (
          <Button
            onClick={stopRecording}
            size="lg"
            data-ocid="video.primary_button"
            className="flex-1 gap-2 border-2 border-foreground bg-foreground text-background font-bold uppercase tracking-widest hover:opacity-90"
          >
            <Square className="w-5 h-5 fill-background" />
            Stop Recording
          </Button>
        )}
      </div>
    </div>
  );
}
