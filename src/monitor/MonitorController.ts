import Logger from "../lib/Logger";
import MonitorClient from "./MonitorClient";

const logger = new Logger('MonitorController');

class MonitorController {
    clientMap: Map<string, MonitorClient> = new Map();

    constructor() {}

    nextScreenNumber(): number {
        let clientCount = this.clientMap.size;
        if (clientCount == 0) return 0;
        return clientCount + 1;
    }

    async createClient(roomId: string, clientUrl: string): Promise<MonitorClient> {
        logger.info(`RoomID ${roomId} createClient ${clientUrl}`);
        if (this.clientMap.has(roomId)) return this.clientMap.get(roomId) as MonitorClient;
        let client = new MonitorClient(roomId, clientUrl);
        await client.start(this.nextScreenNumber());
        this.clientMap.set(roomId, client);
        return client;
    }

    getClient(roomId: string): MonitorClient | undefined {
        return this.clientMap.get(roomId);
    }

    async reload(roomId: string) {
        let client = this.clientMap.get(roomId) as MonitorClient;
        client?.reload();
    }

    async stopClient(roomId: string) {
        if (!this.clientMap.has(roomId)) {
            throw new Error("no client data for room " + roomId);
        }
        try {
            let client = this.clientMap.get(roomId);
            await client?.stop();
            this.clientMap.delete(roomId);
        } catch(error: any) {
            throw new Error("fail to stop browser client for room " + roomId + "with error" + error.message);
        }
    }
}

export default new MonitorController();
