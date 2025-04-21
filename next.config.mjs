/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname:
          "bafybeiesvinhgaqvr62rj77jbwkazg3w6bhcrsfyg6zyozasaud53nucnm.ipfs.w3s.link",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
