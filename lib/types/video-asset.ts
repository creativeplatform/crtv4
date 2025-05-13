export interface VideoAsset {
  id: number;
  title: string;
  asset_id: string;
  category: string;
  location: string;
  playback_id: string;
  description: string | null;
  thumbnailUri: string;
  creator_id: string;
  status: "draft" | "published" | "minted" | "archived";
  duration: number | null;
  views_count: number;
  likes_count: number;
  is_minted: boolean;
  token_id: string | null;
  contract_address: string | null;
  minted_at: Date | null;
  mint_transaction_hash: string | null;
  royalty_percentage: number | null;
  price: number | null;
  max_supply: number | null;
  current_supply: number;
  metadata_uri: string | null;
  attributes: Record<string, any> | null;
  created_at: Date;
  updated_at: Date;
}

export interface NFTConfig {
  isMintable: boolean;
  maxSupply: number;
  price: number;
  royaltyPercentage: number;
}
