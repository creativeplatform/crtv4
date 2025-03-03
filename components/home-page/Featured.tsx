'use client';

import React from 'react';

const FeaturedVideo: React.FC = () => {
  return (
    <div className="mx-auto max-w-7xl py-10">
      <h2 className="mb-8 text-2xl font-bold">Featured</h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="overflow-hidden rounded-lg bg-gray-100 shadow-md transition-all hover:shadow-lg dark:bg-gray-800">
          <div className="aspect-video w-full bg-gray-200 dark:bg-gray-700"></div>
          <div className="p-4">
            <h3 className="mb-2 text-xl font-medium">Featured Video Title</h3>
            <p className="text-sm text-gray-500">Featured Creator</p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              This is a featured video description that highlights why this content is special and why
              viewers should watch it.
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Why Watch</h3>
          <ul className="list-inside list-disc space-y-2">
            <li>Exclusive content from top creators</li>
            <li>High-quality production value</li>
            <li>Trending topics and discussions</li>
            <li>Community-recommended content</li>
          </ul>
          <button className="mt-4 rounded-full bg-orange-500 px-6 py-2 text-white transition hover:bg-orange-600">
            Watch Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeaturedVideo;
