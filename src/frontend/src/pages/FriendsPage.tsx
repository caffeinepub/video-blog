import { Button } from "@/components/ui/button";
import FriendsManager from "../components/FriendsManager";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function FriendsPage() {
  const { identity, login, isLoggingIn } = useInternetIdentity();

  if (!identity) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h2 className="text-2xl font-bold mb-3">Login Required</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          You need to login to manage your friends list.
        </p>
        <Button size="lg" onClick={login} disabled={isLoggingIn}>
          {isLoggingIn ? "Connecting..." : "Login to Continue"}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Friends</h2>
        <p className="text-muted-foreground text-sm">
          Manage your friends to see their photos
        </p>
      </div>
      <FriendsManager />
    </div>
  );
}
