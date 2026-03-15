import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Camera, Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { MediaItem } from "../backend";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetFriends, useGetMyMedia } from "../hooks/useQueries";
import PhotoCard from "./PhotoCard";

export default function PhotoFeed() {
  const myMediaQuery = useGetMyMedia();
  const friendsQuery = useGetFriends();
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deletingTimestamp, setDeletingTimestamp] = useState<bigint | null>(
    null,
  );

  const myPrincipal = identity?.getPrincipal().toString();

  // Fetch all friend media in a single query
  const friendMediaQuery = useQuery<MediaItem[]>({
    queryKey: [
      "allFriendMedia",
      friendsQuery.data?.map((f) => f.toString()).join(","),
    ],
    queryFn: async () => {
      if (!actor || !friendsQuery.data || friendsQuery.data.length === 0)
        return [];

      const mediaPromises = friendsQuery.data.map((friend) =>
        actor.getUserMedia(friend),
      );
      const mediaArrays = await Promise.all(mediaPromises);
      return mediaArrays.flat();
    },
    enabled:
      !!actor &&
      !actorFetching &&
      !!friendsQuery.data &&
      friendsQuery.data.length > 0,
  });

  // Fetch usernames for all unique owners
  const allMedia: MediaItem[] = [
    ...(myMediaQuery.data || []),
    ...(friendMediaQuery.data || []),
  ];
  const uniqueOwners = Array.from(
    new Set(allMedia.map((m) => m.owner.toString())),
  );

  const usernamesQuery = useQuery<Record<string, string | null>>({
    queryKey: ["usernames", uniqueOwners.join(",")],
    queryFn: async () => {
      if (!actor || uniqueOwners.length === 0) return {};
      const results = await Promise.all(
        allMedia
          .filter(
            (m, i, arr) =>
              arr.findIndex(
                (x) => x.owner.toString() === m.owner.toString(),
              ) === i,
          )
          .map(async (m) => {
            const name = await actor.getUsername(m.owner);
            return [m.owner.toString(), name] as [string, string | null];
          }),
      );
      return Object.fromEntries(results);
    },
    enabled: !!actor && !actorFetching && uniqueOwners.length > 0,
    staleTime: 30_000,
  });

  const handleDelete = async (timestamp: bigint) => {
    if (!actor) return;
    setDeletingTimestamp(timestamp);
    try {
      await actor.deleteMedia(timestamp);
      await queryClient.invalidateQueries({ queryKey: ["myMedia"] });
      await queryClient.invalidateQueries({ queryKey: ["allFriendMedia"] });
      toast.success("Deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete");
    } finally {
      setDeletingTimestamp(null);
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["myMedia"] });
    queryClient.invalidateQueries({ queryKey: ["allFriendMedia"] });
    queryClient.invalidateQueries({ queryKey: ["friends"] });
  };

  const isLoading =
    myMediaQuery.isLoading ||
    friendsQuery.isLoading ||
    (friendsQuery.data &&
      friendsQuery.data.length > 0 &&
      friendMediaQuery.isLoading);

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center py-12"
        data-ocid="feed.loading_state"
      >
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (myMediaQuery.isError) {
    return (
      <div
        data-ocid="feed.error_state"
        className="border-2 border-destructive bg-destructive/10 p-6"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-destructive flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-black uppercase tracking-widest text-sm text-foreground mb-1">
              Feed Unavailable
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Could not load your media. This may be a permissions or
              connectivity issue. Try refreshing the page.
            </p>
            <Button
              onClick={handleRefresh}
              data-ocid="feed.secondary_button"
              className="gap-2 rounded-none border-2 border-foreground bg-foreground text-background font-bold uppercase tracking-wide text-xs hover:bg-foreground/80"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (friendsQuery.isError || friendMediaQuery.isError) {
    // Non-critical error — still show own media but surface a warning
    return (
      <div className="space-y-4">
        <Alert
          variant="destructive"
          data-ocid="feed.error_state"
          className="rounded-none border-2 border-destructive"
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="font-bold uppercase tracking-wide text-xs">
            Some content could not load. Try refreshing if items are missing.{" "}
            <button
              type="button"
              onClick={handleRefresh}
              className="underline cursor-pointer"
              data-ocid="feed.secondary_button"
            >
              Refresh
            </button>
          </AlertDescription>
        </Alert>
        <FeedGrid
          media={allMedia}
          myPrincipal={myPrincipal}
          usernamesQuery={usernamesQuery}
          deletingTimestamp={deletingTimestamp}
          onDelete={handleDelete}
          onNavigate={navigate}
        />
      </div>
    );
  }

  return (
    <FeedGrid
      media={allMedia}
      myPrincipal={myPrincipal}
      usernamesQuery={usernamesQuery}
      deletingTimestamp={deletingTimestamp}
      onDelete={handleDelete}
      onNavigate={navigate}
    />
  );
}

function FeedGrid({
  media,
  myPrincipal,
  usernamesQuery,
  deletingTimestamp,
  onDelete,
  onNavigate,
}: {
  media: MediaItem[];
  myPrincipal: string | undefined;
  usernamesQuery: { data?: Record<string, string | null> };
  deletingTimestamp: bigint | null;
  onDelete: (ts: bigint) => Promise<void>;
  onNavigate: (args: { to: string }) => void;
}) {
  const sortedMedia = [...media].sort(
    (a, b) => Number(b.timestamp) - Number(a.timestamp),
  );

  if (sortedMedia.length === 0) {
    return (
      <div
        data-ocid="feed.empty_state"
        className="flex flex-col items-center justify-center py-12 text-center px-4"
      >
        <div className="w-20 h-20 border-2 border-foreground bg-muted flex items-center justify-center mb-4">
          <Camera className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-display font-black uppercase tracking-tight mb-2">
          No Media Yet
        </h3>
        <p className="text-muted-foreground mb-6 max-w-sm font-medium">
          Start capturing moments or add friends to see their content in your
          feed.
        </p>
        <div className="flex gap-2">
          <Button
            onClick={() => onNavigate({ to: "/capture" })}
            data-ocid="feed.primary_button"
            className="gap-2 border-2 border-foreground font-bold uppercase tracking-wide bg-primary text-primary-foreground hover:bg-foreground hover:border-foreground"
          >
            <Camera className="w-4 h-4" />
            Capture Media
          </Button>
          <Button
            variant="outline"
            onClick={() => onNavigate({ to: "/friends" })}
            data-ocid="feed.secondary_button"
            className="border-2 border-foreground font-bold uppercase tracking-wide hover:bg-foreground hover:text-background"
          >
            Add Friends
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {sortedMedia.map((item, index) => {
        const isOwnMedia = myPrincipal && item.owner.toString() === myPrincipal;
        const username = usernamesQuery.data?.[item.owner.toString()] ?? null;
        return (
          <div
            key={`${item.owner.toString()}-${item.timestamp}-${index}`}
            data-ocid={`feed.item.${index + 1}`}
          >
            <PhotoCard
              photo={item}
              onDelete={isOwnMedia ? () => onDelete(item.timestamp) : undefined}
              isDeleting={deletingTimestamp === item.timestamp}
              username={username}
            />
          </div>
        );
      })}
    </div>
  );
}
