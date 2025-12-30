"use strict";
// Node.js client for Stone Connect WiFi Electric Heater (TypeScript)
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoneConnectHeater = void 0;
const OperationModes_1 = require("./OperationModes");
const HeaterApiClient_1 = require("./HeaterApiClient");
const HeaterUtils_1 = require("./HeaterUtils");
class StoneConnectHeater {
    constructor({ host, port = 443, username = StoneConnectHeater.DEFAULT_USERNAME, password = StoneConnectHeater.DEFAULT_PASSWORD, timeout = 30000 }) {
        const baseUrl = `https://${host}:${port}/Domestic_Heating/Radiators/v1`;
        const credentials = Buffer.from(`${username}:${password}`).toString('base64');
        const authHeader = `Basic ${credentials}`;
        this.apiClient = new HeaterApiClient_1.HeaterApiClient(baseUrl, authHeader, timeout);
    }
    async getInfo() {
        return await this.apiClient.request('GET', 'info');
    }
    async getStatus() {
        return await this.apiClient.request('GET', 'status');
    }
    async getSchedule() {
        return await this.apiClient.request('GET', 'Schedule');
    }
    async setTemperatureAndMode(temperature, mode) {
        if (!(0, HeaterUtils_1.isPowerMode)(mode)) {
            (0, HeaterUtils_1.validateTemperature)(temperature);
        }
        const deviceInfo = await this.getInfo();
        const clientId = deviceInfo.Client_ID || deviceInfo.client_id;
        const body = {
            Client_ID: clientId,
            Operative_Mode: mode,
            Set_Point: (0, HeaterUtils_1.isPowerMode)(mode) ? 0 : temperature,
        };
        await this.apiClient.request('PUT', 'setpoint', body);
    }
    async setTemperature(temperature, mode = null) {
        (0, HeaterUtils_1.validateTemperature)(temperature);
        let actualMode;
        if (!mode) {
            const status = await this.getStatus();
            actualMode = status.Operative_Mode || OperationModes_1.OperationModes.MANUAL;
        }
        else {
            actualMode = mode;
        }
        if (!(0, HeaterUtils_1.isCustomMode)(actualMode)) {
            if ((0, HeaterUtils_1.isPowerMode)(actualMode)) {
                throw new Error(`Power mode ${actualMode} doesn't use temperature setpoints. Use setOperationMode instead.`);
            }
            else if ((0, HeaterUtils_1.isPresetMode)(actualMode)) {
                throw new Error(`Preset mode ${actualMode} uses predefined temperature. Use setOperationMode instead.`);
            }
            else {
                throw new Error(`Mode ${actualMode} doesn't support custom temperature setpoints.`);
            }
        }
        await this.setTemperatureAndMode(temperature, actualMode);
    }
    async setOperationMode(mode) {
        const deviceInfo = await this.getInfo();
        let temperature;
        if ((0, HeaterUtils_1.isPowerMode)(mode)) {
            temperature = 0;
        }
        else if ((0, HeaterUtils_1.isPresetMode)(mode)) {
            temperature = (0, HeaterUtils_1.getPresetSetpoint)(mode, deviceInfo);
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
        await this.setOperationMode(OperationModes_1.OperationModes.COMFORT);
    }
    async setEcoMode() {
        await this.setOperationMode(OperationModes_1.OperationModes.ECO);
    }
    async setAntifreezeMode() {
        await this.setOperationMode(OperationModes_1.OperationModes.ANTIFREEZE);
    }
    async setBoostMode() {
        await this.setOperationMode(OperationModes_1.OperationModes.BOOST);
    }
    async setManualTemperature(temperature) {
        await this.setTemperature(temperature, OperationModes_1.OperationModes.MANUAL);
    }
    async setPowerMode(powerLevel) {
        if (!(0, HeaterUtils_1.isPowerMode)(powerLevel)) {
            throw new Error(`${powerLevel} is not a valid power mode. Use HIGH, MEDIUM, or LOW.`);
        }
        await this.setOperationMode(powerLevel);
    }
    async setStandby() {
        await this.setOperationMode(OperationModes_1.OperationModes.STANDBY);
    }
    async getCurrentTemperature() {
        const info = await this.getInfo();
        return info.Set_Point ?? info.set_point;
    }
    async getTargetTemperature() {
        const status = await this.getStatus();
        return status.Set_Point ?? status.set_point;
    }
    async isHeating() {
        const status = await this.getStatus();
        if (!status.Operative_Mode)
            return null;
        return status.Operative_Mode !== OperationModes_1.OperationModes.STANDBY;
    }
    async getSignalStrength() {
        const status = await this.getStatus();
        return status.RSSI ?? status.rssi;
    }
    async isLocked() {
        const status = await this.getStatus();
        return status.Lock_Status ?? status.lock_status;
    }
    async getErrorCode() {
        const status = await this.getStatus();
        return status.Error_Code ?? status.error_code;
    }
    async getDailyEnergy() {
        const status = await this.getStatus();
        return status.Daily_Energy ?? status.daily_energy;
    }
    async getPowerConsumption() {
        const status = await this.getStatus();
        return status.Power_Consumption_Watt ?? status.power_consumption_watt;
    }
}
exports.StoneConnectHeater = StoneConnectHeater;
StoneConnectHeater.DEFAULT_USERNAME = 'App_RadWiFi_v1';
StoneConnectHeater.DEFAULT_PASSWORD = 'e1qf45s4w8e7q5wda4s5d1as2';
StoneConnectHeater.OperationModes = OperationModes_1.OperationModes;
