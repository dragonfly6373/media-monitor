import Logger from "../lib/Logger";
import MonitorClient from "./MonitorClient";
import { execShellCommand } from "../lib/utils";

const logger = new Logger('MonitorController');

class MonitorController {
    clientMap: Map<string, MonitorClient> = new Map();
    clientCounter: number = 100;

    constructor() {}

    nextScreenNumber(): number {
        this.clientCounter += 1;
        return this.clientCounter;
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
            if (this.clientMap.size == 0) {
                this.clientCounter = 0;
            }
        } catch(error: any) {
            throw new Error("fail to stop browser client for room " + roomId + " with error" + error.message);
        }
    }

    async cleanResource() {
        logger.info("all client closed. clean all resource");
        this.clientCounter = 100;
        execShellCommand("pkill -9 ffmpeg")
            .then(() => {
                logger.info(" > kill all ffmpeg process");
            })
            .catch((error: any) => logger.warn("fail to kill all ffmpeg process with error", error.message));
        execShellCommand("pkill -9 Xvfb")
            .then(() => {
                logger.info(" > kill all Xvfb process");
            })
            .catch((error: any) => logger.warn("fail to kill all Xvfb process with error", error.message));
    }
}

export default new MonitorController();
