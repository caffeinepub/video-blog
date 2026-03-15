import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ExternalBlob, MediaItem } from "../backend";
import { MediaType, UserRole } from "../backend";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

const retryConfig = {
  retry: 3,
  retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 10000),
};

export function useGetMyMedia() {
  const { actor, isFetching } = useActor();

  return useQuery<MediaItem[]>({
    queryKey: ["myMedia"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyMedia();
    },
    enabled: !!actor && !isFetching,
    ...retryConfig,
  });
}

// Keep old name as alias for backward compat
export const useGetMyPhotos = useGetMyMedia;

export function useGetFriends() {
  const { actor, isFetching } = useActor();

  return useQuery<Principal[]>({
    queryKey: ["friends"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFriends();
    },
    enabled: !!actor && !isFetching,
    ...retryConfig,
  });
}

export function useUploadMedia() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      blob,
      caption,
      mediaType,
    }: {
      blob: ExternalBlob;
      caption: string | null;
      mediaType?: MediaType;
    }) => {
      if (!actor) throw new Error("Actor not initialized");
      await actor.uploadMedia(blob, caption, mediaType ?? MediaType.photo);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myMedia"] });
      queryClient.invalidateQueries({ queryKey: ["allFriendMedia"] });
    },
  });
}

// Keep old name as alias
export const useUploadPhoto = useUploadMedia;

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
      queryClient.invalidateQueries({ queryKey: ["allFriendMedia"] });
    },
  });
}

export function useGetUsername(principal: Principal | null) {
  const { actor, isFetching } = useActor();
  const principalStr = principal?.toString() ?? null;

  return useQuery<string | null>({
    queryKey: ["username", principalStr],
    queryFn: async () => {
      if (!actor || !principal) return null;
      return actor.getUsername(principal);
    },
    enabled: !!actor && !isFetching && !!principal,
    staleTime: 60_000,
  });
}

export function useSetUsername() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (username: string) => {
      if (!actor) throw new Error("Actor not initialized");
      await actor.setUsername(username);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["username"] });
    },
  });
}

export function useGenerateInviteCode() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.generateInviteCode();
    },
  });
}

export function useSubmitRSVP() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({
      name,
      attending,
      inviteCode,
    }: { name: string; attending: boolean; inviteCode: string }) => {
      if (!actor) throw new Error("Actor not initialized");
      await actor.submitRSVP(name, attending, inviteCode);
    },
  });
}

export function useCallerUserRole() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<UserRole>({
    queryKey: ["callerUserRole"],
    queryFn: async () => {
      if (!actor) return UserRole.guest;
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching && !!identity,
    staleTime: 30_000,
  });
}

export function useRegisterWithInviteCode() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      if (!actor) throw new Error("Actor not initialized");
      await (actor as any).registerWithInviteCode(inviteCode);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["callerUserRole"] });
    },
  });
}
