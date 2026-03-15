import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Camera, Loader2 } from "lucide-react";
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

  const isLoading =
    myMediaQuery.isLoading ||
    friendsQuery.isLoading ||
    (friendsQuery.data &&
      friendsQuery.data.length > 0 &&
      friendMediaQuery.isLoading);
  const hasError =
    myMediaQuery.isError || friendsQuery.isError || friendMediaQuery.isError;

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

  if (hasError) {
    return (
      <Alert variant="destructive" data-ocid="feed.error_state">
        <AlertDescription>
          Failed to load media. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  const sortedMedia = allMedia.sort((a, b) => {
    return Number(b.timestamp) - Number(a.timestamp);
  });

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
            onClick={() => navigate({ to: "/capture" })}
            data-ocid="feed.primary_button"
            className="gap-2 border-2 border-foreground font-bold uppercase tracking-wide bg-primary text-primary-foreground hover:bg-foreground hover:border-foreground"
          >
            <Camera className="w-4 h-4" />
            Capture Media
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate({ to: "/friends" })}
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
              onDelete={
                isOwnMedia ? () => handleDelete(item.timestamp) : undefined
              }
              isDeleting={deletingTimestamp === item.timestamp}
              username={username}
            />
          </div>
        );
      })}
    </div>
  );
}
