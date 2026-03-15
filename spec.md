# Video Blog

## Current State
Invite link generation exists on the Friends page but fails for regular users because the backend `generateInviteCode` function is restricted to admins only.

## Requested Changes (Diff)

### Add
- Nothing new

### Modify
- `generateInviteCode` backend function: change permission check from admin-only to any authenticated user

### Remove
- Nothing

## Implementation Plan
1. Update `generateInviteCode` in `main.mo` to allow any authenticated user (not just admins) to generate invite codes.
