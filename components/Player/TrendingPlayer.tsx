"use client";
import * as Player from "@livepeer/react/player";
import { Src } from "@livepeer/react";
import {
  PlayIcon,
  PauseIcon,
  MuteIcon,
  UnmuteIcon,
  EnterFullscreenIcon,
  ExitFullscreenIcon,
  PictureInPictureIcon,
} from "@livepeer/react/assets";
import {
  SubtitlesControl,
  SubtitlesDisplay,
  SubtitlesProvider,
  useSubtitles,
} from "@/components/Player/Subtitles";
import { useEffect, useState, useRef } from "react";
import { useVideo } from "@/context/VideoContext";
import { AssetMetadata } from "@/lib/sdk/orbisDB/models/AssetMetadata";
import "./Player.css";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { forwardRef } from "react";
import { ViewsComponent } from "./ViewsComponent";

// const RateSelectItem = forwardRef<HTMLDivElement, Player.RateSelectItemProps>(
//   ({ children, ...props }, forwardedRef) => {
//     return (
//       <Player.RateSelectItem
//         className="relative flex h-[30px] cursor-pointer select-none items-center rounded pl-6 pr-9 text-xs text-white hover:bg-white/10"
//         {...props}
//         ref={forwardedRef}
//       >
//         <Player.SelectItemText>{children}</Player.SelectItemText>
//         <Player.SelectItemIndicator className="absolute left-0 flex w-6 items-center justify-center">
//           <CheckIcon className="h-3.5 w-3.5 text-white" />
//         </Player.SelectItemIndicator>
//       </Player.RateSelectItem>
//     );
//   },
// );

// RateSelectItem.displayName = 'RateSelectItem';

export const TrendingPlayer: React.FC<{
  src: Src[] | null;
  title: string;
  assetMetadata?: AssetMetadata;
}> = ({ src, title, assetMetadata }) => {
  const [controlsVisible, setControlsVisible] = useState(true);
  const fadeTimeoutRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);
  const { currentPlayingId, setCurrentPlayingId } = useVideo();
  const playerId = useRef(Math.random().toString(36).substring(7)).current;

  const resetFadeTimeout = () => {
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
    }
    setControlsVisible(true);
    fadeTimeoutRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 2000);
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
      const video = containerRef.current?.querySelector("video");
      if (video && !video.paused) {
        video.pause();
      }
    }
  }, [currentPlayingId, playerId]);

  if (!src || src.length === 0) {
    return <div>No video source available.</div>;
  }

  const handleControlInteraction = () => {
    setControlsVisible(true);
    resetFadeTimeout();
  };

  const handlePlay = () => {
    setCurrentPlayingId(playerId);
  };

  return (
    <SubtitlesProvider>
      <Player.Root src={src} volume={1}>
        <Player.Container
          ref={containerRef}
          className="player-container relative h-full w-full touch-none"
          onMouseMove={resetFadeTimeout}
          onMouseEnter={() => setControlsVisible(true)}
          onTouchStart={handleControlInteraction}
        >
          <Player.Video
            title={title}
            className="absolute inset-0 h-full w-full object-cover"
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
            className={`pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 
                via-transparent to-black/60 transition-opacity duration-300 ${
                  controlsVisible ? "opacity-100" : "opacity-0"
                }`}
          />

          <div
            className={`absolute inset-0 z-30 touch-none transition-opacity duration-300 ${
              controlsVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* Top controls bar */}
            <div className="absolute left-0 right-0 top-0 bg-gradient-to-b from-black/60 to-transparent pt-2">
              <div
                className={`flex items-center justify-between px-3 py-1 ${
                  controlsVisible ? "opacity-100" : "opacity-0"
                }`}
              >
                <Player.Time className="rounded-full bg-black/40 px-2 py-0.5 text-xs font-medium tabular-nums text-white/90" />

                <div className="flex items-center gap-2">
                  {assetMetadata?.playbackId &&
                    assetMetadata.playbackId !== "" && (
                      <ViewsComponent playbackId={assetMetadata.playbackId} />
                    )}
                </div>

                {/* <div className="flex items-center gap-2">
                  {assetMetadata?.subtitles && <SubtitlesControl />}
                  <Player.FullscreenTrigger
                    className={`group relative flex h-8 w-8 cursor-pointer touch-none items-center 
                        justify-center rounded-full bg-black/50 hover:bg-black/70`}
                  >
                    <Player.FullscreenIndicator asChild matcher={false}>
                      <EnterFullscreenIcon className="h-5 w-5 text-white" />
                    </Player.FullscreenIndicator>
                    <Player.FullscreenIndicator asChild>
                      <ExitFullscreenIcon className="h-5 w-5 text-white" />
                    </Player.FullscreenIndicator>
                  </Player.FullscreenTrigger>
                  <Player.PictureInPictureTrigger
                    className={`group relative flex h-8 w-8 cursor-pointer touch-none items-center 
                        justify-center rounded-full bg-black/50 hover:bg-black/70`}
                  >
                    <PictureInPictureIcon className="h-5 w-5 text-white" />
                  </Player.PictureInPictureTrigger>
                </div> */}
              </div>
            </div>

            {/* Center play/pause and mute controls */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-4">
                <Player.PlayPauseTrigger
                  className={`group relative flex h-12 w-12 cursor-pointer touch-none items-center 
                        justify-center rounded-full bg-black/50 hover:bg-black/70`}
                  onClick={handleControlInteraction}
                >
                  <Player.PlayingIndicator asChild matcher={false}>
                    <PlayIcon className="h-8 w-8 text-white" />
                  </Player.PlayingIndicator>
                  <Player.PlayingIndicator asChild>
                    <PauseIcon className="h-8 w-8 text-white" />
                  </Player.PlayingIndicator>
                </Player.PlayPauseTrigger>

                <Player.MuteTrigger
                  className={`group relative flex h-10 w-10 cursor-pointer touch-none items-center 
                    justify-center rounded-full bg-black/50 hover:bg-black/70`}
                  onClick={handleControlInteraction}
                >
                  <Player.VolumeIndicator asChild matcher={false}>
                    <MuteIcon className="h-6 w-6 text-white" />
                  </Player.VolumeIndicator>
                  <Player.VolumeIndicator asChild matcher={true}>
                    <UnmuteIcon className="h-6 w-6 text-white" />
                  </Player.VolumeIndicator>
                </Player.MuteTrigger>
              </div>
            </div>

            {/* Bottom progress bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent pb-2">
              <Player.Seek
                className={`mt-1 flex h-4 touch-none select-none items-center px-3 transition-opacity duration-300 ${
                  controlsVisible ? "opacity-100" : "opacity-0"
                }`}
              >
                <Player.Track className="relative h-0.5 flex-grow rounded-full bg-white/30">
                  <Player.SeekBuffer className="absolute h-full rounded-full bg-white/50" />
                  <Player.Range className="absolute h-full rounded-full bg-white" />
                </Player.Track>
                <Player.Thumb className="block h-2.5 w-2.5 rounded-full bg-white" />
              </Player.Seek>
            </div>
          </div>
        </Player.Container>
      </Player.Root>
    </SubtitlesProvider>
  );
};
