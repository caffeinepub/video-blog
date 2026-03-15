import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Camera, Loader2 } from "lucide-react";
import type { Photo } from "../backend";
import { useActor } from "../hooks/useActor";
import { useGetFriends, useGetMyPhotos } from "../hooks/useQueries";
import PhotoCard from "./PhotoCard";

export default function PhotoFeed() {
  const myPhotosQuery = useGetMyPhotos();
  const friendsQuery = useGetFriends();
  const { actor, isFetching: actorFetching } = useActor();
  const navigate = useNavigate();

  // Fetch all friend photos in a single query
  const friendPhotosQuery = useQuery<Photo[]>({
    queryKey: [
      "allFriendPhotos",
      friendsQuery.data?.map((f) => f.toString()).join(","),
    ],
    queryFn: async () => {
      if (!actor || !friendsQuery.data || friendsQuery.data.length === 0)
        return [];

      const photoPromises = friendsQuery.data.map((friend) =>
        actor.getFriendPhotos(friend),
      );
      const photoArrays = await Promise.all(photoPromises);
      return photoArrays.flat();
    },
    enabled:
      !!actor &&
      !actorFetching &&
      !!friendsQuery.data &&
      friendsQuery.data.length > 0,
  });

  const isLoading =
    myPhotosQuery.isLoading ||
    friendsQuery.isLoading ||
    (friendsQuery.data &&
      friendsQuery.data.length > 0 &&
      friendPhotosQuery.isLoading);
  const hasError =
    myPhotosQuery.isError || friendsQuery.isError || friendPhotosQuery.isError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (hasError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load photos. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  const allPhotos: Photo[] = [
    ...(myPhotosQuery.data || []),
    ...(friendPhotosQuery.data || []),
  ];

  const sortedPhotos = allPhotos.sort((a, b) => {
    const timeA = Number(a.timestamp);
    const timeB = Number(b.timestamp);
    return timeB - timeA;
  });

  if (sortedPhotos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <Camera className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No photos yet</h3>
        <p className="text-muted-foreground mb-6 max-w-sm">
          Start capturing moments or add friends to see their photos in your
          feed.
        </p>
        <div className="flex gap-2">
          <Button
            onClick={() => navigate({ to: "/capture" })}
            className="gap-2"
          >
            <Camera className="w-4 h-4" />
            Capture Photo
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate({ to: "/friends" })}
          >
            Add Friends
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {sortedPhotos.map((photo, index) => (
        <PhotoCard
          key={`${photo.owner.toString()}-${photo.timestamp}-${index}`}
          photo={photo}
        />
      ))}
    </div>
  );
}
