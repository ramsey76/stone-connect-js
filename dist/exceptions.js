// src/exceptions.ts
export class StoneConnectError extends Error {
    constructor(message) {
        super(message);
        this.name = 'StoneConnectError';
    }
}
export class ConnectionError extends StoneConnectError {
    constructor(message) {
        super(message);
        this.name = 'ConnectionError';
    }
}
