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
      {
        protocol: "https",
        hostname: "ipfs.io",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.ipfs.dweb.link",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.ipfs.cf-ipfs.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "nft.storage",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "gateway.pinata.cloud",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.googleapis.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "snapshotsplugin.s3.us-west-2.amazonaws.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
