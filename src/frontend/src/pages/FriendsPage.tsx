import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Copy, Link, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import FriendsManager from "../components/FriendsManager";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGenerateInviteCode } from "../hooks/useQueries";

export default function FriendsPage() {
  const { identity, login, isLoggingIn } = useInternetIdentity();
  const generateInviteCode = useGenerateInviteCode();
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!identity) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h2 className="text-3xl font-display font-black uppercase tracking-tight mb-4">
          Login Required
        </h2>
        <div className="w-16 h-1 bg-primary mb-6" />
        <p className="text-muted-foreground mb-8 max-w-md font-medium">
          You need to login to manage your friends list.
        </p>
        <Button
          size="lg"
          onClick={login}
          disabled={isLoggingIn}
          className="bg-primary text-primary-foreground border-2 border-primary font-bold uppercase tracking-widest hover:bg-foreground hover:border-foreground"
        >
          {isLoggingIn ? "Connecting..." : "Login to Continue"}
        </Button>
      </div>
    );
  }

  const handleGenerateInvite = async () => {
    try {
      const code = await generateInviteCode.mutateAsync();
      const link = `${window.location.origin}/?invite=${code}`;
      setInviteLink(link);
    } catch {
      toast.error(
        "Failed to generate invite link. Admin role may be required.",
      );
    }
  };

  const handleCopy = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success("Invite link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="mb-6">
        <div className="border-l-4 border-primary pl-4">
          <h2 className="text-3xl font-display font-black uppercase tracking-tight">
            Friends
          </h2>
          <p className="text-muted-foreground text-sm font-medium">
            Manage your friends and invite new ones
          </p>
        </div>
      </div>

      {/* Invite Section */}
      <div className="border-2 border-foreground p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-secondary flex items-center justify-center">
            <Link className="w-5 h-5 text-secondary-foreground" />
          </div>
          <div>
            <h3 className="font-black uppercase tracking-widest text-sm">
              Invite Friends
            </h3>
            <p className="text-xs text-muted-foreground font-medium">
              Share an invite link to bring friends in
            </p>
          </div>
        </div>

        {generateInviteCode.isError && (
          <Alert
            variant="destructive"
            className="rounded-none border-2 border-foreground mb-4"
            data-ocid="invite.error_state"
          >
            <AlertDescription className="font-bold uppercase tracking-wide text-xs">
              Failed to generate invite link.
            </AlertDescription>
          </Alert>
        )}

        {inviteLink ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={inviteLink}
                readOnly
                data-ocid="invite.input"
                className="border-2 border-foreground rounded-none font-mono text-xs bg-muted"
              />
              <Button
                onClick={handleCopy}
                data-ocid="invite.primary_button"
                className={`border-2 border-foreground font-bold uppercase tracking-widest shrink-0 ${
                  copied
                    ? "bg-accent text-accent-foreground"
                    : "bg-foreground text-background hover:opacity-90"
                }`}
              >
                {copied ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateInvite}
              disabled={generateInviteCode.isPending}
              data-ocid="invite.secondary_button"
              className="border-2 border-foreground font-bold uppercase tracking-wide text-xs hover:bg-foreground hover:text-background"
            >
              Generate New Link
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleGenerateInvite}
            disabled={generateInviteCode.isPending}
            data-ocid="invite.primary_button"
            className="w-full gap-2 border-2 border-foreground bg-primary text-primary-foreground font-bold uppercase tracking-widest hover:bg-foreground hover:border-foreground"
          >
            {generateInviteCode.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Link className="w-4 h-4" />
                Generate Invite Link
              </>
            )}
          </Button>
        )}
      </div>

      <FriendsManager />
    </div>
  );
}
