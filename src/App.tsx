import { AuthProvider } from "./lib/auth";
import { LangProvider, RecipesProvider, ThemeProvider } from "./lib/store";
import { RouterProvider, useRouter, parseRoute } from "./router";
import { Header } from "./components/Header";
import { BrowsePage } from "./pages/BrowsePage";
import { DetailPage } from "./pages/DetailPage";
import { SubmitPage } from "./pages/SubmitPage";
import { MinePage } from "./pages/MinePage";

function Routes() {
  const { path } = useRouter();
  const route = parseRoute(path);

  switch (route.name) {
    case "detail":
      return <DetailPage routeKey={`${route.params.source}:${route.params.id}`} />;
    case "submit":
      return <SubmitPage />;
    case "mine":
      return <MinePage />;
    case "browse":
      return <BrowsePage />;
    default:
      return <BrowsePage />;
  }
}

export default function App() {
  return (
    <ThemeProvider>
      <LangProvider>
        <AuthProvider>
        <RecipesProvider>
          <RouterProvider>
            <div className="min-h-full">
              <Header />
              <main>
                <Routes />
              </main>
              <footer className="mx-auto max-w-6xl px-4 py-10 text-center text-xs text-fg/35">
                Menu 20FIT · 20FIT Sport Clinic Indonesia
              </footer>
            </div>
          </RouterProvider>
        </RecipesProvider>
      </AuthProvider>
      </LangProvider>
    </ThemeProvider>
  );
}
