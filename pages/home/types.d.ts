import { BaseProps } from "../_app-type";

export interface HomeProps extends BaseProps {
    navigation: {
        navigation: any;  /* not exported */
        open: () => void;
    }; // navigator not exported
}

export interface BalanceData {
    date: string;
    // mint: string;
    // price: number;
    // symbol: string;
    // balance: number;
    balance_usd: number;
}

export interface RankData {
    address: string;
    total_volume: number;
    total_tx: number;
    address_count: number;
    rank_by_volume: number;
    rank_by_volume_pct: number;
    tier_by_volume: string;
    rank_by_tx_count: number;
    rank_by_tx_count_pct: number;
    tier_by_tx_count: string;
}

export interface TokenBalances {
    [address: string]: {
        amount: number;
        amount_usd: number;
        logo: string;
        name: string;
    };
}

export interface TokenData {
    token_address: string;
    symbol: string;
    logo: string;
    price: number;
}

export interface NFTData {
    block_timestamp: string;
    tx_id: string;
    tx_from: string;
    tx_to: string;
    mint: string;
    obtained_by: string;
    currency: string;
    amount_currency: number;
    amount_usd: number;

    //added later
    dateStr?: string;
    age?: string;
}