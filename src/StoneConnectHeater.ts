// Node.js client for Stone Connect WiFi Electric Heater (TypeScript)


import { OperationModes } from './OperationModes';
import { HeaterOptions } from './HeaterOptions';
import { HeaterApiClient } from './HeaterApiClient';
import { validateTemperature, isPowerMode, isPresetMode, isCustomMode, getPresetSetpoint } from './HeaterUtils';
import type { HeaterInfo, HeaterStatus } from './HeaterApiTypes';


export class StoneConnectHeater {
	static DEFAULT_USERNAME = 'App_RadWiFi_v1';
	static DEFAULT_PASSWORD = 'e1qf45s4w8e7q5wda4s5d1as2';
	static OperationModes = OperationModes;

	private apiClient: HeaterApiClient;

	constructor({ host, port = 443, username = StoneConnectHeater.DEFAULT_USERNAME, password = StoneConnectHeater.DEFAULT_PASSWORD, timeout = 30000 }: HeaterOptions) {
		const baseUrl = `https://${host}:${port}/Domestic_Heating/Radiators/v1`;
		const credentials = Buffer.from(`${username}:${password}`).toString('base64');
		const authHeader = `Basic ${credentials}`;
		this.apiClient = new HeaterApiClient(baseUrl, authHeader, timeout);
	}


		async getInfo(): Promise<HeaterInfo> {
			return await this.apiClient.request('GET', 'info');
		}

		async getStatus(): Promise<HeaterStatus> {
			return await this.apiClient.request('GET', 'status');
		}

		async getSchedule() {
			return await this.apiClient.request('GET', 'Schedule');
		}

		async setTemperatureAndMode(temperature: number, mode: OperationModes) {
			if (!isPowerMode(mode)) {
				validateTemperature(temperature);
			}
			const deviceInfo = await this.getInfo();
			const clientId = deviceInfo.Client_ID || deviceInfo.client_id;
			const body = {
				Client_ID: clientId,
				Operative_Mode: mode,
				Set_Point: isPowerMode(mode) ? 0 : temperature,
			};
			await this.apiClient.request('PUT', 'setpoint', body);
		}

		async setTemperature(temperature: number, mode: OperationModes | null = null) {
			validateTemperature(temperature);
			let actualMode: OperationModes;
			if (!mode) {
				const status = await this.getStatus();
				actualMode = (status.Operative_Mode as OperationModes) || OperationModes.MANUAL;
			} else {
				actualMode = mode;
			}
			if (!isCustomMode(actualMode)) {
				if (isPowerMode(actualMode)) {
					throw new Error(`Power mode ${actualMode} doesn't use temperature setpoints. Use setOperationMode instead.`);
				} else if (isPresetMode(actualMode)) {
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
			if (isPowerMode(mode)) {
				temperature = 0;
			} else if (isPresetMode(mode)) {
				temperature = getPresetSetpoint(mode, deviceInfo);
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

		async setBoostMode() {
			await this.setOperationMode(OperationModes.BOOST);
		}

		async setManualTemperature(temperature: number) {
			await this.setTemperature(temperature, OperationModes.MANUAL);
		}

		async setPowerMode(powerLevel: OperationModes) {
			if (!isPowerMode(powerLevel)) {
				throw new Error(`${powerLevel} is not a valid power mode. Use HIGH, MEDIUM, or LOW.`);
			}
			await this.setOperationMode(powerLevel);
		}

		async setStandby() {
			await this.setOperationMode(OperationModes.STANDBY);
		}

		async getCurrentTemperature(): Promise<number | undefined> {
			const info = await this.getInfo();
			return info.Set_Point ?? info.set_point;
		}

		async getTargetTemperature(): Promise<number | undefined> {
			const status = await this.getStatus();
			return status.Set_Point ?? status.set_point;
		}

		async isHeating(): Promise<boolean | null> {
			const status = await this.getStatus();
			if (!status.Operative_Mode) return null;
			return status.Operative_Mode !== OperationModes.STANDBY;
		}

		async getSignalStrength(): Promise<number | undefined> {
			const status = await this.getStatus();
			return status.RSSI ?? status.rssi;
		}

		async isLocked(): Promise<boolean | undefined> {
			const status = await this.getStatus();
			return status.Lock_Status ?? status.lock_status;
		}

		async getErrorCode(): Promise<string | undefined> {
			const status = await this.getStatus();
			return status.Error_Code ?? status.error_code;
		}

		async getDailyEnergy(): Promise<number | undefined> {
			const status = await this.getStatus();
			return status.Daily_Energy ?? status.daily_energy;
		}

		async getPowerConsumption(): Promise<number | undefined> {
			const status = await this.getStatus();
			return status.Power_Consumption_Watt ?? status.power_consumption_watt;
		}
	}
