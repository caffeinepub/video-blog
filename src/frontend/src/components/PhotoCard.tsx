import { User } from "lucide-react";
import type { Photo } from "../backend";

interface PhotoCardProps {
  photo: Photo;
}

export default function PhotoCard({ photo }: PhotoCardProps) {
  const imageUrl = photo.blob.getDirectURL();
  const timestamp = new Date(Number(photo.timestamp) / 1000000);
  const ownerPrincipal = photo.owner.toString();
  const ownerShort = `${ownerPrincipal.slice(0, 5)}...${ownerPrincipal.slice(-3)}`;

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

  return (
    <div className="border-2 border-foreground bg-card overflow-hidden">
      <div className="relative w-full aspect-square bg-muted">
        <img
          src={imageUrl}
          alt={photo.caption || "Photo"}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-primary flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate uppercase tracking-wide">
              {ownerShort}
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
