'use client';

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { AddressDisplay } from "../home-page/TopChart";
import makeBlockie from "ethereum-blockies-base64";
import { Address, getAddress } from "viem";
import { formatNumber } from "@/lib/utils/utils";

interface LeaderboardItemProps {
  rank: number;
  address: Address;
  points: number;
  isCurrentUser?: boolean;
  hideRank?: boolean;
  hidePoints?: boolean;
}

export default function LeaderboardItem({
  rank,
  address,
  points,
  isCurrentUser,
  hideRank = false,
  hidePoints = false,
}: LeaderboardItemProps) {
  return (
    <div
      className={`flex items-center space-x-4 ${!hideRank ? 'p-3 rounded-md' : ''} ${
        isCurrentUser && !hideRank
          ? "bg-blue-100 dark:bg-blue-900/30"
          : hideRank ? "" : "hover:bg-gray-100 dark:hover:bg-gray-800"
      }`}
    >
      {!hideRank && (
        <span className="min-w-[24px] text-right font-medium">{rank}.</span>
      )}
      <Avatar className="h-10 w-10 rounded-full">
        <AvatarImage
          src={makeBlockie(address)}
          className="h-10 w-10 rounded-full"
          alt="User Avatar"
        />
      </Avatar>
      <div className="flex flex-col">
        <AddressDisplay address={getAddress(address)} />
        {!hidePoints && (
          <span className="text-gray-500">{formatNumber(points)} points</span>
        )}
      </div>
    </div>
  );
}
