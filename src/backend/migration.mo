import Map "mo:core/Map";
import Set "mo:core/Set";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Storage "blob-storage/Storage";

module {
  type OldPhoto = {
    owner : Principal;
    timestamp : Time.Time;
    caption : ?Text;
    blob : Storage.ExternalBlob;
  };

  type OldActor = {
    photos : Map.Map<Principal, OldPhoto>;
    friends : Map.Map<Principal, Set.Set<Principal>>;
  };

  type NewPhoto = {
    owner : Principal;
    timestamp : Time.Time;
    caption : ?Text;
    blob : Storage.ExternalBlob;
  };

  type NewActor = {
    photos : Map.Map<Principal, [NewPhoto]>;
    friends : Map.Map<Principal, Set.Set<Principal>>;
  };

  public func run(old : OldActor) : NewActor {
    // Transform old single photo per user to an array with one photo
    let newPhotos = old.photos.map<Principal, OldPhoto, [NewPhoto]>(
      func(_owner, oldPhoto) {
        [oldPhoto];
      }
    );
    {
      photos = newPhotos;
      friends = old.friends;
    };
  };
};
