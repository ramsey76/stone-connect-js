// src/client.ts

import { Status, OperationMode } from './models.js';
import { ConnectionError } from './exceptions.js';


// Simulated Info and Schedule types for demonstration
type Info = Status & {
  comfortSetpoint?: number;
  ecoSetpoint?: number;
  antifreezeSetpoint?: number;
  loadSizeWatt?: number;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
};
type Schedule = any;

export class StoneConnectClient {
  private status: Status;
  private info: Info;
  private schedule: Schedule | null = null;

  constructor(
    host: string,
    port: number = 443,
    username: string = 'App_RadWiFi_v1',
    password: string = 'e1qf45s4w8e7q5wda4s5d1as2'
  ) {
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

  async connect(): Promise<void> {
    this.status.connectedToBroker = true;
    this.status.lastUpdate = new Date();
    // Simulate info update
    this.info.connectedToBroker = true;
    this.info.lastUpdate = new Date();
    console.log(`Connected to: Heater (${this.status.clientId})`);
  }

  async close(): Promise<void> {
    this.status.connectedToBroker = false;
    this.status.lastUpdate = new Date();
  }

  async getInfo(): Promise<Info> {
    return { ...this.info };
  }

  async getStatus(): Promise<Status> {
    this.status.lastUpdate = new Date();
    return { ...this.status };
  }

  async getSchedule(): Promise<Schedule | null> {
    return this.schedule;
  }

  async setTemperatureAndMode(temperature: number, mode: OperationMode): Promise<void> {
    if (!this._isPowerMode(mode)) {
      this._validateTemperature(temperature);
      this.status.setPoint = temperature;
    } else {
      this.status.setPoint = 0;
    }
    this.status.operativeMode = mode;
    this.status.lastUpdate = new Date();
  }

  async setTemperature(temperature: number, mode?: OperationMode): Promise<void> {
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

  async setOperationMode(mode: OperationMode): Promise<void> {
    let temperature = 0;
    if (this._isPowerMode(mode)) {
      temperature = 0;
    } else if (this._isPresetMode(mode)) {
      temperature = this._getPresetSetpoint(mode, this.info) ?? 20;
    } else {
      temperature = this.status.setPoint ?? 20;
    }
    await this.setTemperatureAndMode(temperature, mode);
  }

  async isOnline(): Promise<boolean> {
    return this.status.connectedToBroker;
  }

  async hasPowerMeasurementSupport(): Promise<boolean> {
    return (this.info.loadSizeWatt ?? 0) !== 0;
  }

  async setComfortMode(): Promise<void> {
    await this.setOperationMode(OperationMode.COMFORT);
  }

  async setEcoMode(): Promise<void> {
    await this.setOperationMode(OperationMode.ECO);
  }

  async setAntifreezeMode(): Promise<void> {
    await this.setOperationMode(OperationMode.OFF); // No ANTIFREEZE in enum, using OFF
  }

  async setManualTemperature(temperature: number): Promise<void> {
    await this.setTemperature(temperature, OperationMode.COMFORT); // No MANUAL, using COMFORT
  }

  async setPowerMode(mode: OperationMode): Promise<void> {
    if (!this._isPowerMode(mode)) {
      throw new Error(`${mode} is not a valid power mode.`);
    }
    await this.setOperationMode(mode);
  }

  async setStandby(): Promise<void> {
    await this.setOperationMode(OperationMode.OFF);
  }

  async getCurrentTemperature(): Promise<number | undefined> {
    return this.info.setPoint;
  }

  async getTargetTemperature(): Promise<number | undefined> {
    return this.status.setPoint;
  }

  async isHeating(): Promise<boolean | undefined> {
    return this.status.operativeMode !== OperationMode.OFF;
  }

  async getSignalStrength(): Promise<number | undefined> {
    return this.status.rssi;
  }

  async isLocked(): Promise<boolean | undefined> {
    return this.status.lockStatus;
  }

  async getErrorCode(): Promise<number | undefined> {
    return this.status.errorCode;
  }

  async getDailyEnergy(): Promise<number | undefined> {
    return this.status.dailyEnergy;
  }

  async getPowerConsumption(): Promise<number | undefined> {
    return this.status.powerConsumptionWatt;
  }

  private _validateTemperature(temperature: number): void {
    if (temperature < 0 || temperature > 30) {
      throw new Error(`Temperature ${temperature}°C is out of range (0-30°C)`);
    }
  }

  private _isPowerMode(mode: OperationMode): boolean {
    return [OperationMode.BOOST].includes(mode); // Only BOOST as power mode for demo
  }

  private _isPresetMode(mode: OperationMode): boolean {
    return [OperationMode.COMFORT, OperationMode.ECO].includes(mode);
  }

  private _isCustomTemperatureMode(mode: OperationMode): boolean {
    return [OperationMode.COMFORT, OperationMode.BOOST].includes(mode);
  }

  private _getPresetSetpoint(mode: OperationMode, info: Info): number | undefined {
    if (mode === OperationMode.COMFORT) return info.comfortSetpoint;
    if (mode === OperationMode.ECO) return info.ecoSetpoint;
    if (mode === OperationMode.OFF) return info.antifreezeSetpoint;
    return undefined;
  }
}
