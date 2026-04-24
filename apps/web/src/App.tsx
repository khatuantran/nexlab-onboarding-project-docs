import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import { ThemeProvider } from "@/lib/theme";
import { router } from "@/routes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 60_000,
    },
  },
});

export function App(): JSX.Element {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
          <Toaster
            richColors
            position="top-right"
            toastOptions={{
              classNames: {
                toast:
                  "font-ui rounded-lg border border-border bg-popover text-popover-foreground shadow-card",
                title: "font-semibold text-sm",
                description: "text-xs text-muted-foreground",
              },
            }}
          />
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
