import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Camera, Copy, Home, Loader2, Pencil, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetUsername, useSetUsername } from "../hooks/useQueries";

export default function Navigation() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { identity, login, clear, isLoggingIn } = useInternetIdentity();

  const principal = identity?.getPrincipal() ?? null;
  const principalStr = principal?.toString() ?? null;
  const usernameQuery = useGetUsername(principal);

  const [usernameDialogOpen, setUsernameDialogOpen] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const setUsernameMutation = useSetUsername();

  // Pre-fill dialog with current username
  useEffect(() => {
    if (usernameQuery.data) {
      setUsernameInput(usernameQuery.data);
    }
  }, [usernameQuery.data]);

  const handleSaveUsername = async () => {
    const trimmed = usernameInput.trim();
    if (!trimmed) return;
    try {
      await setUsernameMutation.mutateAsync(trimmed);
      toast.success("Username updated!");
      setUsernameDialogOpen(false);
    } catch {
      toast.error("Failed to update username");
    }
  };

  const handleCopyPrincipal = async () => {
    if (!principalStr) return;
    try {
      await navigator.clipboard.writeText(principalStr);
      toast.success("Principal ID copied!");
    } catch {
      toast.error("Failed to copy principal ID");
    }
  };

  const displayName = usernameQuery.data
    ? usernameQuery.data
    : principalStr
      ? `${principalStr.slice(0, 5)}...${principalStr.slice(-3)}`
      : null;

  const navItems = [
    { path: "/", icon: Home, label: "Feed" },
    { path: "/capture", icon: Camera, label: "Capture" },
    { path: "/friends", icon: Users, label: "Friends" },
  ];

  return (
    <nav className="flex items-center gap-2">
      <div className="hidden sm:flex items-center gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;
          return (
            <button
              type="button"
              key={item.path}
              onClick={() => navigate({ to: item.path })}
              data-ocid={`nav.${item.label.toLowerCase()}.link`}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-bold uppercase tracking-wide border-2 transition-colors ${
                isActive
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background text-foreground border-foreground hover:bg-foreground hover:text-background"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden md:inline">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex sm:hidden items-center gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;
          return (
            <button
              type="button"
              key={item.path}
              onClick={() => navigate({ to: item.path })}
              data-ocid={`nav.${item.label.toLowerCase()}.link`}
              className={`flex items-center justify-center w-10 h-10 border-2 ${
                isActive
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background text-foreground border-foreground hover:bg-foreground hover:text-background"
              }`}
            >
              <Icon className="w-5 h-5" />
            </button>
          );
        })}
      </div>

      <div className="ml-2 pl-2 border-l-2 border-foreground flex items-center gap-2">
        {identity ? (
          <>
            {displayName && (
              <Dialog
                open={usernameDialogOpen}
                onOpenChange={setUsernameDialogOpen}
              >
                <DialogTrigger asChild>
                  <button
                    type="button"
                    data-ocid="nav.username.open_modal_button"
                    className="hidden sm:flex items-center gap-1.5 px-2 py-1 border-2 border-foreground text-xs font-bold uppercase tracking-wide hover:bg-foreground hover:text-background transition-colors max-w-[120px]"
                    title="Edit username"
                  >
                    <span className="truncate">{displayName}</span>
                    <Pencil className="w-3 h-3 shrink-0" />
                  </button>
                </DialogTrigger>
                <DialogContent
                  data-ocid="nav.username.dialog"
                  className="rounded-none border-2 border-foreground"
                >
                  <DialogHeader>
                    <DialogTitle className="font-black uppercase tracking-widest">
                      Settings
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="username-input"
                        className="font-bold uppercase tracking-wide text-xs"
                      >
                        Username
                      </Label>
                      <Input
                        id="username-input"
                        data-ocid="nav.username.input"
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleSaveUsername()
                        }
                        placeholder="Enter your username..."
                        className="border-2 border-foreground rounded-none"
                        disabled={setUsernameMutation.isPending}
                      />
                    </div>

                    {principalStr && (
                      <div className="space-y-1.5">
                        <Label className="font-bold uppercase tracking-wide text-xs">
                          Principal ID
                        </Label>
                        <div className="flex items-stretch gap-0 border-2 border-foreground">
                          <code className="flex-1 px-3 py-2 font-mono text-xs leading-relaxed break-all bg-muted text-foreground select-all">
                            {principalStr}
                          </code>
                          <button
                            type="button"
                            data-ocid="nav.principal.button"
                            onClick={handleCopyPrincipal}
                            title="Copy principal ID"
                            className="px-3 border-l-2 border-foreground bg-background hover:bg-foreground hover:text-background transition-colors flex items-center justify-center shrink-0"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <DialogFooter className="gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setUsernameDialogOpen(false)}
                      data-ocid="nav.username.cancel_button"
                      className="rounded-none border-2 border-foreground font-bold uppercase tracking-wide hover:bg-foreground hover:text-background"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveUsername}
                      disabled={
                        setUsernameMutation.isPending || !usernameInput.trim()
                      }
                      data-ocid="nav.username.save_button"
                      className="rounded-none border-2 border-foreground bg-primary text-primary-foreground font-bold uppercase tracking-widest hover:bg-foreground hover:border-foreground"
                    >
                      {setUsernameMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Save"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={clear}
              data-ocid="nav.logout.button"
              className="border-2 border-foreground font-bold uppercase tracking-wide"
            >
              Logout
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            onClick={login}
            disabled={isLoggingIn}
            data-ocid="nav.login.button"
            className="bg-primary text-primary-foreground border-2 border-primary font-bold uppercase tracking-wide hover:bg-foreground hover:border-foreground"
          >
            {isLoggingIn ? "Connecting..." : "Login"}
          </Button>
        )}
      </div>
    </nav>
  );
}
