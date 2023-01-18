import { BaseProps } from "../_app-type";

export interface StakesProps extends BaseProps {}

export interface StakeData {
    date: string;
    total_deposit: number;
    total_withdraw: number;
    stake_balance_diff: number;
    total_stake_balance: number;
}