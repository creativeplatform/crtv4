'use client';
import * as Player from '@livepeer/react/player';
import { Src } from '@livepeer/react';
import { PlayIcon, PauseIcon, MuteIcon, UnmuteIcon } from '@livepeer/react/assets';
import { useEffect, useState, useRef } from 'react';
import { useVideo } from '../../context/VideoContext';
import './Player.css';
export const DemoPlayer: React.FC<{ src: Src[] | null; title: string }> = ({
  src,
  title,
}) => {
  // State to control visibility of controls
  const [controlsVisible, setControlsVisible] = useState(true);
  // Ref to store the fade out timeout ID
  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>();
  // Ref to store the container element for touch event handling
  const containerRef = useRef<HTMLDivElement>(null);
  // Reference to the video player ID
  const playerId = useRef(Math.random().toString(36).substring(7)).current;
  // State to track sthe currently playing video ID
  const videoContext = useVideo();
  const currentPlayingId = videoContext.currentPlayingId;
  const setCurrentPlayingId = videoContext.setCurrentPlayingId;

  // Function to reset the fade out timeout and show controls
  const resetFadeTimeout = () => {

    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
    }
    setControlsVisible(true);
    fadeTimeoutRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 2000);
  };

  // Function to handle control interactions
  const handleControlInteraction = () => {
    setControlsVisible(true);
    resetFadeTimeout();
  };

  // Function to handle play events
  const handlePlay = () => {
    setCurrentPlayingId(playerId);
  };


  useEffect(() => {
    resetFadeTimeout();
    return () => {
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, [src, title]);

  useEffect(() => {
    if (currentPlayingId && currentPlayingId !== playerId) {
      // Another video started playing, pause this one
      const video = containerRef.current?.querySelector('video');
      if (video && !video.paused) {
        video.pause();
      }
    }
  }, [currentPlayingId, playerId]);

  // Helper function to check if a source is HLS
  const isHLSSource = (source: Src): boolean => {
    return typeof (source as any).hrn === 'string' && (source as any).hrn.startsWith("urn:hls");
  };



  // Helper function to check if a source is MP4
  const isMP4Source = (source: any): boolean => {
    return typeof source?.src === 'string' && source.src.endsWith('.mp4');
  };

  // Extract playback ID from the source
  const getPlaybackId = (sources: Src[]): string => {
    if (!sources.length) return "";
    const source = sources[0] as unknown;
    if (isHLSSource(source as Src)) {
      if ('hrn' in (source as any) && typeof (source as any).hrn === 'string') {
        const hrnParts = (source as any).hrn.split(":");
        return hrnParts[hrnParts.length - 1];
      }
      return "";
    }
    if (isMP4Source(source)) {
      const srcString = (source as { src: string }).src;
      const urlParts = srcString.split("/");
      return urlParts[urlParts.length - 1].split(".")[0];
    }
    return "";
  };

  // Render the player
  return (
    <Player.Root src={src} autoPlay volume={1}>
      <Player.Container
        ref={containerRef}
        className="player-container relative aspect-video touch-none"
        onMouseMove={resetFadeTimeout}
        onMouseEnter={() => setControlsVisible(true)}
        onTouchStart={handleControlInteraction}
      >
        <Player.Video
          title={title}
          onPlay={handlePlay}
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
            zIndex: 20
          }}
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <div className="text-lg font-semibold text-white">Loading...</div>
          </div>
        </Player.LoadingIndicator>

        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/60
            pointer-events-none transition-opacity duration-300
            ${controlsVisible ? 'opacity-100' : 'opacity-0'}`}
        />

        <div
          className={`absolute inset-0 z-30 touch-none transition-opacity duration-300
            ${controlsVisible ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-6">
              <Player.PlayPauseTrigger
                className={`group relative flex h-16 w-16 touch-none cursor-pointer items-center
                  justify-center rounded-full bg-black/50 hover:bg-black/70`}
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
                className={`group relative flex h-14 w-14 touch-none cursor-pointer items-center
                  justify-center rounded-full bg-black/50 hover:bg-black/70`}
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
        </div>
      </Player.Container>
    </Player.Root>
  );
};
