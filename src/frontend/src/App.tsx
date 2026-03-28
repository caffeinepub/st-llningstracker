import { Toaster } from "@/components/ui/sonner";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { createRootRoute, createRoute } from "@tanstack/react-router";
import AuthGate from "./components/AuthGate";
import Layout from "./components/Layout";
import AdminPage from "./pages/AdminPage";
import CheckoutPage from "./pages/CheckoutPage";
import Dashboard from "./pages/Dashboard";
import PrintPage from "./pages/PrintPage";
import ReturnPage from "./pages/ReturnPage";
import ScanPage from "./pages/ScanPage";
import TrailerDetail from "./pages/TrailerDetail";

const rootRoute = createRootRoute({
  component: () => (
    <AuthGate>
      <Layout />
      <Toaster position="top-center" richColors />
    </AuthGate>
  ),
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Dashboard,
});

const trailerDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/trailer/$id",
  component: TrailerDetail,
});

const scanRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/scan",
  component: ScanPage,
});

const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/trailer/$id/checkout",
  component: CheckoutPage,
});

const returnRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/trailer/$id/return",
  component: ReturnPage,
});

const printRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/trailer/$id/print",
  component: PrintPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPage,
});

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  trailerDetailRoute,
  scanRoute,
  checkoutRoute,
  returnRoute,
  printRoute,
  adminRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
