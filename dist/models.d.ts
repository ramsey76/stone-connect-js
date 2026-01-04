export declare enum OperationMode {
    COMFORT = "CMF",
    BOOST = "BST",
    ECO = "ECO",
    OFF = "OFF"
}
export interface Status {
    clientId: string;
    setPoint: number;
    operativeMode: OperationMode;
    powerConsumptionWatt: number;
    dailyEnergy: number;
    errorCode: number;
    lockStatus: boolean;
    rssi?: number;
    connectedToBroker: boolean;
    brokerEnabled: boolean;
    lastUpdate: Date;
}
