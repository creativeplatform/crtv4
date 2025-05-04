export interface MetokenSubscription {
  asset: string;
  assetsDeposited: number;
  db_write_timestamp?: Date;
  hubId: number;
  id: string;
  meToken: string;
  minted: number;
  name: string;
  owner: string;
  symbol: string;
}

export interface MetokenFormData {
  name: string;
  symbol: string;
  owner: string;
  diamond: string;
}

export interface MetokenRegisterEntry {
  id: string;
  owner: string;
  asset: string;
  vault: string;
  db_write_timestamp: string;
}

export interface CheckOwnerResponse {
  Metokens_Register: MetokenRegisterEntry[];
}
