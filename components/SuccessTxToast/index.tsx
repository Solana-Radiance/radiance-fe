import React from 'react';

export type ToastProps = {
    txId: string;
    message?: string;
    linkMessage?: string;
}
export const SuccessTxToast = ({txId, message, linkMessage}: ToastProps) => (
    <div className='link-toast'>
        {message ?? "Transaction Succeeded!"}
        <a target="_blank" rel="noopener noreferrer" href={`https://solana.fm/tx/${txId}`}>{linkMessage ?? "View in Solana FM"}</a>
    </div>
);