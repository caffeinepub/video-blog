# Video Blog

## Current State
The backend stores photos in a `Map<Principal, Photo>`, which maps each user to a single photo. Every new upload overwrites the previous one.

## Requested Changes (Diff)

### Add
- Nothing new UI-wise.

### Modify
- Backend: Change photo storage from `Map<Principal, Photo>` (one per user) to `Map<Principal, [Photo]>` (list per user), so all uploaded photos are retained.
- Backend: Update `uploadPhoto` to append to the user's list.
- Backend: Update `getMyPhotos` and `getFriendPhotos` to return all photos for a user, sorted newest-first.

### Remove
- Nothing.

## Implementation Plan
1. Replace `Map<Principal, Photo>` with a structure that holds multiple photos per user.
2. `uploadPhoto`: push new photo onto the user's list.
3. `getMyPhotos` / `getFriendPhotos`: return all photos for the given principal, sorted by descending timestamp.
