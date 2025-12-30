// Example usage for StoneConnectHeater TypeScript client
import { StoneConnectHeater } from '../src/StoneConnectHeater';

(async () => {
	const heater = new StoneConnectHeater({ host: '192.168.1.65' });
	try {
		const info = await heater.getInfo();
		console.log('Device info:', info);
		const status = await heater.getStatus();
		console.log('Device status:', status);
		// Example: set temperature to 22°C in MANUAL mode
		// await heater.setManualTemperature(22);
		// console.log('Temperature and mode set successfully');
		// Example: set eco mode
		// await heater.setEcoMode();
		// console.log('Eco mode set successfully');
	} catch (err: any) {
		console.error('Error:', err.message);
	}
})();
