interface MemberData {
  address: string;
  balance?: string;
  points?: number;
}

interface NFTData {
  tokenId: bigint;
  metadata: string;
}

interface ProfileState {
  memberData: MemberData | null;
  nftData: NFTData | null;
  balance: string;
  points: number;
  ownedIds: bigint[];
  isLoading: boolean;
  hasValidKey: boolean;
}

export type { MemberData, NFTData, ProfileState };
