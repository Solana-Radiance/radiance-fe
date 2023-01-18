import {
  Query,
  CreateQueryResp,
  QueryResultResp,
  CreateQueryJson,
  QueryResultJson,
  ApiClient,
} from "./types";
import axios, { AxiosError } from "axios";
import { UnexpectedSDKError } from "./errors";

const PARSE_ERROR_MSG =
  "the api returned an error and there was a fatal client side error parsing that error msg";

export class API implements ApiClient {
  #baseUrl: string;
  #headers: Record<string, string>;

  constructor(baseUrl: string, apiKey: string) {
    this.#baseUrl = baseUrl;
    this.#headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    };
  }

  getUrl(path: string): string {
    return `${this.#baseUrl}/${path}`;
  }

  createQuery = async(query: Query, retryCount: number = 0): Promise<CreateQueryResp> => {
    let result;
    try {
      result = await axios.post(
        this.getUrl("queries"),
        {
          sql: query.sql,
          ttl_minutes: query.ttlMinutes,
          cached: query.cached,
        },
        { headers: this.#headers }
      );
    } catch (err: any) {
      if(err.errno == -4039) {
        if(retryCount > 10) {
          throw new UnexpectedSDKError(PARSE_ERROR_MSG);
        }

        retryCount++;
        console.log(`Timeout occurred while creating query: Retrying ${retryCount}`);
        //timeout
        return await this.createQuery(query, retryCount);
      }
      let errData = err as AxiosError;
      result = errData.response;
      if (!result) {
        throw new UnexpectedSDKError(PARSE_ERROR_MSG);
      }
    }

    let data: CreateQueryJson | null;
    if (result.status >= 200 && result.status < 300) {
      data = result.data;
    } else {
      data = null;
    }

    if(retryCount > 0) {
      console.log('Retry done');
    }

    return {
      statusCode: result.status,
      statusMsg: result.statusText,
      errorMsg: data?.errors,
      data,
    };
  }

  getQueryResult = async(queryID: string, retryCount: number = 0): Promise<QueryResultResp> => {
    let result;
    try {
      result = await axios.get(this.getUrl(`queries/${queryID}`), {
        method: "GET",
        headers: this.#headers,
      });
    } catch (err: any) {
      if(err.errno == -4039) {
        if(retryCount > 10) {
          throw new UnexpectedSDKError(PARSE_ERROR_MSG);
        }

        retryCount++;
        console.log(`Timeout occurred while getting query result: Retrying ${retryCount}`);
        //timeout
        return await this.getQueryResult(queryID, retryCount);
      }
      let errData = err as AxiosError;
      result = errData.response;
      if (!result) {
        throw new UnexpectedSDKError(PARSE_ERROR_MSG);
      }
    }

    let data: QueryResultJson | null;
    if (result.status >= 200 && result.status < 300) {
      data = result.data;
    } else {
      data = null;
    }

    if(retryCount > 0) {
      console.log('Retry done');
    }

    return {
      statusCode: result.status,
      statusMsg: result.statusText,
      errorMsg: data?.errors,
      data,
    };
  }
}
