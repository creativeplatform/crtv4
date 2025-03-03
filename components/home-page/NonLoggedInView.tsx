'use client';

import React from 'react';
import HeroSection from './HeroSection';
import { TopChart } from './TopChart';
import FeaturedVideo from './Featured';
import { TopVideos } from './TopVideos';

const NonLoggedInView: React.FC = () => {
  return (
    <div>
      <HeroSection />
      <TopChart />
      <FeaturedVideo />
      <TopVideos />
    </div>
  );
};

export default NonLoggedInView;
