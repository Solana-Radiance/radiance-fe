# Kida's Solana Radiance

Radiance is a Solana Wallet Visualizer / Profiler. Here, you can:

1. See your swap volume, profits, etc.
2. See your NFT buys, sells, and transfers.
3. Check your rank against all other Solana users.
4. BONK your enemies! and friends.
5. Chat with any wallet you want via Dialect.
6. DOWNLOAD your transactions in CSV format!

## Installation

1. Clone this repo.
2. ```yarn```
3. Go to ``node_modules/@flipsidecrypto/sdk/dist/sdk`` and move its contents to ``node_modules/@flipsidecrypto/sdk/dist`` !! IMPORTANT !!
4. Configure ``.env`` file, should be self explanatory.
5. ```yarn dev``` or ```yarn build && yarn start```
6. Done!

## Notes

1. Swaps data only starts in August 2021, so some data might be missing.
2. Swap Profit is only calculated by the average price of the tokens on that day.
3. NFT Profit is calculated by total sale - total buy on that day.

## Work in Progress

1. Wallet Value over Time
