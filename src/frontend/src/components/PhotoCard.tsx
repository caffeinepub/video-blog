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
import { useState } from "react";
import type { MediaItem } from "../backend";
import { MediaType } from "../backend";

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
  const [videoError, setVideoError] = useState(false);

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

  return (
    <div className="border-2 border-foreground bg-card overflow-hidden">
      <div className="relative w-full aspect-square bg-muted">
        {isVideo ? (
          videoError ? (
            <MediaUnavailable type="video" />
          ) : (
            // biome-ignore lint/a11y/useMediaCaption: user-generated content without captions
            <video
              src={mediaUrl}
              className="w-full h-full object-cover"
              controls
              preload="metadata"
              playsInline
              onError={() => setVideoError(true)}
            />
          )
        ) : imgError ? (
          <MediaUnavailable type="image" />
        ) : (
          <>
            {!imgLoaded && (
              <div
                data-ocid="photo.loading_state"
                className="absolute inset-0 flex items-center justify-center bg-muted"
              >
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    Loading
                  </span>
                </div>
              </div>
            )}
            <img
              src={mediaUrl}
              alt={photo.caption || "Photo"}
              className={`w-full h-full object-cover transition-opacity duration-200 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
          </>
        )}
        {isVideo && !videoError && (
          <div className="absolute top-2 left-2 bg-foreground text-background px-2 py-0.5 text-xs font-bold uppercase tracking-widest flex items-center gap-1">
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
                className="absolute top-2 right-2 w-8 h-8 bg-destructive border-2 border-foreground flex items-center justify-center hover:bg-destructive/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
