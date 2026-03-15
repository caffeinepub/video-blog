import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { Camera } from "lucide-react";
import PhotoFeed from "../components/PhotoFeed";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function FeedPage() {
  const { identity, login, isLoggingIn } = useInternetIdentity();
  const navigate = useNavigate();

  if (!identity) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-primary" />
          <div className="w-16 h-16 bg-accent" />
          <div className="w-16 h-16 bg-secondary" />
        </div>
        <h2 className="text-4xl font-display font-black uppercase tracking-tight mb-4">
          Welcome to PhotoShare
        </h2>
        <div className="w-16 h-1 bg-primary mb-6" />
        <p className="text-muted-foreground mb-8 max-w-md font-medium">
          Share your favorite moments with friends. Login to start capturing and
          sharing photos.
        </p>
        <Button
          size="lg"
          onClick={login}
          disabled={isLoggingIn}
          data-ocid="feed.login.primary_button"
          className="gap-2 bg-primary text-primary-foreground border-2 border-primary font-bold uppercase tracking-widest hover:bg-foreground hover:border-foreground"
        >
          <Camera className="w-5 h-5" />
          {isLoggingIn ? "Connecting..." : "Login to Continue"}
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="border-l-4 border-primary pl-4">
          <h2 className="text-3xl font-display font-black uppercase tracking-tight">
            Your Feed
          </h2>
          <p className="text-muted-foreground text-sm font-medium">
            Photos from you and your friends
          </p>
        </div>
        <Button
          onClick={() => navigate({ to: "/capture" })}
          data-ocid="feed.capture.primary_button"
          className="gap-2 bg-primary text-primary-foreground border-2 border-primary font-bold uppercase tracking-wide hover:bg-foreground hover:border-foreground"
        >
          <Camera className="w-4 h-4" />
          <span className="hidden sm:inline">Capture</span>
        </Button>
      </div>
      <PhotoFeed />
    </div>
  );
}
