// Node.js client for Stone Connect WiFi Electric Heater (TypeScript)
import fetch from 'node-fetch';
import https from 'https';

export enum OperationModes {
	ANTIFREEZE = 'ANF',
	BOOST = 'BST',
	COMFORT = 'CMF',
	ECO = 'ECO',
	HIGH = 'HIG',
	HOLIDAY = 'HOL',
	LOW = 'LOW',
	MANUAL = 'MAN',
	MEDIUM = 'MED',
	SCHEDULE = 'SCH',
	STANDBY = 'SBY',
}

export interface HeaterOptions {
	host: string;
	port?: number;
	username?: string;
	password?: string;
	timeout?: number;
}

export class StoneConnectHeater {
	static DEFAULT_USERNAME = 'App_RadWiFi_v1';
	static DEFAULT_PASSWORD = 'e1qf45s4w8e7q5wda4s5d1as2';
	static OperationModes = OperationModes;

	host: string;
	port: number;
	username: string;
	password: string;
	timeout: number;
	baseUrl: string;
	authHeader: string;

	constructor({ host, port = 443, username = StoneConnectHeater.DEFAULT_USERNAME, password = StoneConnectHeater.DEFAULT_PASSWORD, timeout = 30000 }: HeaterOptions) {
		this.host = host;
		this.port = port;
		this.username = username;
		this.password = password;
		this.timeout = timeout;
		this.baseUrl = `https://${host}:${port}/Domestic_Heating/Radiators/v1`;
		const credentials = Buffer.from(`${username}:${password}`).toString('base64');
		this.authHeader = `Basic ${credentials}`;
	}

	async _request(method: string, endpoint: string, data: any = null): Promise<any> {
		const url = `${this.baseUrl}/${endpoint.replace(/^\//, '')}`;
		const agent = new https.Agent({ rejectUnauthorized: false });
		const options: any = {
			method,
			headers: {
				Authorization: this.authHeader,
				'Content-Type': 'application/json',
				'User-Agent': 'StoneConnect-Node-Client/1.0',
			},
			timeout: this.timeout,
			agent,
		};
		if (data) options.body = JSON.stringify(data);
		let res;
		try {
			res = await fetch(url, options);
		} catch (err: any) {
			throw new Error(`Connection failed: ${err.message}`);
		}
		if (res.status === 401) throw new Error('Authentication failed');
		if (res.status === 404) throw new Error(`Endpoint not found: ${endpoint}`);
		if (!res.ok) throw new Error(`API request failed: ${res.status} - ${await res.text()}`);
		try {
			return await res.json();
		} catch {
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
	async setTemperatureAndMode(temperature: number, mode: OperationModes) {
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
	async setTemperature(temperature: number, mode: OperationModes | null = null) {
		StoneConnectHeater._validateTemperature(temperature);
		let actualMode: OperationModes;
		if (!mode) {
			const status = await this.getStatus();
			actualMode = status.Operative_Mode || OperationModes.MANUAL;
		} else {
			actualMode = mode;
		}
		if (!StoneConnectHeater._isCustomMode(actualMode)) {
			if (StoneConnectHeater._isPowerMode(actualMode)) {
				throw new Error(`Power mode ${actualMode} doesn't use temperature setpoints. Use setOperationMode instead.`);
			} else if (StoneConnectHeater._isPresetMode(actualMode)) {
				throw new Error(`Preset mode ${actualMode} uses predefined temperature. Use setOperationMode instead.`);
			} else {
				throw new Error(`Mode ${actualMode} doesn't support custom temperature setpoints.`);
			}
		}
		await this.setTemperatureAndMode(temperature, actualMode);
	}
	async setOperationMode(mode: OperationModes) {
		const deviceInfo = await this.getInfo();
		let temperature: number;
		if (StoneConnectHeater._isPowerMode(mode)) {
			temperature = 0;
		} else if (StoneConnectHeater._isPresetMode(mode)) {
			temperature = StoneConnectHeater._getPresetSetpoint(mode, deviceInfo);
			if (temperature == null) throw new Error(`No preset temperature found for mode ${mode}`);
		} else {
			const status = await this.getStatus();
			temperature = status.Set_Point || 20.0;
		}
		await this.setTemperatureAndMode(temperature, mode);
	}
	async isOnline(): Promise<boolean> {
		try {
			await this.getStatus();
			return true;
		} catch {
			return false;
		}
	}
	async hasPowerMeasurementSupport(): Promise<boolean> {
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
	async setManualTemperature(temperature: number) {
		await this.setTemperature(temperature, OperationModes.MANUAL);
	}
	async setPowerMode(powerLevel: OperationModes) {
		if (!StoneConnectHeater._isPowerMode(powerLevel)) {
			throw new Error(`${powerLevel} is not a valid power mode. Use HIGH, MEDIUM, or LOW.`);
		}
		await this.setOperationMode(powerLevel);
	}
	async setStandby() {
		await this.setOperationMode(OperationModes.STANDBY);
	}
	async getCurrentTemperature(): Promise<number> {
		const info = await this.getInfo();
		return info.Set_Point || info.set_point;
	}
	async getTargetTemperature(): Promise<number> {
		const status = await this.getStatus();
		return status.Set_Point || status.set_point;
	}
	async isHeating(): Promise<boolean | null> {
		const status = await this.getStatus();
		if (!status.Operative_Mode) return null;
		return status.Operative_Mode !== OperationModes.STANDBY;
	}
	async getSignalStrength(): Promise<number> {
		const status = await this.getStatus();
		return status.RSSI || status.rssi;
	}
	async isLocked(): Promise<boolean> {
		const status = await this.getStatus();
		return status.Lock_Status || status.lock_status;
	}
	async getErrorCode(): Promise<string> {
		const status = await this.getStatus();
		return status.Error_Code || status.error_code;
	}
	async getDailyEnergy(): Promise<number> {
		const status = await this.getStatus();
		return status.Daily_Energy || status.daily_energy;
	}
	async getPowerConsumption(): Promise<number> {
		const status = await this.getStatus();
		return status.Power_Consumption_Watt || status.power_consumption_watt;
	}
	static _validateTemperature(temperature: number) {
		if (temperature < 0 || temperature > 30) {
			throw new Error('Temperature must be between 0 and 30°C');
		}
	}
	static _isPowerMode(mode: OperationModes) {
		return [OperationModes.HIGH, OperationModes.MEDIUM, OperationModes.LOW].includes(mode);
	}
	static _isPresetMode(mode: OperationModes) {
		return [OperationModes.COMFORT, OperationModes.ECO, OperationModes.ANTIFREEZE].includes(mode);
	}
	static _isCustomMode(mode: OperationModes) {
		return [OperationModes.MANUAL, OperationModes.BOOST].includes(mode);
	}
	static _getPresetSetpoint(mode: OperationModes, deviceInfo: any) {
		if (mode === OperationModes.COMFORT) return deviceInfo.Comfort_Setpoint || deviceInfo.comfort_setpoint;
		if (mode === OperationModes.ECO) return deviceInfo.Eco_Setpoint || deviceInfo.eco_setpoint;
		if (mode === OperationModes.ANTIFREEZE) return deviceInfo.Antifreeze_Setpoint || deviceInfo.antifreeze_setpoint;
		return null;
	}
}
