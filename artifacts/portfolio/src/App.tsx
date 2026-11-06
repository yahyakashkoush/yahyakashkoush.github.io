import { useEffect, type ReactNode } from "react";
import { Route, Switch, useLocation, Router as WouterRouter } from "wouter";
import { ErrorBoundary } from "@/components/error-boundary";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SiteShell } from "@/components/site-shell";
import { PortfolioProvider } from "@/components/content-provider";
import Home from "@/pages/home";
import WorkPage from "@/pages/work";
import CaseStudy from "@/pages/case-study";
import StartPage from "@/pages/start";
import AdminPage from "@/pages/admin";
import NotFound from "@/pages/not-found";

function ScrollReset() {
  const [location] = useLocation();
  useEffect(() => {
    if (!window.location.hash) window.scrollTo(0, 0);
  }, [location]);
  return null;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function Routes() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/work" component={WorkPage} />
        <Route path="/work/:slug" component={CaseStudy} />
        <Route path="/start" component={StartPage} />
        <Route path="/admin" component={AdminPage} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function App() {
  return (
    <TooltipProvider delayDuration={200}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <ScrollReset />
        <a
          href="#main"
          className="t-nav sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[80] focus:border focus:border-red focus:bg-background focus:px-4 focus:py-3 focus:text-foreground"
        >
          Skip to content
        </a>
        <PortfolioProvider>
          <SiteShell>
            <Routes />
          </SiteShell>
        </PortfolioProvider>
      </WouterRouter>
    </TooltipProvider>
  );
}

export default App;
