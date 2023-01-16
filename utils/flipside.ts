// need to use js cause no typing
import { Flipside } from "@flipsidecrypto/sdk";
import { sleep } from "./common";

// Initialize `Flipside` with your API key
const flipside = new Flipside(
  process.env.NEXT_PUBLIC_FLIPSIDE_API_KEY!,
  "https://node-api.flipsidecrypto.com"
);

export const query = async<T = any>(statement: string): Promise<T[] | undefined> => {
  let queryBody = {
      sql: statement,
      ttlMinutes: 10,
  };
  let ret = await flipside.query.run(queryBody);

  //ignore USER_ERROR
  if(ret.error && ret.error.errorType != 'USER_ERROR') {
      await sleep(3000);
      return await query(statement);
  }

  if(!ret.records) {
      return [] as T[];
  }

  return ret.records as T[];
}