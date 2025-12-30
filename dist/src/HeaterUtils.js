"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTemperature = validateTemperature;
exports.isPowerMode = isPowerMode;
exports.isPresetMode = isPresetMode;
exports.isCustomMode = isCustomMode;
exports.getPresetSetpoint = getPresetSetpoint;
function validateTemperature(temperature) {
    if (temperature < 0 || temperature > 30) {
        throw new Error('Temperature must be between 0 and 30°C');
    }
}
function isPowerMode(mode) {
    return ['HIG', 'MED', 'LOW'].includes(mode);
}
function isPresetMode(mode) {
    return ['CMF', 'ECO', 'ANF'].includes(mode);
}
function isCustomMode(mode) {
    return ['MAN', 'BST'].includes(mode);
}
function getPresetSetpoint(mode, deviceInfo) {
    if (mode === 'CMF')
        return deviceInfo.Comfort_Setpoint || deviceInfo.comfort_setpoint;
    if (mode === 'ECO')
        return deviceInfo.Eco_Setpoint || deviceInfo.eco_setpoint;
    if (mode === 'ANF')
        return deviceInfo.Antifreeze_Setpoint || deviceInfo.antifreeze_setpoint;
    return null;
}
