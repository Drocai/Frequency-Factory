import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AuthGuard from "./components/AuthGuard";
import OnboardingGuard from "./components/OnboardingGuard";

// Public routes
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Listen from "./pages/Listen";
import LiveOverlay from "./pages/LiveOverlay";
import Live from "./pages/Live";
import Discover from "./pages/Discover";
import ReceiptsWall from "./pages/ReceiptsWall";
import FactoryMonitor from "./pages/FactoryMonitor";

// Auth-required routes
import Feed from "./pages/Feed";
import Submit from "./pages/Submit";
import Profile from "./pages/Profile";
import Rewards from "./pages/Rewards";
import AvatarSelection from "./pages/AvatarSelection";
import ArtistDashboard from "./pages/ArtistDashboard";
import Onboarding from "./pages/Onboarding";
import Settings from "./pages/Settings";
import PublicProfile from "./pages/PublicProfile";
import TokenShop from "./pages/TokenShop";
import SubscriptionPage from "./pages/SubscriptionPage";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import CheckoutCancel from "./pages/CheckoutCancel";
import ArtistPromo from "./pages/ArtistPromo";
import MerchStore from "./pages/MerchStore";

// Admin routes
import AdminDashboard from "./pages/AdminDashboard";
import AdminQueue from "./pages/AdminQueue";

/** Wraps a component in AuthGuard + OnboardingGuard */
function Protected({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <OnboardingGuard>
        {children}
      </OnboardingGuard>
    </AuthGuard>
  );
}

function Router() {
  return (
    <Switch>
      {/* Public routes — no auth required */}
      <Route path={"/"} component={Landing} />
      <Route path={"/login"} component={Login} />
      <Route path={"/listen"} component={Listen} />
      <Route path={"/overlay"} component={LiveOverlay} />
      <Route path={"/live"} component={Live} />
      <Route path={"/discover"} component={Discover} />
      <Route path={"/monitor"} component={FactoryMonitor} />
      <Route path={"/receipts"} component={ReceiptsWall} />

      {/* Auth-required — redirects to /login if not signed in */}
      <Route path={"/onboarding"}>
        <AuthGuard><Onboarding /></AuthGuard>
      </Route>
      <Route path={"/avatar"}>
        <AuthGuard><AvatarSelection /></AuthGuard>
      </Route>
      <Route path={"/feed"}>
        <Protected><Feed /></Protected>
      </Route>
      <Route path={"/submit"}>
        <Protected><Submit /></Protected>
      </Route>
      <Route path={"/profile"}>
        <Protected><Profile /></Protected>
      </Route>
      <Route path={"/rewards"}>
        <Protected><Rewards /></Protected>
      </Route>
      <Route path={"/settings"}>
        <Protected><Settings /></Protected>
      </Route>
      <Route path={"/shop"}>
        <Protected><TokenShop /></Protected>
      </Route>
      <Route path={"/pro"}>
        <Protected><SubscriptionPage /></Protected>
      </Route>
      <Route path={"/dashboard"}>
        <Protected><ArtistDashboard /></Protected>
      </Route>
      <Route path={"/promote"}>
        <Protected><ArtistPromo /></Protected>
      </Route>
      <Route path={"/merch"}>
        <Protected><MerchStore /></Protected>
      </Route>

      {/* Checkout results */}
      <Route path={"/checkout/success"} component={CheckoutSuccess} />
      <Route path={"/checkout/cancel"} component={CheckoutCancel} />

      {/* Public profile */}
      <Route path={"/u/:userId"} component={PublicProfile} />

      {/* Admin routes */}
      <Route path={"/admin"}>
        <Protected><AdminDashboard /></Protected>
      </Route>
      <Route path={"/admin/queue"}>
        <Protected><AdminQueue /></Protected>
      </Route>

      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
