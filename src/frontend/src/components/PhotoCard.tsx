import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ImageOff, Loader2, Play, Trash2, User, VideoOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { MediaItem } from "../backend";
import { MediaType } from "../backend";

const RETRY_DELAYS = [500, 1500, 3000];
const MAX_RETRIES = 3;

interface PhotoCardProps {
  photo: MediaItem;
  onDelete?: () => void;
  isDeleting?: boolean;
  username?: string | null;
}

export default function PhotoCard({
  photo,
  onDelete,
  isDeleting,
  username,
}: PhotoCardProps) {
  const mediaUrl = photo.blob.getDirectURL();
  const timestamp = new Date(Number(photo.timestamp) / 1000000);
  const ownerPrincipal = photo.owner.toString();
  const ownerShort = `${ownerPrincipal.slice(0, 5)}...${ownerPrincipal.slice(-3)}`;
  const isVideo = photo.mediaType === MediaType.video;

  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [imgRetryCount, setImgRetryCount] = useState(0);
  const [imgRetrying, setImgRetrying] = useState(false);
  const [imgSrc, setImgSrc] = useState(mediaUrl);

  const [videoError, setVideoError] = useState(false);
  const [videoRetryCount, setVideoRetryCount] = useState(0);
  const [videoRetrying, setVideoRetrying] = useState(false);
  const [videoSrc, setVideoSrc] = useState(mediaUrl);
  const [videoPlaying, setVideoPlaying] = useState(false);

  // Thumbnail state: loading -> seeked (visible frame) -> playing
  const [thumbState, setThumbState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const thumbVideoRef = useRef<HTMLVideoElement>(null);

  const imgRetryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRetryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (imgRetryTimer.current) clearTimeout(imgRetryTimer.current);
      if (videoRetryTimer.current) clearTimeout(videoRetryTimer.current);
    };
  }, []);

  const handleImgError = () => {
    if (imgRetryCount < MAX_RETRIES) {
      setImgRetrying(true);
      const delay = RETRY_DELAYS[imgRetryCount];
      imgRetryTimer.current = setTimeout(() => {
        const nextCount = imgRetryCount + 1;
        setImgRetryCount(nextCount);
        setImgSrc(`${mediaUrl}?retry=${nextCount}`);
        setImgRetrying(false);
      }, delay);
    } else {
      setImgError(true);
      setImgRetrying(false);
    }
  };

  const handleVideoError = () => {
    if (videoRetryCount < MAX_RETRIES) {
      setVideoRetrying(true);
      const delay = RETRY_DELAYS[videoRetryCount];
      videoRetryTimer.current = setTimeout(() => {
        const nextCount = videoRetryCount + 1;
        setVideoRetryCount(nextCount);
        setVideoSrc(`${mediaUrl}?retry=${nextCount}`);
        setVideoRetrying(false);
      }, delay);
    } else {
      setVideoError(true);
      setVideoRetrying(false);
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const MediaUnavailable = ({ type }: { type: "image" | "video" }) => (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-muted border-2 border-foreground">
      {type === "video" ? (
        <VideoOff
          className="w-10 h-10 text-muted-foreground"
          strokeWidth={1.5}
        />
      ) : (
        <ImageOff
          className="w-10 h-10 text-muted-foreground"
          strokeWidth={1.5}
        />
      )}
      <span className="text-xs font-black uppercase tracking-widest text-muted-foreground border-t-2 border-muted-foreground/30 pt-2">
        Media Unavailable
      </span>
    </div>
  );

  const RetryingSpinner = () => (
    <div
      data-ocid="photo.loading_state"
      className="absolute inset-0 flex items-center justify-center bg-muted"
    >
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
          Retrying
        </span>
      </div>
    </div>
  );

  const renderVideoContent = () => {
    if (videoError) return <MediaUnavailable type="video" />;
    if (videoRetrying) return <RetryingSpinner />;

    if (videoPlaying) {
      return (
        // biome-ignore lint/a11y/useMediaCaption: user-generated content without captions
        <video
          key={videoSrc}
          src={videoSrc}
          className="w-full h-full object-cover"
          controls
          autoPlay
          preload="auto"
          playsInline
          onError={handleVideoError}
        />
      );
    }

    // Thumbnail mode — use the video element itself as the thumbnail
    return (
      <>
        {/* Loading spinner while seeking to first frame */}
        {thumbState === "loading" && (
          <div
            data-ocid="photo.loading_state"
            className="absolute inset-0 flex items-center justify-center bg-muted"
          >
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Video element used as thumbnail — no canvas, no CORS issue */}
        {/* biome-ignore lint/a11y/useMediaCaption: thumbnail preview, not played */}
        <video
          ref={thumbVideoRef}
          key={videoSrc}
          src={videoSrc}
          className="w-full h-full object-cover"
          style={{
            opacity: thumbState === "ready" ? 1 : 0,
            transition: "opacity 0.2s",
          }}
          muted
          playsInline
          preload="metadata"
          onLoadedMetadata={() => {
            const v = thumbVideoRef.current;
            if (v) {
              v.currentTime = v.duration > 1 ? 1 : 0.5;
            }
          }}
          onSeeked={() => setThumbState("ready")}
          onError={() => setThumbState("error")}
        />

        {/* Error/fallback placeholder */}
        {thumbState === "error" && (
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20" />
        )}

        {/* Play button overlay */}
        <button
          type="button"
          data-ocid="photo.primary_button"
          aria-label="Play video"
          onClick={() => setVideoPlaying(true)}
          className="absolute inset-0 flex items-center justify-center group"
        >
          <div className="w-16 h-16 bg-foreground border-4 border-foreground flex items-center justify-center transition-transform group-hover:scale-110">
            <Play className="w-7 h-7 fill-background text-background ml-1" />
          </div>
        </button>
      </>
    );
  };

  return (
    <div className="border-2 border-foreground bg-card overflow-hidden">
      <div className="relative w-full aspect-square bg-muted">
        {isVideo ? (
          renderVideoContent()
        ) : imgError ? (
          <MediaUnavailable type="image" />
        ) : (
          <>
            {(!imgLoaded || imgRetrying) && (
              <div
                data-ocid="photo.loading_state"
                className="absolute inset-0 flex items-center justify-center bg-muted"
              >
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    {imgRetrying ? "Retrying" : "Loading"}
                  </span>
                </div>
              </div>
            )}
            {!imgRetrying && (
              <img
                key={imgSrc}
                src={imgSrc}
                alt={photo.caption || "Photo"}
                className={`w-full h-full object-cover transition-opacity duration-200 ${
                  imgLoaded ? "opacity-100" : "opacity-0"
                }`}
                loading="lazy"
                onLoad={() => setImgLoaded(true)}
                onError={handleImgError}
              />
            )}
          </>
        )}
        {isVideo && !videoError && !videoRetrying && !videoPlaying && (
          <div className="absolute top-2 left-2 bg-foreground text-background px-2 py-0.5 text-xs font-bold uppercase tracking-widest flex items-center gap-1 pointer-events-none z-10">
            <Play className="w-3 h-3 fill-background" />
            VIDEO
          </div>
        )}
        {onDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                data-ocid="photo.delete_button"
                disabled={isDeleting}
                className="absolute top-2 right-2 w-8 h-8 bg-destructive border-2 border-foreground flex items-center justify-center hover:bg-destructive/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
                aria-label="Delete media"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 text-white" />
                )}
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent
              data-ocid="photo.dialog"
              className="rounded-none border-2 border-foreground"
            >
              <AlertDialogHeader>
                <AlertDialogTitle className="font-black uppercase tracking-widest">
                  Delete this {isVideo ? "video" : "photo"}?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  This action cannot be undone. The{" "}
                  {isVideo ? "video" : "photo"} will be permanently removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel
                  data-ocid="photo.cancel_button"
                  className="rounded-none border-2 border-foreground font-bold uppercase tracking-wide"
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  data-ocid="photo.confirm_button"
                  onClick={onDelete}
                  className="rounded-none bg-destructive text-white border-2 border-foreground font-bold uppercase tracking-wide hover:bg-destructive/80"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-primary flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate uppercase tracking-wide">
              {username ?? ownerShort}
            </p>
            <p className="text-xs text-muted-foreground font-medium">
              {formatDate(timestamp)}
            </p>
          </div>
        </div>
        {photo.caption && (
          <p className="mt-3 text-sm leading-relaxed border-t-2 border-muted pt-3">
            {photo.caption}
          </p>
        )}
      </div>
    </div>
  );
}
