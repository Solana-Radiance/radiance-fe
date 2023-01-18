import { BaseProps } from "../_app-type";

export interface SwapsProps extends BaseProps {}

export interface VolumeData {
    date: string;
    total_volume: number;
    total_profit: number;
    total_tx: number;
    cumulative_volume: number;
    cumulative_profit: number;
    cumulative_tx: number;
}

export interface TxData {
    block_timestamp: string;
    tx_id: string;
    symbol_from: string;
    symbol_to: string;
    swap_from_amount: number;
    swap_from_amount_usd: number;
    swap_to_amount: number;
    swap_to_amount_usd: number;
    profit_usd: number;
}