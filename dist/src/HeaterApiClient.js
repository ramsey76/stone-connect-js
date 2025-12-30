"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeaterApiClient = void 0;
const https_1 = __importDefault(require("https"));
const node_fetch_1 = __importDefault(require("node-fetch"));
class HeaterApiClient {
    constructor(baseUrl, authHeader, timeout) {
        this.baseUrl = baseUrl;
        this.authHeader = authHeader;
        this.timeout = timeout;
    }
    async request(method, endpoint, data = null) {
        const url = `${this.baseUrl}/${endpoint.replace(/^\//, '')}`;
        const agent = new https_1.default.Agent({ rejectUnauthorized: false });
        const options = {
            method,
            headers: {
                Authorization: this.authHeader,
                'Content-Type': 'application/json',
                'User-Agent': 'StoneConnect-Node-Client/1.0',
            },
            timeout: this.timeout,
            agent,
        };
        if (data)
            options.body = JSON.stringify(data);
        let res;
        try {
            res = await (0, node_fetch_1.default)(url, options);
        }
        catch (err) {
            throw new Error(`Connection failed: ${err.message}`);
        }
        if (res.status === 401)
            throw new Error('Authentication failed');
        if (res.status === 404)
            throw new Error(`Endpoint not found: ${endpoint}`);
        if (!res.ok)
            throw new Error(`API request failed: ${res.status} - ${await res.text()}`);
        try {
            return await res.json();
        }
        catch {
            const text = await res.text();
            return text ? { response: text } : {};
        }
    }
}
exports.HeaterApiClient = HeaterApiClient;
