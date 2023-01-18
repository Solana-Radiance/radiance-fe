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