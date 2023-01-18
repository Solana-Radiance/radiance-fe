import { BaseProps } from "../_app-type";

export interface StakesProps extends BaseProps {}

export interface StakeData {
    date: string;
    total_deposit: number;
    total_withdraw: number;
    stake_balance_diff: number;
    total_stake_balance: number;
}

export interface TxData {
    block_timestamp: string;
    tx_id: string;
    index: number;
    event_type: string;
    stake_account: string;
    pre_tx_staked_balance_adj: number;
    post_tx_staked_balance_adj: number;
    net_deposit_amount: number;
}