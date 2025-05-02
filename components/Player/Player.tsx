"use client";

import React, { useEffect, useState, useRef } from "react";
import * as LivepeerPlayer from "@livepeer/react/player";
import type { PlaybackError } from "@livepeer/react";
import {
  PlayIcon,
  PauseIcon,
  MuteIcon,
  UnmuteIcon,
  EnterFullscreenIcon,
  ExitFullscreenIcon,
} from "@livepeer/react/assets";
import { useVideo } from "@/context/VideoContext";
import "./Player.css";
import { Src } from "@livepeer/react";

export const PlayerLoading: React.FC<{ title: string }> = ({ title }) => {
  return (
    <div className="flex h-64 w-full items-center justify-center bg-gray-900 md:h-96">
      <div className="flex flex-col items-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-orange-500"></div>
        <p className="text-lg font-medium text-white">{title}</p>
      </div>
    </div>
  );
};

export const Player: React.FC<{
  src: Src[] | null;
  title: string;
  assetId?: string;
  onPlay?: () => void;
}> = ({ src, title, assetId, onPlay }) => {
  const [controlsVisible, setControlsVisible] = useState(true);
  const fadeTimeoutRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);
  const { currentPlayingId, setCurrentPlayingId } = useVideo();
  const playerId = useRef(Math.random().toString(36).substring(7)).current;
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = containerRef.current?.querySelector("video");
    if (video) {
      videoRef.current = video;
    }
  }, []);

  useEffect(() => {
    if (!videoRef.current) return;

    const handlePlay = () => {
      setCurrentPlayingId(assetId || playerId);
      onPlay?.();
    };

    const handlePause = () => {
      if (currentPlayingId === (assetId || playerId)) {
        setCurrentPlayingId("");
      }
    };

    videoRef.current.addEventListener("play", handlePlay);
    videoRef.current.addEventListener("pause", handlePause);

    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener("play", handlePlay);
        videoRef.current.removeEventListener("pause", handlePause);
      }
    };
  }, [playerId, currentPlayingId, setCurrentPlayingId, assetId, onPlay]);

  useEffect(() => {
    if (!videoRef.current) return;

    if (
      currentPlayingId &&
      currentPlayingId !== (assetId || playerId) &&
      !videoRef.current.paused
    ) {
      videoRef.current.pause();
    }
  }, [currentPlayingId, playerId, assetId]);

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
    resetFadeTimeout();
  };

  if (!src || (Array.isArray(src) && src.length === 0)) {
    return (
      <div className="flex h-64 w-full items-center justify-center bg-gray-900 md:h-96">
        <p className="text-lg font-medium text-white">
          No video source available
        </p>
      </div>
    );
  }

  // Check if we have an HLS source
  const hlsSource = src?.find((s) => s.type === "hls");
  // Fallback to MP4 source if no HLS
  const mp4Source = src?.find((s) => s.type === "video");
  // Create a single-item array with the selected source
  const selectedSource = hlsSource || mp4Source || src?.[0];
  const sourceArray = selectedSource ? [selectedSource] : null;

  return (
    <div
      ref={containerRef}
      className="player-container"
      onMouseMove={resetFadeTimeout}
      onMouseLeave={() => setControlsVisible(false)}
      onTouchStart={resetFadeTimeout}
    >
      <LivepeerPlayer.Root
        src={sourceArray}
        autoPlay={false}
        volume={0.5}
        aspectRatio={16 / 9}
        onError={(error: PlaybackError | null) => {
          if (error) console.error("Player error:", error);
        }}
      >
        <LivepeerPlayer.Container className="relative h-full w-full">
          <LivepeerPlayer.Video
            className="absolute inset-0 h-full w-full object-cover"
            title={title}
            playsInline
            controls={false}
            crossOrigin="anonymous"
          />

          <LivepeerPlayer.LoadingIndicator className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="flex flex-col items-center space-y-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <div className="text-lg font-semibold text-white">Loading...</div>
            </div>
          </LivepeerPlayer.LoadingIndicator>

          <div
            className={`pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 
              via-transparent to-black/60 transition-opacity duration-300 
              ${controlsVisible ? "opacity-100" : "opacity-0"}`}
          />

          <div
            className={`absolute inset-0 z-30 flex flex-col justify-between transition-opacity 
              duration-300 ${controlsVisible ? "opacity-100" : "opacity-0"}`}
          >
            {/* Top controls bar */}
            <div className="w-full bg-gradient-to-b from-black/80 to-transparent px-4 py-3">
              <h3 className="text-lg font-medium text-white line-clamp-1">
                {title}
              </h3>
            </div>

            {/* Center play/pause button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <LivepeerPlayer.PlayPauseTrigger
                className={`
                  group relative flex h-16 w-16 cursor-pointer items-center 
                  justify-center rounded-full bg-black/50 hover:bg-black/70 
                  transition-transform duration-200 hover:scale-110
                `}
                onClick={handleControlInteraction}
              >
                <LivepeerPlayer.PlayingIndicator asChild matcher={false}>
                  <PlayIcon className="h-10 w-10 text-white" />
                </LivepeerPlayer.PlayingIndicator>
                <LivepeerPlayer.PlayingIndicator asChild>
                  <PauseIcon className="h-10 w-10 text-white" />
                </LivepeerPlayer.PlayingIndicator>
              </LivepeerPlayer.PlayPauseTrigger>
            </div>

            {/* Bottom controls */}
            <div className="w-full bg-gradient-to-t from-black/80 to-transparent px-4 pb-4 pt-20">
              <LivepeerPlayer.Seek className="group relative mb-4 flex h-1 w-full cursor-pointer items-center">
                <LivepeerPlayer.Track className="relative h-1 w-full rounded-full bg-white/30 group-hover:h-1.5 transition-all">
                  <LivepeerPlayer.SeekBuffer className="absolute h-full rounded-full bg-white/50" />
                  <LivepeerPlayer.Range className="absolute h-full rounded-full bg-white" />
                  <LivepeerPlayer.Thumb
                    className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-white opacity-0 
                      group-hover:opacity-100 transition-opacity"
                  />
                </LivepeerPlayer.Track>
              </LivepeerPlayer.Seek>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <LivepeerPlayer.MuteTrigger
                    className="group relative flex h-8 w-8 cursor-pointer items-center 
                      justify-center rounded-full hover:bg-white/10"
                    onClick={handleControlInteraction}
                  >
                    <LivepeerPlayer.VolumeIndicator asChild matcher={false}>
                      <MuteIcon className="h-5 w-5 text-white" />
                    </LivepeerPlayer.VolumeIndicator>
                    <LivepeerPlayer.VolumeIndicator asChild matcher={true}>
                      <UnmuteIcon className="h-5 w-5 text-white" />
                    </LivepeerPlayer.VolumeIndicator>
                  </LivepeerPlayer.MuteTrigger>

                  <LivepeerPlayer.Volume className="group relative flex h-1 w-20 cursor-pointer items-center">
                    <LivepeerPlayer.Track className="relative h-1 w-full rounded-full bg-white/30 group-hover:h-1.5 transition-all">
                      <LivepeerPlayer.Range className="absolute h-full rounded-full bg-white" />
                      <LivepeerPlayer.Thumb
                        className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-white opacity-0 
                          group-hover:opacity-100 transition-opacity"
                      />
                    </LivepeerPlayer.Track>
                  </LivepeerPlayer.Volume>
                </div>

                <LivepeerPlayer.FullscreenTrigger
                  className="group relative flex h-8 w-8 cursor-pointer items-center 
                    justify-center rounded-full hover:bg-white/10"
                  onClick={handleControlInteraction}
                >
                  <LivepeerPlayer.FullscreenIndicator asChild matcher={false}>
                    <EnterFullscreenIcon className="h-5 w-5 text-white" />
                  </LivepeerPlayer.FullscreenIndicator>
                  <LivepeerPlayer.FullscreenIndicator asChild>
                    <ExitFullscreenIcon className="h-5 w-5 text-white" />
                  </LivepeerPlayer.FullscreenIndicator>
                </LivepeerPlayer.FullscreenTrigger>
              </div>
            </div>
          </div>
        </LivepeerPlayer.Container>
      </LivepeerPlayer.Root>
    </div>
  );
};
