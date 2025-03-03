"use client";
import { config, queryClient } from "@/config";
import { AlchemyClientState } from "@account-kit/core";
import { QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren, Suspense, useMemo } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { VideoProvider } from "../context/VideoContext";
import { CustomAuthProvider } from "@/components/auth/CustomAuthProvider";

export const Providers = (
  props: PropsWithChildren<{ initialState?: AlchemyClientState }>
) => {
  return (
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
  );
};
