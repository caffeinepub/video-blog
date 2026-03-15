import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { useEffect } from "react";
import Layout from "./components/Layout";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
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

const rootRoute = createRootRoute({
  component: () => (
    <Layout>
      <InviteHandler />
      <Outlet />
    </Layout>
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
