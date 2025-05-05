"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

/**
 * VideoContext Type Definition
 *
 * Manages the state of which video is currently playing across the application.
 * This context helps prevent multiple videos from playing simultaneously and
 * provides a way to track the currently active video.
 *
 * @property {string|null} currentPlayingId - ID of the currently playing video (typically a playback ID)
 * @property {Function} setCurrentPlayingId - Function to update the currently playing video
 */
interface VideoContextType {
  currentPlayingId: string | null;
  setCurrentPlayingId: (id: string | null) => void;
}

/**
 * Create the Video Context with default values
 */
const VideoContext = createContext<VideoContextType>({
  currentPlayingId: null,
  setCurrentPlayingId: () => {},
});

/**
 * Custom hook to access the Video context
 *
 * Use this hook in any component that needs to:
 * - Check which video is currently playing
 * - Set a new video as the currently playing one
 * - Pause a video when another one starts playing
 *
 * Example usage:
 * ```tsx
 * function VideoComponent({ playbackId }) {
 *   const { currentPlayingId, setCurrentPlayingId } = useVideo();
 *
 *   const handlePlay = () => {
 *     setCurrentPlayingId(playbackId); // Notify the app this video is now playing
 *   };
 *
 *   useEffect(() => {
 *     // Pause this video if another one started playing
 *     if (currentPlayingId && currentPlayingId !== playbackId) {
 *       pauseVideo();
 *     }
 *   }, [currentPlayingId, playbackId]);
 *
 *   return <video onPlay={handlePlay} ... />;
 * }
 * ```
 *
 * @returns {VideoContextType} The Video context values and functions
 */
export const useVideo = () => useContext(VideoContext);

/**
 * Video Provider Component
 *
 * Provides video state management throughout the application.
 * Wrap your application with this provider to enable video state tracking.
 *
 * Usage:
 * ```tsx
 * <VideoProvider>
 *   <YourApp />
 * </VideoProvider>
 * ```
 *
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child components
 */
export const VideoProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);

  return (
    <VideoContext.Provider value={{ currentPlayingId, setCurrentPlayingId }}>
      {children}
    </VideoContext.Provider>
  );
};
