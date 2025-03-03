'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface VideoContextType {
  currentPlayingId: string | null;
  setCurrentPlayingId: (id: string) => void;
}

const VideoContext = createContext<VideoContextType>({
  currentPlayingId: null,
  setCurrentPlayingId: () => {},
});

export const useVideo = () => useContext(VideoContext);

export const VideoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);

  return (
    <VideoContext.Provider value={{ currentPlayingId, setCurrentPlayingId }}>
      {children}
    </VideoContext.Provider>
  );
};
