"use client";

import { ReactNode, useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
  DehydratedState,
} from "@tanstack/react-query";
import { HydrationBoundary } from "@tanstack/react-query";

interface ReactQueryProviderProps {
  children: ReactNode;
  dehydratedState?: DehydratedState;
}

export function ReactQueryProvider({
  children,
  dehydratedState,
}: ReactQueryProviderProps) {
  // Ensure a single QueryClient instance per provider
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={dehydratedState}>{children}</HydrationBoundary>
    </QueryClientProvider>
  );
}

export default ReactQueryProvider;
