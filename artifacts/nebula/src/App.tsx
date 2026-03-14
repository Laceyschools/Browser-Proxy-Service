import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import Home from "@/pages/home";
import Browse from "@/pages/browse";
import Games from "@/pages/games";
import Apps from "@/pages/apps";
import Settings from "@/pages/settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    }
  }
});

function NotFound() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-background text-white p-6">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-display font-bold text-primary drop-shadow-[0_0_15px_rgba(124,58,237,0.5)]">404</h1>
        <p className="text-xl text-muted-foreground">The page you're looking for doesn't exist.</p>
        <button 
          onClick={() => window.location.href = import.meta.env.BASE_URL}
          className="mt-6 px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          Return Home
        </button>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/browse" component={Browse} />
      <Route path="/games" component={Games} />
      <Route path="/apps" component={Apps} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Layout>
          <Router />
        </Layout>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
