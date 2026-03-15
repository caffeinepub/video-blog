import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ExternalBlob, Photo } from "../backend";
import { useActor } from "./useActor";

export function useGetMyPhotos() {
  const { actor, isFetching } = useActor();

  return useQuery<Photo[]>({
    queryKey: ["myPhotos"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyPhotos();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetFriends() {
  const { actor, isFetching } = useActor();

  return useQuery<Principal[]>({
    queryKey: ["friends"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFriends();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUploadPhoto() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      blob,
      caption,
    }: { blob: ExternalBlob; caption: string | null }) => {
      if (!actor) throw new Error("Actor not initialized");
      await actor.uploadPhoto(blob, caption);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myPhotos"] });
      queryClient.invalidateQueries({ queryKey: ["allFriendPhotos"] });
    },
  });
}

export function useAddFriend() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (friend: Principal) => {
      if (!actor) throw new Error("Actor not initialized");
      await actor.addFriend(friend);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["allFriendPhotos"] });
    },
  });
}
