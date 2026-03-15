import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface InviteCode {
    created: Time;
    code: string;
    used: boolean;
}
export type Time = bigint;
export interface MediaItem {
    owner: Principal;
    blob: ExternalBlob;
    timestamp: Time;
    caption?: string;
    mediaType: MediaType;
}
export interface UserProfile {
    username?: string;
}
export interface RSVP {
    name: string;
    inviteCode: string;
    timestamp: Time;
    attending: boolean;
}
export enum MediaType {
    video = "video",
    photo = "photo"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addFriend(friend: Principal): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteMedia(timestamp: Time): Promise<void>;
    generateInviteCode(): Promise<string>;
    getAllRSVPs(): Promise<Array<RSVP>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getFriends(): Promise<Array<Principal>>;
    getInviteCodes(): Promise<Array<InviteCode>>;
    getMyMedia(): Promise<Array<MediaItem>>;
    getUserMedia(user: Principal): Promise<Array<MediaItem>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUsername(user: Principal): Promise<string | null>;
    isCallerAdmin(): Promise<boolean>;
    registerWithInviteCode(inviteCode: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setUsername(username: string): Promise<void>;
    submitRSVP(name: string, attending: boolean, inviteCode: string): Promise<void>;
    uploadMedia(blob: ExternalBlob, caption: string | null, mediaType: MediaType): Promise<void>;
}
