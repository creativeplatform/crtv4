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

export function Player(props: {
  src: Src[] | null;
  title: string;
  assetId?: string;
  onPlay?: () => void;
}) {
  const { src, title, assetId, onPlay } = props;

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

  // Prefer MP4, then HLS, then others
  const mp4Sources = src?.filter((s) => s.type === "video") ?? [];
  const hlsSources = src?.filter((s) => s.type === "hls") ?? [];
  const otherSources =
    src?.filter((s) => s.type !== "video" && s.type !== "hls") ?? [];
  const sourceArray = [...mp4Sources, ...hlsSources, ...otherSources];

  // Log the src array for debugging
  console.log("[Player] src array:", sourceArray);

  const isInvalidSrc = !src || !Array.isArray(src) || src.length === 0;

  if (isInvalidSrc) {
    console.error("[Player] No valid video source provided:", src);
    return (
      <div className="flex h-64 w-full items-center justify-center bg-gray-900 md:h-96">
        <p className="text-lg font-medium text-white">
          No video source available
        </p>
      </div>
    );
  }

  // Simplified player for debugging
  return (
    <div ref={containerRef} className="player-container">
      <LivepeerPlayer.Root
        src={sourceArray}
        autoPlay={false}
        volume={0.5}
        aspectRatio={16 / 9}
        onError={(error: PlaybackError | null) => {
          if (error) console.error("Player error:", error);
        }}
      >
        <LivepeerPlayer.Container>
          <LivepeerPlayer.Video
            className="h-full w-full"
            title={title}
            playsInline
            controls={true}
          />
        </LivepeerPlayer.Container>
      </LivepeerPlayer.Root>
    </div>
  );
}
