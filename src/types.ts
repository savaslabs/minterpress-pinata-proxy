// See https://tzip.tezosagora.org/proposal/tzip-21/
export interface tzip21_metadata {
  name: string;
  description?: string;
  symbol: string;
  decimals: number;
  artifactUri: string;
  displayUri: string;
  thumbnailUri: string;
  creators: string[];
  isTransferable: boolean;
  lastUpdate?: number;
  formats?: { uri: string; mimeType: string }[];
  isBooleanAmount?: boolean;
  shouldPreferSymbol: boolean;
  tags: string[];
  attributes?: { name: string; value: string }[];
  publishers: string[];
  type: string;
  minter: string;
}

// Response body based on https://github.com/claudebarde/taquito-pinata-tezos-nft
export interface MinterpressResponse {
  status: boolean;
  msg: any;
}
