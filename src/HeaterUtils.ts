export function validateTemperature(temperature: number) {
  if (temperature < 0 || temperature > 30) {
    throw new Error('Temperature must be between 0 and 30°C');
  }
}

export function isPowerMode(mode: string) {
  return ['HIG', 'MED', 'LOW'].includes(mode);
}

export function isPresetMode(mode: string) {
  return ['CMF', 'ECO', 'ANF'].includes(mode);
}

export function isCustomMode(mode: string) {
  return ['MAN', 'BST'].includes(mode);
}

export function getPresetSetpoint(mode: string, deviceInfo: any) {
  if (mode === 'CMF') return deviceInfo.Comfort_Setpoint || deviceInfo.comfort_setpoint;
  if (mode === 'ECO') return deviceInfo.Eco_Setpoint || deviceInfo.eco_setpoint;
  if (mode === 'ANF') return deviceInfo.Antifreeze_Setpoint || deviceInfo.antifreeze_setpoint;
  return null;
}
