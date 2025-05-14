"use client";

import React from "react";
import HeroSection from "./HeroSection";
import { TopChart } from "./TopChart";
import { TopVideos } from "./TopVideos";

const NonLoggedInView: React.FC = () => {
  return (
    <div>
      <HeroSection />
      <TopChart />
      <TopVideos />
    </div>
  );
};

export default NonLoggedInView;
