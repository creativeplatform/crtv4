'use client';

import React from 'react';

export const TopVideos: React.FC = () => {
  return (
    <div className="mx-auto max-w-7xl py-10">
      <h2 className="mb-8 text-2xl font-bold">Top Videos</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Placeholder for top videos */}
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-lg bg-gray-100 shadow-md transition-all hover:shadow-lg dark:bg-gray-800"
          >
            <div className="aspect-video w-full bg-gray-200 dark:bg-gray-700"></div>
            <div className="p-4">
              <h3 className="mb-2 font-medium">Top Video {index + 1}</h3>
              <p className="text-sm text-gray-500">Creator Name</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-gray-400">10K views</span>
                <span className="text-xs text-gray-400">3 days ago</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
