'use client';

import React from 'react';

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
  src: any;
  title: string;
}> = ({ src, title }) => {
  return (
    <div className="relative w-full">
      <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
        <div className="h-full w-full">
          {/* Placeholder for actual player implementation */}
          <div className="flex h-full w-full items-center justify-center bg-gray-900">
            <p className="text-lg font-medium text-white">{title}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
