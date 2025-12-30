export interface HeaterInfo {
  Client_ID?: string;
  client_id?: string;
  Comfort_Setpoint?: number;
  comfort_setpoint?: number;
  Eco_Setpoint?: number;
  eco_setpoint?: number;
  Antifreeze_Setpoint?: number;
  antifreeze_setpoint?: number;
  Load_Size_Watt?: number;
  Set_Point?: number;
  set_point?: number;
}

export interface HeaterStatus {
  Operative_Mode?: string;
  Set_Point?: number;
  set_point?: number;
  RSSI?: number;
  rssi?: number;
  Lock_Status?: boolean;
  lock_status?: boolean;
  Error_Code?: string;
  error_code?: string;
  Daily_Energy?: number;
  daily_energy?: number;
  Power_Consumption_Watt?: number;
  power_consumption_watt?: number;
}
