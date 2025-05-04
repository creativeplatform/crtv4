'use client';

import React from 'react';
import { useParams, useSearchParams } from 'next/navigation';

export default function AssetDetails() {
  const params = useParams();
  const searchParams = useSearchParams();

  // Extract the 'video' query parameter
  const videoParam = searchParams.get('video');
  let videoData = null;

  try {
    videoData = videoParam ? JSON.parse(videoParam) : null;
  } catch (error) {
    console.error('Failed to parse video query parameter:', error);
  }

  const setPermission = () => {
    // Example usage of MediaRenderer with videoData
    // <MediaRenderer src={`${videoData?.storage?.ipfs?.url}`} />
  };

  return (
    <div>
      <p>Post ID: {params.id}</p>
      {videoData && <p>Video: {videoData.title}</p>}
      {/* Add more UI elements as needed */}
    </div>
  );
}
