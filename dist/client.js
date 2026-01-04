// src/client.ts
import { OperationMode } from './models.js';
export class StoneConnectClient {
    constructor(host, port = 443, username = 'App_RadWiFi_v1', password = 'e1qf45s4w8e7q5wda4s5d1as2') {
        this.schedule = null;
        this.info = {
            clientId: host, // For simulation, use host as clientId
            setPoint: 19.0,
            operativeMode: OperationMode.COMFORT,
            powerConsumptionWatt: 0,
            dailyEnergy: 0,
            errorCode: 0,
            lockStatus: false,
            connectedToBroker: false,
            brokerEnabled: false,
            lastUpdate: new Date(),
            comfortSetpoint: 21,
            ecoSetpoint: 17,
            antifreezeSetpoint: 7,
            loadSizeWatt: 1000,
            host,
            port,
            username,
            password,
        };
        this.status = { ...this.info };
    }
    async connect() {
        this.status.connectedToBroker = true;
        this.status.lastUpdate = new Date();
        // Simulate info update
        this.info.connectedToBroker = true;
        this.info.lastUpdate = new Date();
        console.log(`Connected to: Heater (${this.status.clientId})`);
    }
    async close() {
        this.status.connectedToBroker = false;
        this.status.lastUpdate = new Date();
    }
    async getInfo() {
        return { ...this.info };
    }
    async getStatus() {
        this.status.lastUpdate = new Date();
        return { ...this.status };
    }
    async getSchedule() {
        return this.schedule;
    }
    async setTemperatureAndMode(temperature, mode) {
        if (!this._isPowerMode(mode)) {
            this._validateTemperature(temperature);
            this.status.setPoint = temperature;
        }
        else {
            this.status.setPoint = 0;
        }
        this.status.operativeMode = mode;
        this.status.lastUpdate = new Date();
    }
    async setTemperature(temperature, mode) {
        this._validateTemperature(temperature);
        const currentMode = mode ?? this.status.operativeMode;
        if (!this._isCustomTemperatureMode(currentMode)) {
            if (this._isPowerMode(currentMode)) {
                throw new Error(`Power mode ${currentMode} doesn't use temperature setpoints.`);
            }
            throw new Error(`Mode ${currentMode} doesn't support custom temperature setpoints.`);
        }
        await this.setTemperatureAndMode(temperature, currentMode);
    }
    async setOperationMode(mode) {
        let temperature = 0;
        if (this._isPowerMode(mode)) {
            temperature = 0;
        }
        else if (this._isPresetMode(mode)) {
            temperature = this._getPresetSetpoint(mode, this.info) ?? 20;
        }
        else {
            temperature = this.status.setPoint ?? 20;
        }
        await this.setTemperatureAndMode(temperature, mode);
    }
    async isOnline() {
        return this.status.connectedToBroker;
    }
    async hasPowerMeasurementSupport() {
        return (this.info.loadSizeWatt ?? 0) !== 0;
    }
    async setComfortMode() {
        await this.setOperationMode(OperationMode.COMFORT);
    }
    async setEcoMode() {
        await this.setOperationMode(OperationMode.ECO);
    }
    async setAntifreezeMode() {
        await this.setOperationMode(OperationMode.OFF); // No ANTIFREEZE in enum, using OFF
    }
    async setManualTemperature(temperature) {
        await this.setTemperature(temperature, OperationMode.COMFORT); // No MANUAL, using COMFORT
    }
    async setPowerMode(mode) {
        if (!this._isPowerMode(mode)) {
            throw new Error(`${mode} is not a valid power mode.`);
        }
        await this.setOperationMode(mode);
    }
    async setStandby() {
        await this.setOperationMode(OperationMode.OFF);
    }
    async getCurrentTemperature() {
        return this.info.setPoint;
    }
    async getTargetTemperature() {
        return this.status.setPoint;
    }
    async isHeating() {
        return this.status.operativeMode !== OperationMode.OFF;
    }
    async getSignalStrength() {
        return this.status.rssi;
    }
    async isLocked() {
        return this.status.lockStatus;
    }
    async getErrorCode() {
        return this.status.errorCode;
    }
    async getDailyEnergy() {
        return this.status.dailyEnergy;
    }
    async getPowerConsumption() {
        return this.status.powerConsumptionWatt;
    }
    _validateTemperature(temperature) {
        if (temperature < 0 || temperature > 30) {
            throw new Error(`Temperature ${temperature}°C is out of range (0-30°C)`);
        }
    }
    _isPowerMode(mode) {
        return [OperationMode.BOOST].includes(mode); // Only BOOST as power mode for demo
    }
    _isPresetMode(mode) {
        return [OperationMode.COMFORT, OperationMode.ECO].includes(mode);
    }
    _isCustomTemperatureMode(mode) {
        return [OperationMode.COMFORT, OperationMode.BOOST].includes(mode);
    }
    _getPresetSetpoint(mode, info) {
        if (mode === OperationMode.COMFORT)
            return info.comfortSetpoint;
        if (mode === OperationMode.ECO)
            return info.ecoSetpoint;
        if (mode === OperationMode.OFF)
            return info.antifreezeSetpoint;
        return undefined;
    }
}
