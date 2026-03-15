import { Button } from "@/components/ui/button";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Camera, Home, Users } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function Navigation() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { identity, login, clear, isLoggingIn } = useInternetIdentity();

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

      <div className="ml-2 pl-2 border-l-2 border-foreground">
        {identity ? (
          <Button
            variant="outline"
            size="sm"
            onClick={clear}
            data-ocid="nav.logout.button"
            className="border-2 border-foreground font-bold uppercase tracking-wide"
          >
            Logout
          </Button>
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
