import Map "mo:core/Map";
import Array "mo:core/Array";
import Set "mo:core/Set";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import Migration "migration";

(with migration = Migration.run)
actor {
  type Photo = {
    owner : Principal;
    timestamp : Time.Time;
    caption : ?Text;
    blob : Storage.ExternalBlob;
  };

  module Photo {
    public func compare(photo1 : Photo, photo2 : Photo) : Order.Order {
      switch (Int.compare(photo2.timestamp, photo1.timestamp)) {
        case (#equal) { Principal.compare(photo1.owner, photo2.owner) };
        case (order) { order };
      };
    };
  };

  let photos = Map.empty<Principal, [Photo]>();
  let friends = Map.empty<Principal, Set.Set<Principal>>();

  include MixinStorage();

  public shared ({ caller }) func uploadPhoto(blob : Storage.ExternalBlob, caption : ?Text) : async () {
    let photo : Photo = {
      owner = caller;
      caption;
      blob;
      timestamp = Time.now();
    };

    let userPhotos = switch (photos.get(caller)) {
      case (?existingPhotos) { existingPhotos };
      case (null) { [] };
    };

    let newSize = userPhotos.size() + 1;
    let newPhotos = Array.tabulate(
      newSize,
      func(i) {
        if (i == 0) { photo } else {
          userPhotos[i - 1];
        };
      },
    );

    photos.add(caller, newPhotos);
  };

  public query ({ caller }) func getMyPhotos() : async [Photo] {
    switch (photos.get(caller)) {
      case (?userPhotos) { userPhotos };
      case (null) { [] };
    };
  };

  public query ({ caller }) func getFriendPhotos(friend : Principal) : async [Photo] {
    switch (photos.get(friend)) {
      case (?friendPhotos) { friendPhotos };
      case (null) { [] };
    };
  };

  public shared ({ caller }) func addFriend(friend : Principal) : async () {
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

  public query ({ caller }) func getFriends() : async [Principal] {
    switch (friends.get(caller)) {
      case (?friends) { friends.toArray() };
      case (null) { [] };
    };
  };
};
