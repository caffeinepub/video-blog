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
export interface Photo {
    owner: Principal;
    blob: ExternalBlob;
    timestamp: Time;
    caption?: string;
}
export type Time = bigint;
export interface backendInterface {
    addFriend(friend: Principal): Promise<void>;
    getFriendPhotos(friend: Principal): Promise<Array<Photo>>;
    getFriends(): Promise<Array<Principal>>;
    getMyPhotos(): Promise<Array<Photo>>;
    uploadPhoto(blob: ExternalBlob, caption: string | null): Promise<void>;
}
