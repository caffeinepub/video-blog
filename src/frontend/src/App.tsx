import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { UserRole } from "./backend";
import InviteCodeGate from "./components/InviteCodeGate";
import Layout from "./components/Layout";
import LoginGate from "./components/LoginGate";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useCallerUserRole } from "./hooks/useQueries";
import CapturePage from "./pages/CapturePage";
import FeedPage from "./pages/FeedPage";
import FriendsPage from "./pages/FriendsPage";

function InviteHandler() {
  const { identity } = useInternetIdentity();
  const { actor } = useActor();

  useEffect(() => {
    if (!identity || !actor) return;

    const params = new URLSearchParams(window.location.search);
    const inviteCode = params.get("invite");
    if (!inviteCode) return;

    // Clear the query param immediately
    const url = new URL(window.location.href);
    url.searchParams.delete("invite");
    window.history.replaceState({}, "", url.toString());

    // Submit the RSVP
    const principal = identity.getPrincipal();
    actor
      .getUsername(principal)
      .then((name) => {
        const guestName = name ?? "Guest";
        return actor.submitRSVP(guestName, true, inviteCode);
      })
      .then(() => {
        console.log("RSVP submitted for invite", inviteCode);
      })
      .catch((err) => {
        console.warn("Failed to submit RSVP:", err);
      });
  }, [identity, actor]);

  return null;
}

function AccessGate({ children }: { children: React.ReactNode }) {
  const { identity, isInitializing } = useInternetIdentity();
  const { isFetching: actorFetching } = useActor();
  const isLoggedIn = !!identity;

  const { data: role, isLoading: roleLoading } = useCallerUserRole();

  // Still initializing auth
  if (isInitializing || actorFetching) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-primary border-2 border-foreground animate-pulse" />
          <p className="font-display font-black uppercase tracking-wider text-sm text-muted-foreground">
            LOADING...
          </p>
        </div>
      </div>
    );
  }

  // Not logged in → show login gate
  if (!isLoggedIn) {
    return <LoginGate />;
  }

  // Logged in but role not yet fetched
  if (roleLoading || role === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-primary border-2 border-foreground animate-pulse" />
          <p className="font-display font-black uppercase tracking-wider text-sm text-muted-foreground">
            CHECKING ACCESS...
          </p>
        </div>
      </div>
    );
  }

  // Logged in but guest (no account) → show invite code gate
  if (role === UserRole.guest) {
    return <InviteCodeGate />;
  }

  // Has account → show app
  return <>{children}</>;
}

const rootRoute = createRootRoute({
  component: () => (
    <AccessGate>
      <Layout>
        <InviteHandler />
        <Outlet />
      </Layout>
    </AccessGate>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: FeedPage,
});

const captureRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/capture",
  component: CapturePage,
});

const friendsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/friends",
  component: FriendsPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  captureRoute,
  friendsRoute,
]);

const router = createRouter({ routeTree });

export default function App() {
  return <RouterProvider router={router} />;
}
