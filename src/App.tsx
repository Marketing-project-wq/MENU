import { AuthProvider } from "./lib/auth";
import { LangProvider, RecipesProvider, ThemeProvider } from "./lib/store";
import { SocialProvider } from "./lib/social";
import { RouterProvider, useRouter, parseRoute } from "./router";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { BrowsePage } from "./pages/BrowsePage";
import { DetailPage } from "./pages/DetailPage";
import { LegacyDetailRedirect } from "./pages/LegacyDetailRedirect";
import { SubmitPage } from "./pages/SubmitPage";
import { MinePage } from "./pages/MinePage";
import { SavedPage } from "./pages/SavedPage";

function Routes() {
  const { path } = useRouter();
  const route = parseRoute(path);

  switch (route.name) {
    case "detail":
      return <DetailPage slug={route.params.slug} />;
    case "legacy-detail":
      return <LegacyDetailRedirect source={route.params.source} id={route.params.id} />;
    case "submit":
      return <SubmitPage />;
    case "mine":
      return <MinePage />;
    case "saved":
      return <SavedPage />;
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
          <SocialProvider>
            <RouterProvider>
              <div className="min-h-full bg-app-gradient">
                <Header />
                <main>
                  <Routes />
                </main>
                <Footer />
              </div>
            </RouterProvider>
          </SocialProvider>
        </RecipesProvider>
      </AuthProvider>
      </LangProvider>
    </ThemeProvider>
  );
}
