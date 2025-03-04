"use client";
import * as Player from "@livepeer/react/player";
import { Src, HLSVideoSource, MP4VideoSource } from "@livepeer/react";
import {
  PlayIcon,
  PauseIcon,
  MuteIcon,
  UnmuteIcon,
  EnterFullscreenIcon,
  ExitFullscreenIcon,
} from "@livepeer/react/assets";
import { useEffect, useState, useRef } from "react";
import "./Player.css";
import { ViewsComponent } from './ViewsComponent';

export const PreviewPlayer: React.FC<{ src: Src[]; title: string }> = ({
  src,
  title,
}) => {
  const [controlsVisible, setControlsVisible] = useState(true);
  const fadeTimeoutRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Extract playback ID from the source
  const getPlaybackId = (sources: Src[]): string => {
    if (!sources.length) return '';
    
    const source = sources[0] as unknown;
    
    if (isHLSSource(source)) {
      const hrnParts = source.hrn.split(':');
      return hrnParts[hrnParts.length - 1];
    }
    
    if (isMP4Source(source)) {
      const urlParts = source.src.split('/');
      return urlParts[urlParts.length - 1].split('.')[0];
    }
    
    return '';
  };

  // Type guards for source types
  const isHLSSource = (source: unknown): source is HLSVideoSource => {
    if (!source || typeof source !== 'object') return false;
    return (
      'hrn' in source &&
      'type' in source &&
      (source as { type: string }).type === 'hls'
    );
  };

  const isMP4Source = (source: unknown): source is MP4VideoSource => {
    if (!source || typeof source !== 'object') return false;
    return (
      'src' in source &&
      'type' in source &&
      (source as { type: string }).type === 'mp4'
    );
  };

  useEffect(() => {
    resetFadeTimeout();
    return () => {
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, [src, title]);

  const resetFadeTimeout = () => {
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
    }
    setControlsVisible(true);
    fadeTimeoutRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 2000);
  };

  return (
    <div
      ref={containerRef}
      className="player-container"
      onMouseMove={resetFadeTimeout}
      onMouseLeave={() => setControlsVisible(false)}
      onTouchStart={resetFadeTimeout}
    >
      <Player.Root src={src} autoPlay={false} volume={0.5} aspectRatio={16 / 9}>
        <Player.Container className="h-full w-full">
          <Player.Video
            className="h-full w-full"
            title={title}
            playsInline
            controls={false}
          />

          <Player.LoadingIndicator className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="flex flex-col items-center space-y-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <div className="text-lg font-semibold text-white">Loading...</div>
            </div>
          </Player.LoadingIndicator>

          <div
            className={
              `absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/60` +
              ` pointer-events-none transition-opacity duration-300 ${
                controlsVisible ? "opacity-100" : "opacity-0"
              }`
            }
          />

          <div className="video-controls">
            <div className="flex flex-col gap-4">
              <Player.Seek className="w-full">
                <Player.Track className="relative w-full h-1 bg-white/30 rounded-full">
                  <Player.SeekBuffer className="absolute h-full bg-white/50 rounded-full" />
                  <Player.Range className="absolute h-full bg-primary rounded-full" />
                  <Player.Thumb className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full" />
                </Player.Track>
              </Player.Seek>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Player.PlayPauseTrigger
                    className="group relative flex h-10 w-10 items-center justify-center 
                  rounded-full bg-white/10 hover:bg-white/20"
                  >
                    <Player.PlayingIndicator asChild matcher={false}>
                      <PlayIcon className="h-5 w-5 text-white" />
                    </Player.PlayingIndicator>
                    <Player.PlayingIndicator asChild>
                      <PauseIcon className="h-5 w-5 text-white" />
                    </Player.PlayingIndicator>
                  </Player.PlayPauseTrigger>

                  <Player.MuteTrigger
                    className="group relative flex h-10 w-10 items-center 
                  justify-center rounded-full bg-white/10 hover:bg-white/20"
                  >
                    <Player.VolumeIndicator asChild matcher={false}>
                      <MuteIcon className="h-5 w-5 text-white" />
                    </Player.VolumeIndicator>
                    <Player.VolumeIndicator asChild matcher={true}>
                      <UnmuteIcon className="h-5 w-5 text-white" />
                    </Player.VolumeIndicator>
                  </Player.MuteTrigger>

                  <Player.Time className="text-sm font-medium text-white" />
                  <ViewsComponent playbackId={getPlaybackId(src)} />
                </div>

                <div className="flex items-center gap-4">
                  <Player.FullscreenTrigger
                    className="group relative flex h-10 w-10 items-center 
                  justify-center rounded-full bg-white/10 hover:bg-white/20"
                  >
                    <Player.FullscreenIndicator asChild matcher={false}>
                      <EnterFullscreenIcon className="h-5 w-5 text-white" />
                    </Player.FullscreenIndicator>
                    <Player.FullscreenIndicator asChild>
                      <ExitFullscreenIcon className="h-5 w-5 text-white" />
                    </Player.FullscreenIndicator>
                  </Player.FullscreenTrigger>
                </div>
              </div>
            </div>
          </div>
        </Player.Container>
      </Player.Root>
    </div>
  );
};
