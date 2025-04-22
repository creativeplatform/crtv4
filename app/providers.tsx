"use client";
import { config, queryClient } from "@/config";
import { AlchemyClientState } from "@account-kit/core";
import { QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren, useMemo, Suspense } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { VideoProvider } from "../context/VideoContext";
import { CustomAuthProvider } from "@/components/auth/CustomAuthProvider";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <p className="mt-2 text-sm text-gray-500">{error.message}</p>
      </div>
    </div>
  );
}

export const Providers = (
  props: PropsWithChildren<{ initialState?: AlchemyClientState }>
) => {
  return (
    <ErrorBoundary errorComponent={ErrorFallback}>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center">
            Loading...
          </div>
        }
      >
        <QueryClientProvider client={queryClient}>
          <CustomAuthProvider initialState={props.initialState}>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <VideoProvider>
                {props.children}
                <Toaster position="top-right" richColors />
              </VideoProvider>
            </ThemeProvider>
          </CustomAuthProvider>
        </QueryClientProvider>
      </Suspense>
    </ErrorBoundary>
  );
};
