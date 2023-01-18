# Flipside Crypto JS SDK

Blockchain Data Where You Want It 🥳
<br>
<br>

![tests](https://github.com/flipsidecrypto/sdk/actions/workflows/ci.yml/badge.svg)
<br>
<br>
GM frens, you've found yourself at the Flipside Crypto JS/typescript sdk.
<br>
<br>
This SDK let's you access all the query awesomeness of [Flipside's product](https://app.flipsidecrypto.com), programmatically. The SDK can be run both in the browser and on the server. All blockchain data found in [Flipside's Query UI](https://app.flipsidecrypto.com) can be programmatically queried via the SDK.

## 🗝 Want early access? Grab an API Key

Our [JS/Typescript SDK](./js/) is currently in private alpha. We're accepting a limited number of users to test out the SDK and provide feedback.
<br>
<br>
Fill out this [form](https://forms.gle/Hii64SznA9B9dhLJ8) if your interested in early access.
<br>

## 💾 Install the SDK

```bash
yarn add @flipsidecrypto/sdk
```

or if using npm

```bash
npm install @flipsidecrypto/sdk
```

## 🦾 Getting Started

```typescript
import { Flipside, Query, QueryResultSet } from "@flipsidecrypto/sdk";

// Initialize `Flipside` with your API key
const flipside = new Flipside(
  "<YOUR_API_KEY>",
  "https://node-api.flipsidecrypto.com"
);

// Parameters can be passed into SQL statements via simple & native string interpolation
const myAddress = "0x....";

// Create a query object for the `query.run` function to execute
const query: Query = {
  sql: `select nft_address, mint_price_eth, mint_price_usd from flipside_prod_db.ethereum_core.ez_nft_mints where nft_to_address = LOWER('${myAddress}')`,
  ttlMinutes: 10,
};

// Send the `Query` to Flipside's query engine and await the results
const result: QueryResultSet = await flipside.query.run(query);

// Iterate over the results
result.records.map((record) => {
  const nftAddress = record.nft_address
  const mintPriceEth = record.mint_price_eth
  const mintPriceUSD = = record.mint_price_usd
  console.log(`address ${nftAddress} minted at a price of ${mintPrice} ETH or $${mintPriceUSD} USD`);
});
```

## The Details

### The `Query` Object

The `Query` object contains both the sql and configuration you can send to the query engine for execution.

```typescript
type Query = {
  // SQL query to execute
  sql: string;

  // The number of minutes to cache the query results
  ttlMinutes?: number;

  // An override on the query result cahce.
  // A value of false will re-execute the query.
  cached?: boolean;

  // The number of minutes until your query run times out
  timeoutMinutes?: number;
};
```

Let's create a query to retrieve all NFTs minted by an address:

```typescript
const yourAddress = "<your_ethereum_address>";

const query: Query = {
  sql: `select nft_address, mint_price_eth, mint_price_usd from flipside_prod_db.ethereum_core.ez_nft_mints where nft_to_address = LOWER('${myAddress}')`,
  ttlMinutes: 60,
  cached: true,
  timeoutMinutes: 15,
};
```

Now let's execute the query and retrieve the results.

```typescript
const result: QueryResultSet = await flipside.query.run(query);
```

The results of this query will be cached for 60 minutes, given the `ttlMinutes` parameter.

### The `QueryResultSet` Object

After executing a query the results are stored in a `QueryResultSet` object.

```typescript
interface QueryResultSet {
  // The server id of the query
  queryId: string | null;

  // The status of the query (`PENDING`, `FINISHED`, `ERROR`)
  status: QueryStatus | null;

  // The names of the columns in the result set
  columns: string[] | null;

  // The type of the columns in the result set
  columnTypes: string[] | null;

  // The results of the query
  rows: Row[] | null;

  // Summary stats on the query run (i.e. the number of rows returned, the elapsed time, etc)
  runStats: QueryRunStats | null;

  // The results of the query transformed as an array of objects
  records: QueryResultRecord[] | null;

  // If the query failed, this will contain the error
  error:
    | QueryRunRateLimitError
    | QueryRunTimeoutError
    | QueryRunExecutionError
    | ServerError
    | UserError
    | UnexpectedSDKError
    | null;
}
```

Let's iterate over the results from our query above.
<br>
<br>
Our query selected `nft_address`, `mint_price_eth`, and `mint_price_usd`. We can access the returned data via the `records` parameter. The column names in our query are assigned as keys in each record object.

```typescript
result.records.map((record) => {
  const nftAddress = record.nft_address
  const mintPriceEth = record.mint_price_eth
  const mintPriceUSD = = record.mint_price_usd
  console.log(`address ${nftAddress} minted at a price of ${mintPrice} ETH or $${mintPriceUSD} USD`);
});
```

### Rate Limits

Every API key is subject to a rate limit over a moving 5 minute window, as well as an aggregate daily limit.
<br>
<br>
If the limit is reach in a 5 minute period, the sdk will exponentially backoff and retry the query up to the `timeoutMinutes` parameter set on the `Query` object.
<br>
<br>
This feature is quite useful if leveraging the SDK client side and your web application sees a large spike in traffic. Rather than using up your daily limit all at once, requests will be smoothed out over the day.
<br>
<br>
Rate limits can be adjust per key/use-case.

### Client Side Request Requirements

All API Keys correspond to a list of hostnames. Client-side requests that do not originate from the corresponding hostname will fail.
