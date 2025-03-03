"use client";
import { useState, useEffect } from "react";
import { Avatar, AvatarImage } from "../ui/avatar";
import makeBlockie from "ethereum-blockies-base64";
import { shortenAddress, formatNumber } from "@/lib/utils/utils";
import { stack } from "@/lib/sdk/stack/client";
import { Button } from "../ui/button";
import { FaSpinner, FaTrophy } from "react-icons/fa";
import Link from "next/link";
import { useUser } from "@account-kit/react";
import { Address, createPublicClient, http, getAddress } from "viem";
import { mainnet } from "viem/chains";

interface LeaderboardItem {
  uniqueId: number;
  address: string;
  points: number;
  identities: any;
}

interface LeaderboardMetadata {
  label: string;
  bannerUrl: string;
  description: string;
  name: string;
  createdAt: string;
  url: string;
  primaryColor: string;
}

interface UserRank {
  address: string;
  rank: number;
  points: number;
}

export const AddressDisplay = ({ address }: { address: Address }) => {
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    const resolveEnsName = async () => {
      try {
        const publicClient = createPublicClient({
          chain: mainnet,
          transport: http(),
        });
        const ensName = await publicClient.getEnsName({ address });
        setDisplayName(ensName);
      } catch (error) {
        console.error("Error resolving ENS name:", error);
        setDisplayName(null);
      }
    };
    resolveEnsName();
  }, [address]);

  return (
    <div>
      {displayName ? (
        <p className="text-left">{displayName}</p>
      ) : (
        <p className="text-left">{shortenAddress(address)}</p>
      )}
    </div>
  );
};

export function TopChart() {
  const userInfo = useUser();
  const [data, setData] = useState<LeaderboardItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<LeaderboardMetadata | null>(null);
  const [userRank, setUserRank] = useState<UserRank | null>(null);

  // Fetch user's rank if they are logged in
  useEffect(() => {
    const fetchUserRank = async () => {
      if (!userInfo?.address) return;

      try {
        const rankData = await stack.getLeaderboardRank(userInfo.address);
        setUserRank(rankData as unknown as UserRank);
      } catch (err) {
        console.error("Failed to fetch user rank:", err);
      }
    };

    fetchUserRank();
  }, [userInfo?.address]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        // Construct the leaderboard query with a limit of 20
        const query = stack.leaderboardQuery().limit(20).build();

        // Fetch the leaderboard with the constructed query
        const leaderboard = await stack.getLeaderboard({ query });

        if (!leaderboard || !leaderboard.leaderboard) {
          console.warn("Leaderboard data is missing or empty.");
          setErrorMessage("Leaderboard data is missing or empty.");
          setData([]);
          return;
        }

        // Set leaderboard data directly without mapping
        setData(
          Array.isArray(leaderboard.leaderboard) ? leaderboard.leaderboard : []
        );

        // Set metadata if available
        if (leaderboard.metadatad) {
          setMetadata(leaderboard.metadatad as unknown as LeaderboardMetadata);
        }
      } catch (error: any) {
        console.error("Error fetching leaderboard data:", error);
        setErrorMessage("Failed to load leaderboard. Please try again later.");
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Split data into columns
  const columns: LeaderboardItem[][] = [[], [], [], []]; // Adjust this if you want more or fewer columns
  data.forEach((item, index) => {
    const columnIndex = Math.floor(index / 5); // Divide items into groups of 5
    if (columns[columnIndex]) {
      columns[columnIndex].push(item);
    }
  });

  // Get title from metadata or use default
  const title = metadata?.name ? metadata.name.toUpperCase() : "TOP CREATIVES";

  return (
    <div className="mx-auto w-full max-w-6xl py-8">
      <div className="mb-8 text-center">
        <h2 className="flex items-center justify-center gap-2 text-3xl font-bold">
          <FaTrophy className="h-6 w-6 text-yellow-500" />
          {title}
        </h2>
        {metadata?.description && (
          <p className="mt-2 text-sm text-gray-600 max-w-2xl mx-auto">
            {metadata.description}
          </p>
        )}
        {userRank && (
          <div className="mt-2 inline-flex items-center bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">
            <FaTrophy className="mr-2 text-yellow-500" />
            <span className="font-medium">Your Rank: #{userRank.rank}</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center">
          <FaSpinner className="mr-3 h-5 w-5 animate-spin" />
        </div>
      ) : errorMessage ? (
        <div className="text-center">
          <p className="text-red-500">{errorMessage}</p>
          <Button onClick={() => window.location.reload()} className="mt-2">
            Retry
          </Button>
        </div>
      ) : data.length === 0 ? (
        <p className="text-center text-gray-500">
          No leaderboard data available.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {columns.map((column, colIndex) => (
            <div
              key={colIndex}
              className={`mx-auto space-y-4 ${
                colIndex === 3 ? "hidden lg:block" : ""
              } ${colIndex === 2 ? "hidden md:block" : ""} `}
            >
              {column.map(({ address, points }, index) => (
                <div
                  key={address}
                  className={`flex items-center space-x-2 p-3 rounded-md ${
                    userInfo?.address === address
                      ? "bg-blue-100 dark:bg-blue-900/30"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <span className="min-w-[24px] text-right font-medium">
                    {colIndex * Math.ceil(data.length / 4) + index + 1}.
                  </span>
                  <Avatar className="h-10 w-10 rounded-full">
                    <AvatarImage
                      src={makeBlockie(address)}
                      className="h-10 w-10 rounded-full"
                      alt="User Avatar"
                    />
                  </Avatar>
                  <div className="flex flex-col">
                    <AddressDisplay
                      address={getAddress(address as `0x${string}`)}
                    />
                    <span className="text-gray-500">
                      {formatNumber(points)} points
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      <div className="mt-8 flex justify-center">
        <Link href="/leaderboard" className="w-full max-w-md">
          <Button
            variant="outline"
            className="w-full py-6 text-lg font-semibold hover:bg-muted"
          >
            View Leaderboard
          </Button>
        </Link>
      </div>
    </div>
  );
}

function TrophyIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}
