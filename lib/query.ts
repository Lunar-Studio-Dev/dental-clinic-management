import { QueryClient } from "@tanstack/react-query";

// One QueryClient factory; the client is created per browser session in Providers.
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
    },
  });
}
