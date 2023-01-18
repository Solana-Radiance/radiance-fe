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