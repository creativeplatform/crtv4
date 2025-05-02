"use client";

import { useEffect, useState, useRef } from "react";
import * as Player from "@livepeer/react/player";
import {
  LoadingIcon,
  PlayIcon,
  PauseIcon,
  MuteIcon,
  UnmuteIcon,
  EnterFullscreenIcon,
  ExitFullscreenIcon,
} from "@livepeer/react/assets";
import { cn } from "@/lib/utils";
import { getDetailPlaybackSource } from "@/lib/hooks/livepeer/useDetailPlaybackSources";
import { Src } from "@livepeer/react";

interface OrbisPlayerProps {
  playerId: string;
  currentPlayingId: string | null;
  playbackId: string;
  className?: string;
}

export function OrbisPlayer({
  playerId,
  currentPlayingId,
  playbackId,
  className,
}: OrbisPlayerProps) {
  const [playbackSources, setPlaybackSources] = useState<Src[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const fadeTimeoutRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    resetFadeTimeout();
    return () => {
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, []);

  const resetFadeTimeout = () => {
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
    }
    setControlsVisible(true);
    fadeTimeoutRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 2000);
  };

  const handleControlInteraction = () => {
    setControlsVisible(true);
    resetFadeTimeout();
  };

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);
        console.log("Fetching playback sources for ID:", playbackId);
        const sources = await getDetailPlaybackSource(playbackId);

        if (!sources) {
          setError("Failed to load video sources");
          return;
        }

        setPlaybackSources(sources);
      } catch (err) {
        console.error("Error loading video:", err);
        setError("Failed to load video");
      } finally {
        setIsLoading(false);
      }
    }

    if (playbackId) {
      fetchData();
    }
  }, [playbackId]);

  if (isLoading) {
    return (
      <div className={cn("relative aspect-video bg-black", className)}>
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingIcon className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !playbackSources) {
    return (
      <div className={cn("relative aspect-video bg-black", className)}>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <p className="text-lg font-medium">Failed to load video</p>
          <p className="text-sm text-white/70">
            {error || "No playback sources available"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Player.Root src={playbackSources}>
      <Player.Container
        ref={containerRef}
        className="player-container relative aspect-video touch-none"
        onMouseMove={resetFadeTimeout}
        onMouseEnter={() => setControlsVisible(true)}
        onTouchStart={handleControlInteraction}
      >
        <Player.Video
          title="Video"
          className="h-full w-full"
          playsInline
          controls={false}
        />

        <Player.LoadingIndicator
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "black",
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: 20,
          }}
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <div className="text-lg font-semibold text-white">Loading...</div>
          </div>
        </Player.LoadingIndicator>

        <div
          className={`pointer-events-none absolute inset-0 bg-gradient-to-t 
            from-black/60 via-transparent to-black/60 transition-opacity duration-300 ${
              controlsVisible ? "opacity-100" : "opacity-0"
            }`}
        />

        <div
          className={`absolute inset-0 z-30 touch-none transition-opacity duration-300 ${
            controlsVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-6">
              <Player.PlayPauseTrigger
                className="group relative flex h-16 w-16 cursor-pointer touch-none 
                items-center justify-center rounded-full bg-black/50 hover:bg-black/70"
                onClick={handleControlInteraction}
              >
                <Player.PlayingIndicator asChild matcher={false}>
                  <PlayIcon className="h-10 w-10 text-white" />
                </Player.PlayingIndicator>
                <Player.PlayingIndicator asChild>
                  <PauseIcon className="h-10 w-10 text-white" />
                </Player.PlayingIndicator>
              </Player.PlayPauseTrigger>

              <Player.MuteTrigger
                className="group relative flex h-14 w-14 cursor-pointer touch-none 
                items-center justify-center rounded-full bg-black/50 hover:bg-black/70"
                onClick={handleControlInteraction}
              >
                <Player.VolumeIndicator asChild matcher={false}>
                  <MuteIcon className="h-8 w-8 text-white" />
                </Player.VolumeIndicator>
                <Player.VolumeIndicator asChild matcher={true}>
                  <UnmuteIcon className="h-8 w-8 text-white" />
                </Player.VolumeIndicator>
              </Player.MuteTrigger>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0">
            <div className="flex items-center justify-between px-5 pb-8">
              <Player.Time className="rounded-full bg-black/40 px-2 py-0.5 text-xs font-medium tabular-nums text-white/90" />

              <div className="flex items-center gap-4">
                <Player.FullscreenTrigger
                  className="group relative flex h-10 w-10 cursor-pointer 
                touch-none items-center justify-center rounded-full bg-black/50 hover:bg-black/70"
                >
                  <Player.FullscreenIndicator asChild matcher={false}>
                    <EnterFullscreenIcon className="h-6 w-6 text-white" />
                  </Player.FullscreenIndicator>
                  <Player.FullscreenIndicator asChild>
                    <ExitFullscreenIcon className="h-6 w-6 text-white" />
                  </Player.FullscreenIndicator>
                </Player.FullscreenTrigger>
              </div>
            </div>

            <Player.Seek
              style={{
                position: "absolute",
                left: 20,
                right: 20,
                bottom: 20,
                height: 20,
                display: "flex",
                alignItems: "center",
                gap: 10,
                userSelect: "none",
                touchAction: "none",
              }}
            >
              <Player.Track
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.7)",
                  position: "relative",
                  flexGrow: 1,
                  borderRadius: 9999,
                  height: 2,
                }}
              >
                <Player.SeekBuffer
                  style={{
                    position: "absolute",
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    borderRadius: 9999,
                    height: "100%",
                  }}
                />
                <Player.Range
                  style={{
                    position: "absolute",
                    backgroundColor: "white",
                    borderRadius: 9999,
                    height: "100%",
                  }}
                />
              </Player.Track>
              <Player.Thumb
                style={{
                  display: "block",
                  width: 12,
                  height: 12,
                  backgroundColor: "white",
                  borderRadius: 9999,
                }}
              />
            </Player.Seek>
          </div>
        </div>
      </Player.Container>
    </Player.Root>
  );
}
