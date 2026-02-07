import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Primary routes
import Landing from "./pages/Landing";
import AdminDashboard from "./pages/AdminDashboard";
import AdminQueue from "./pages/AdminQueue";
import Listen from "./pages/Listen";
import LiveOverlay from "./pages/LiveOverlay";

// Legacy / supplemental routes
import Feed from "./pages/Feed";
import Discover from "./pages/Discover";
import Submit from "./pages/Submit";
import Profile from "./pages/Profile";
import Rewards from "./pages/Rewards";
import AvatarSelection from "./pages/AvatarSelection";
import FactoryMonitor from "./pages/FactoryMonitor";
import ArtistDashboard from "./pages/ArtistDashboard";
import ReceiptsWall from "./pages/ReceiptsWall";

function Router() {
  return (
    <Switch>
      {/* Primary routes */}
      <Route path={"/"} component={Landing} />
      <Route path={"/admin"} component={AdminDashboard} />
      <Route path={"/admin/queue"} component={AdminQueue} />
      <Route path={"/listen"} component={Listen} />
      <Route path={"/overlay"} component={LiveOverlay} />

      {/* Legacy / supplemental routes */}
      <Route path={"/avatar"} component={AvatarSelection} />
      <Route path={"/feed"} component={Feed} />
      <Route path={"/discover"} component={Discover} />
      <Route path={"/submit"} component={Submit} />
      <Route path={"/profile"} component={Profile} />
      <Route path={"/rewards"} component={Rewards} />
      <Route path={"/monitor"} component={FactoryMonitor} />
      <Route path={"/dashboard"} component={ArtistDashboard} />
      <Route path={"/receipts"} component={ReceiptsWall} />

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
