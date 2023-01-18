import { BaseProps } from "../_app-type";

export interface NftsProps extends BaseProps {}

export interface VolumeData {
    date: string;
    total_volume_sol: number;
    total_volume_usd: number;
    total_tx: number;
    total_profit_sol: number;
    total_profit_usd: number;
    cumulative_tx: number;
    cumulative_volume_sol: number;
    cumulative_volume_usd: number;
    cumulative_profit_sol: number;
    cumulative_profit_usd: number;
}

export interface TxData {
    block_timestamp: string;
    tx_id: string;
    tx_from: string;
    tx_to: string;
    mint: string;
    obtained_by: string;
    currency: string;
    amount_currency: number;
    amount_usd: number;
}

export interface NftMetadata {
    mint: string;
    onChainData: {
        collection: {
            key: string;
            verified: boolean;
        };
        collectionDetails: null;
        data: {
            creators: {
                address: string;
                share: number;
                verified: true
            }[];
            
            name: string;
            sellerFeeBasisPoints: number;
            symbol: string;
            uri: string;
        };
        editionNonce: number;
        isMutable: boolean;
        key: string;
        mint: string;
        primarySaleHappened: boolean;
        tokenStandard: null;
        updateAuthority: string;
        uses: null;
    };
    offChainData: {
        attributes: {
            traitType: string;
            value: string;
        }[]
        description: string;
        image: string;
        name: string;
        properties: {
        category: string;
            creators: {
                address: string;
                share: number
            }[];
            files: {
                type: string;
                uri: string;
            }[];
        };
        sellerFeeBasisPoints: number;
        symbol: string;
    };
}