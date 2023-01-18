"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _API_baseUrl, _API_headers;
Object.defineProperty(exports, "__esModule", { value: true });
exports.API = void 0;
const axios_1 = __importDefault(require("axios"));
const errors_1 = require("./errors");
const PARSE_ERROR_MSG = "the api returned an error and there was a fatal client side error parsing that error msg";
class API {
    constructor(baseUrl, apiKey) {
        _API_baseUrl.set(this, void 0);
        _API_headers.set(this, void 0);
        this.createQuery = (query, retryCount = 0) => __awaiter(this, void 0, void 0, function* () {
            let result;
            try {
                result = yield axios_1.default.post(this.getUrl("queries"), {
                    sql: query.sql,
                    ttl_minutes: query.ttlMinutes,
                    cached: query.cached,
                }, { headers: __classPrivateFieldGet(this, _API_headers, "f") });
            }
            catch (err) {
                if (err.errno == -4039) {
                    if (retryCount > 10) {
                        throw new errors_1.UnexpectedSDKError(PARSE_ERROR_MSG);
                    }
                    retryCount++;
                    console.log(`Timeout occurred while creating query: Retrying ${retryCount}`);
                    //timeout
                    return yield this.createQuery(query, retryCount);
                }
                let errData = err;
                result = errData.response;
                if (!result) {
                    throw new errors_1.UnexpectedSDKError(PARSE_ERROR_MSG);
                }
            }
            let data;
            if (result.status >= 200 && result.status < 300) {
                data = result.data;
            }
            else {
                data = null;
            }
            if (retryCount > 0) {
                console.log('Retry done');
            }
            return {
                statusCode: result.status,
                statusMsg: result.statusText,
                errorMsg: data === null || data === void 0 ? void 0 : data.errors,
                data,
            };
        });
        this.getQueryResult = (queryID, retryCount = 0) => __awaiter(this, void 0, void 0, function* () {
            let result;
            try {
                result = yield axios_1.default.get(this.getUrl(`queries/${queryID}`), {
                    method: "GET",
                    headers: __classPrivateFieldGet(this, _API_headers, "f"),
                });
            }
            catch (err) {
                if (err.errno == -4039) {
                    if (retryCount > 10) {
                        throw new errors_1.UnexpectedSDKError(PARSE_ERROR_MSG);
                    }
                    retryCount++;
                    console.log(`Timeout occurred while getting query result: Retrying ${retryCount}`);
                    //timeout
                    return yield this.getQueryResult(queryID, retryCount);
                }
                let errData = err;
                result = errData.response;
                if (!result) {
                    throw new errors_1.UnexpectedSDKError(PARSE_ERROR_MSG);
                }
            }
            let data;
            if (result.status >= 200 && result.status < 300) {
                data = result.data;
            }
            else {
                data = null;
            }
            if (retryCount > 0) {
                console.log('Retry done');
            }
            return {
                statusCode: result.status,
                statusMsg: result.statusText,
                errorMsg: data === null || data === void 0 ? void 0 : data.errors,
                data,
            };
        });
        __classPrivateFieldSet(this, _API_baseUrl, baseUrl, "f");
        __classPrivateFieldSet(this, _API_headers, {
            Accept: "application/json",
            "Content-Type": "application/json",
            "x-api-key": apiKey,
        }, "f");
    }
    getUrl(path) {
        return `${__classPrivateFieldGet(this, _API_baseUrl, "f")}/${path}`;
    }
}
exports.API = API;
_API_baseUrl = new WeakMap(), _API_headers = new WeakMap();
//# sourceMappingURL=api.js.map