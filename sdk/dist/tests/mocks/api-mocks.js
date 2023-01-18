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
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMockApiClient = void 0;
function getMockApiClient(input) {
    var _baseUrl, _headers;
    class MockApiClient {
        constructor(baseUrl, apiKey) {
            _baseUrl.set(this, void 0);
            _headers.set(this, void 0);
            __classPrivateFieldSet(this, _baseUrl, baseUrl);
            __classPrivateFieldSet(this, _headers, {
                Accept: "application/json",
                "Content-Type": "application/json",
                "x-api-key": apiKey,
            });
        }
        getUrl(path) {
            return `${__classPrivateFieldGet(this, _baseUrl)}/${path}`;
        }
        createQuery(query) {
            return __awaiter(this, void 0, void 0, function* () {
                return new Promise((resolve, reject) => {
                    resolve(input.createQueryResp);
                });
            });
        }
        getQueryResult(queryID) {
            return __awaiter(this, void 0, void 0, function* () {
                return yield new Promise((resolve, reject) => {
                    resolve(input.getQueryResultResp);
                });
            });
        }
    }
    _baseUrl = new WeakMap(), _headers = new WeakMap();
    return new MockApiClient("https://test.com", "api key");
}
exports.getMockApiClient = getMockApiClient;
//# sourceMappingURL=api-mocks.js.map