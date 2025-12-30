# Stone Connect Heater

A TypeScript project for controlling and integrating Stone Connect heaters.

## Structure
- `src/` — Main TypeScript source code
- `example/` — Example usage scripts

## Getting Started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Build the project:
   ```bash
   npm run build
   ```

3. Run the example:
   ```bash
   npm run example
   ```

Alternatively, you can run the compiled JavaScript example directly:
   ```bash
   node dist/example/example_node_usage.js
   ```


## Key Methods

The `StoneConnectHeater` class provides methods to interact with your heater via its API:

- `getInfo()` — Get device information
- `getStatus()` — Get current status
- `getSchedule()` — Retrieve heating schedule
- `setTemperatureAndMode(temperature, mode)` — Set temperature and operation mode
- `setTemperature(temperature, mode?)` — Set temperature (with optional mode)
- `setOperationMode(mode)` — Change operation mode (e.g., ECO, COMFORT, BOOST)
- `isOnline()` — Check if the device is reachable
- `hasPowerMeasurementSupport()` — Check if power measurement is supported
- `setComfortMode()` — Switch to comfort mode
- `setEcoMode()` — Switch to eco mode
- `setAntifreezeMode()` — Switch to antifreeze mode
- `setManualTemperature(temperature)` — Set manual temperature
- `setPowerMode(powerLevel)` — Set power mode (HIGH, MEDIUM, LOW)
- `setStandby()` — Put heater in standby
- `getCurrentTemperature()` — Get current set temperature
- `getTargetTemperature()` — Get target temperature
- `isHeating()` — Check if heater is actively heating
- `getSignalStrength()` — Get WiFi signal strength
- `isLocked()` — Check if heater is locked
- `getErrorCode()` — Get error code if any
- `getDailyEnergy()` — Get daily energy usage
- `getPowerConsumption()` — Get current power consumption

See the example in `example/example_node_usage.ts` for usage patterns.

## Contributing
Feel free to open issues or submit pull requests.
