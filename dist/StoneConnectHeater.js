"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoneConnectHeater = exports.OperationModes = void 0;
// Node.js client for Stone Connect WiFi Electric Heater (TypeScript)
const node_fetch_1 = __importDefault(require("node-fetch"));
const https_1 = __importDefault(require("https"));
var OperationModes;
(function (OperationModes) {
    OperationModes["ANTIFREEZE"] = "ANF";
    OperationModes["BOOST"] = "BST";
    OperationModes["COMFORT"] = "CMF";
    OperationModes["ECO"] = "ECO";
    OperationModes["HIGH"] = "HIG";
    OperationModes["HOLIDAY"] = "HOL";
    OperationModes["LOW"] = "LOW";
    OperationModes["MANUAL"] = "MAN";
    OperationModes["MEDIUM"] = "MED";
    OperationModes["SCHEDULE"] = "SCH";
    OperationModes["STANDBY"] = "SBY";
})(OperationModes || (exports.OperationModes = OperationModes = {}));
class StoneConnectHeater {
    constructor({ host, port = 443, username = StoneConnectHeater.DEFAULT_USERNAME, password = StoneConnectHeater.DEFAULT_PASSWORD, timeout = 30000 }) {
        this.host = host;
        this.port = port;
        this.username = username;
        this.password = password;
        this.timeout = timeout;
        this.baseUrl = `https://${host}:${port}/Domestic_Heating/Radiators/v1`;
        const credentials = Buffer.from(`${username}:${password}`).toString('base64');
        this.authHeader = `Basic ${credentials}`;
    }
    async _request(method, endpoint, data = null) {
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
    async getInfo() {
        return await this._request('GET', 'info');
    }
    async getStatus() {
        return await this._request('GET', 'status');
    }
    async getSchedule() {
        return await this._request('GET', 'Schedule');
    }
    async setTemperatureAndMode(temperature, mode) {
        if (!StoneConnectHeater._isPowerMode(mode)) {
            StoneConnectHeater._validateTemperature(temperature);
        }
        const deviceInfo = await this.getInfo();
        const clientId = deviceInfo.Client_ID || deviceInfo.client_id;
        const body = {
            Client_ID: clientId,
            Operative_Mode: mode,
            Set_Point: StoneConnectHeater._isPowerMode(mode) ? 0 : temperature,
        };
        await this._request('PUT', 'setpoint', body);
    }
    async setTemperature(temperature, mode = null) {
        StoneConnectHeater._validateTemperature(temperature);
        if (!mode) {
            const status = await this.getStatus();
            mode = status.Operative_Mode || OperationModes.MANUAL;
        }
        if (!StoneConnectHeater._isCustomMode(mode)) {
            if (StoneConnectHeater._isPowerMode(mode)) {
                throw new Error(`Power mode ${mode} doesn't use temperature setpoints. Use setOperationMode instead.`);
            }
            else if (StoneConnectHeater._isPresetMode(mode)) {
                throw new Error(`Preset mode ${mode} uses predefined temperature. Use setOperationMode instead.`);
            }
            else {
                throw new Error(`Mode ${mode} doesn't support custom temperature setpoints.`);
            }
        }
        await this.setTemperatureAndMode(temperature, mode);
    }
    async setOperationMode(mode) {
        const deviceInfo = await this.getInfo();
        let temperature;
        if (StoneConnectHeater._isPowerMode(mode)) {
            temperature = 0;
        }
        else if (StoneConnectHeater._isPresetMode(mode)) {
            temperature = StoneConnectHeater._getPresetSetpoint(mode, deviceInfo);
            if (temperature == null)
                throw new Error(`No preset temperature found for mode ${mode}`);
        }
        else {
            const status = await this.getStatus();
            temperature = status.Set_Point || 20.0;
        }
        await this.setTemperatureAndMode(temperature, mode);
    }
    async isOnline() {
        try {
            await this.getStatus();
            return true;
        }
        catch {
            return false;
        }
    }
    async hasPowerMeasurementSupport() {
        const info = await this.getInfo();
        return info.Load_Size_Watt !== 0;
    }
    async setComfortMode() {
        await this.setOperationMode(OperationModes.COMFORT);
    }
    async setEcoMode() {
        await this.setOperationMode(OperationModes.ECO);
    }
    async setAntifreezeMode() {
        await this.setOperationMode(OperationModes.ANTIFREEZE);
    }
    async setManualTemperature(temperature) {
        await this.setTemperature(temperature, OperationModes.MANUAL);
    }
    async setPowerMode(powerLevel) {
        if (!StoneConnectHeater._isPowerMode(powerLevel)) {
            throw new Error(`${powerLevel} is not a valid power mode. Use HIGH, MEDIUM, or LOW.`);
        }
        await this.setOperationMode(powerLevel);
    }
    async setStandby() {
        await this.setOperationMode(OperationModes.STANDBY);
    }
    async getCurrentTemperature() {
        const info = await this.getInfo();
        return info.Set_Point || info.set_point;
    }
    async getTargetTemperature() {
        const status = await this.getStatus();
        return status.Set_Point || status.set_point;
    }
    async isHeating() {
        const status = await this.getStatus();
        if (!status.Operative_Mode)
            return null;
        return status.Operative_Mode !== OperationModes.STANDBY;
    }
    async getSignalStrength() {
        const status = await this.getStatus();
        return status.RSSI || status.rssi;
    }
    async isLocked() {
        const status = await this.getStatus();
        return status.Lock_Status || status.lock_status;
    }
    async getErrorCode() {
        const status = await this.getStatus();
        return status.Error_Code || status.error_code;
    }
    async getDailyEnergy() {
        const status = await this.getStatus();
        return status.Daily_Energy || status.daily_energy;
    }
    async getPowerConsumption() {
        const status = await this.getStatus();
        return status.Power_Consumption_Watt || status.power_consumption_watt;
    }
    static _validateTemperature(temperature) {
        if (temperature < 0 || temperature > 30) {
            throw new Error('Temperature must be between 0 and 30°C');
        }
    }
    static _isPowerMode(mode) {
        return [OperationModes.HIGH, OperationModes.MEDIUM, OperationModes.LOW].includes(mode);
    }
    static _isPresetMode(mode) {
        return [OperationModes.COMFORT, OperationModes.ECO, OperationModes.ANTIFREEZE].includes(mode);
    }
    static _isCustomMode(mode) {
        return [OperationModes.MANUAL, OperationModes.BOOST].includes(mode);
    }
    static _getPresetSetpoint(mode, deviceInfo) {
        if (mode === OperationModes.COMFORT)
            return deviceInfo.Comfort_Setpoint || deviceInfo.comfort_setpoint;
        if (mode === OperationModes.ECO)
            return deviceInfo.Eco_Setpoint || deviceInfo.eco_setpoint;
        if (mode === OperationModes.ANTIFREEZE)
            return deviceInfo.Antifreeze_Setpoint || deviceInfo.antifreeze_setpoint;
        return null;
    }
}
exports.StoneConnectHeater = StoneConnectHeater;
StoneConnectHeater.DEFAULT_USERNAME = 'App_RadWiFi_v1';
StoneConnectHeater.DEFAULT_PASSWORD = 'e1qf45s4w8e7q5wda4s5d1as2';
StoneConnectHeater.OperationModes = OperationModes;
