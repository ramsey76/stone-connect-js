// example.ts
import { StoneConnectClient } from './client.js';
import { OperationMode } from './models.js';
async function main() {
    // Example: host, port, username, password
    const client = new StoneConnectClient('192.168.1.65', 443, 'App_RadWiFi_v1', 'e1qf45s4w8e7q5wda4s5d1as2');
    await client.connect();
    console.log(await client.getStatus());
    await client.setOperationMode(OperationMode.COMFORT);
    console.log(await client.getStatus());
}
main().catch(console.error);
