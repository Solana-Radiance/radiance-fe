import { Query, CreateQueryResp, QueryResultResp, ApiClient } from "./types";
export declare class API implements ApiClient {
    #private;
    constructor(baseUrl: string, apiKey: string);
    getUrl(path: string): string;
    createQuery: (query: Query, retryCount?: number) => Promise<CreateQueryResp>;
    getQueryResult: (queryID: string, retryCount?: number) => Promise<QueryResultResp>;
}
//# sourceMappingURL=api.d.ts.map