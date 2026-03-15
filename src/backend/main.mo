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

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type MediaType = { #photo; #video };

  public type MediaItem = {
    owner : Principal;
    timestamp : Time.Time;
    caption : ?Text;
    blob : Storage.ExternalBlob;
    mediaType : MediaType;
  };

  module MediaItem {
    public func compare(a : MediaItem, b : MediaItem) : Order.Order {
      switch (Int.compare(b.timestamp, a.timestamp)) {
        case (#equal) { Principal.compare(a.owner, b.owner) };
        case (order) { order };
      };
    };
  };

  public type UserProfile = { username : ?Text };

  let mediaItems = Map.empty<Principal, [MediaItem]>();
  let friends = Map.empty<Principal, Set.Set<Principal>>();
  let usernames = Map.empty<Principal, Text>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let inviteState = InviteLinksModule.initState();

  public shared ({ caller }) func registerWithInviteCode(inviteCode : Text) : async () {
    if (caller.isAnonymous()) Runtime.trap("Must be logged in to register");
    switch (accessControlState.userRoles.get(caller)) {
      case (?_) { Runtime.trap("Already registered") };
      case (null) {};
    };
    switch (inviteState.inviteCodes.get(inviteCode)) {
      case (null) { Runtime.trap("Invalid invite code") };
      case (?invite) {
        if (invite.used) Runtime.trap("Invite code already used");
        inviteState.inviteCodes.add(inviteCode, { invite with used = true });
      };
    };
    accessControlState.userRoles.add(caller, #user);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) Runtime.trap("Unauthorized");
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func uploadMedia(blob : Storage.ExternalBlob, caption : ?Text, mediaType : MediaType) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    let item : MediaItem = { owner = caller; caption; blob; timestamp = Time.now(); mediaType };
    let existing = switch (mediaItems.get(caller)) { case (?e) e; case (null) [] };
    let n = existing.size() + 1;
    mediaItems.add(caller, Array.tabulate(n, func(i) { if (i == 0) item else existing[i - 1] }));
  };

  public shared ({ caller }) func deleteMedia(timestamp : Time.Time) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    let existing = switch (mediaItems.get(caller)) { case (?e) e; case (null) { return } };
    mediaItems.add(caller, existing.filter(func(m : MediaItem) : Bool { m.timestamp != timestamp }));
  };

  public query ({ caller }) func getMyMedia() : async [MediaItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    switch (mediaItems.get(caller)) { case (?m) m; case (null) [] };
  };

  public query ({ caller }) func getUserMedia(user : Principal) : async [MediaItem] {
    switch (mediaItems.get(user)) { case (?m) m; case (null) [] };
  };

  public shared ({ caller }) func addFriend_(friend : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    if (friend == caller) Runtime.trap("Cannot add yourself as a friend");
    let fs = switch (friends.get(caller)) {
      case (?s) s;
      case (null) { let s = Set.singleton(friend); friends.add(caller, s); s };
    };
    fs.add(friend);
  };

  public query ({ caller }) func getFriends_() : async [Principal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    switch (friends.get(caller)) { case (?s) s.toArray(); case (null) [] };
  };

  public shared ({ caller }) func setUsername(username : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    if (username.size() > 50) Runtime.trap("Username must be under 50 characters");
    usernames.add(caller, username);
  };

  public query ({ caller }) func getUsername(user : Principal) : async ?Text {
    usernames.get(user);
  };

  public shared ({ caller }) func generateInviteCode() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    let blob = await Random.blob();
    let code = InviteLinksModule.generateUUID(blob);
    InviteLinksModule.generateInviteCode(inviteState, code);
    code;
  };

  public shared ({ caller }) func submitRSVP(name : Text, attending : Bool, inviteCode : Text) : async () {
    InviteLinksModule.submitRSVP(inviteState, name, attending, inviteCode);
  };

  public query ({ caller }) func getAllRSVPs() : async [InviteLinksModule.RSVP] {
    if (not AccessControl.isAdmin(accessControlState, caller)) Runtime.trap("Unauthorized");
    InviteLinksModule.getAllRSVPs(inviteState);
  };

  public query ({ caller }) func getInviteCodes() : async [InviteLinksModule.InviteCode] {
    if (not AccessControl.isAdmin(accessControlState, caller)) Runtime.trap("Unauthorized");
    InviteLinksModule.getInviteCodes(inviteState);
  };
};
