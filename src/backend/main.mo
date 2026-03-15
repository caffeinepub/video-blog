import Map "mo:core/Map";
import Array "mo:core/Array";
import Set "mo:core/Set";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Random "mo:core/Random";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";

import InviteLinksModule "invite-links/invite-links-module";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";


actor {
  include MixinStorage();

  // Initialize the access control state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type MediaType = {
    #photo;
    #video;
  };

  public type MediaItem = {
    owner : Principal;
    timestamp : Time.Time;
    caption : ?Text;
    blob : Storage.ExternalBlob;
    mediaType : MediaType;
  };

  module MediaItem {
    public func compare(item1 : MediaItem, item2 : MediaItem) : Order.Order {
      switch (Int.compare(item2.timestamp, item1.timestamp)) {
        case (#equal) { Principal.compare(item1.owner, item2.owner) };
        case (order) { order };
      };
    };
  };

  public type UserProfile = {
    username : ?Text;
  };

  let mediaItems = Map.empty<Principal, [MediaItem]>();
  let friends = Map.empty<Principal, Set.Set<Principal>>();
  let usernames = Map.empty<Principal, Text>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let inviteState = InviteLinksModule.initState();

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Media Management
  public shared ({ caller }) func uploadMedia(blob : Storage.ExternalBlob, caption : ?Text, mediaType : MediaType) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upload media");
    };

    let mediaItem : MediaItem = {
      owner = caller;
      caption;
      blob;
      timestamp = Time.now();
      mediaType;
    };

    let userMedia = switch (mediaItems.get(caller)) {
      case (?existing) { existing };
      case (null) { [] };
    };

    let newSize = userMedia.size() + 1;
    let newMedia = Array.tabulate(
      newSize,
      func(i) {
        if (i == 0) { mediaItem } else {
          userMedia[i - 1];
        };
      },
    );

    mediaItems.add(caller, newMedia);
  };

  public shared ({ caller }) func deleteMedia(timestamp : Time.Time) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete media");
    };

    let userMedia = switch (mediaItems.get(caller)) {
      case (?existing) { existing };
      case (null) { return };
    };

    let filtered = userMedia.filter(func(m : MediaItem) : Bool {
      m.timestamp != timestamp;
    });

    mediaItems.add(caller, filtered);
  };

  public query ({ caller }) func getMyMedia() : async [MediaItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their media");
    };

    switch (mediaItems.get(caller)) {
      case (?userMedia) { userMedia };
      case (null) { [] };
    };
  };

  public query ({ caller }) func getUserMedia(user : Principal) : async [MediaItem] {
    // Any authenticated user can view other users' media (public feed)
    // No authorization check needed - this is a public feed feature
    switch (mediaItems.get(user)) {
      case (?userMedia) { userMedia };
      case (null) { [] };
    };
  };

  // Friend Management
  public shared ({ caller }) func addFriend_(friend : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add friends");
    };

    if (friend == caller) {
      Runtime.trap("Cannot add yourself as a friend");
    };

    let existingFriends = switch (friends.get(caller)) {
      case (?friends) { friends };
      case (null) {
        let newFriends = Set.singleton(friend);
        friends.add(caller, newFriends);
        newFriends;
      };
    };

    existingFriends.add(friend);
  };

  public query ({ caller }) func getFriends_() : async [Principal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their friends");
    };

    switch (friends.get(caller)) {
      case (?friends) { friends.toArray() };
      case (null) { [] };
    };
  };

  // Username Management
  public shared ({ caller }) func setUsername(username : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can set usernames");
    };

    if (username.size() > 50) {
      Runtime.trap("Username must be under 50 characters");
    };
    usernames.add(caller, username);
  };

  public query ({ caller }) func getUsername(user : Principal) : async ?Text {
    // Public function - anyone can get usernames for display purposes
    // No authorization check needed
    usernames.get(user);
  };

  // Invite Links Functionality - any authenticated user can generate invite codes
  public shared ({ caller }) func generateInviteCode() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can generate invite codes");
    };
    let blob = await Random.blob();
    let code = InviteLinksModule.generateUUID(blob);
    InviteLinksModule.generateInviteCode(inviteState, code);
    code;
  };

  public shared ({ caller }) func submitRSVP(name : Text, attending : Bool, inviteCode : Text) : async () {
    // Public function - anyone can submit RSVP with valid invite code
    // No authorization check needed
    InviteLinksModule.submitRSVP(inviteState, name, attending, inviteCode);
  };

  public query ({ caller }) func getAllRSVPs() : async [InviteLinksModule.RSVP] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view RSVPs");
    };
    InviteLinksModule.getAllRSVPs(inviteState);
  };

  public query ({ caller }) func getInviteCodes() : async [InviteLinksModule.InviteCode] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view invite codes");
    };
    InviteLinksModule.getInviteCodes(inviteState);
  };
};
