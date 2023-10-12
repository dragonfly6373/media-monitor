import Logger from "../lib/Logger";
import MonitorClient from "./MonitorClient";
import AppConfig from "../lib/AppConfig";
import Xvfb from "../lib/Xvfb";
import { PulseAudio } from "../lib/PulseAudio";
import Ffmpeg from "../lib/Ffmpeg";

const logger = new Logger('MonitorController');
const { XVFB_DISPLAY_START_NUM } = AppConfig.getConfigs();

class MonitorController {
    clientMap: Map<string, MonitorClient> = new Map();
    clientCounter: number = XVFB_DISPLAY_START_NUM;

    constructor() {}

    nextScreenNumber(): number {
        this.clientCounter += 1;
        return this.clientCounter;
    }

    async createClient(roomId: string, clientUrl: string): Promise<MonitorClient> {
        logger.info(`RoomID ${roomId} createClient ${clientUrl}`);
        if (this.clientMap.has(roomId)) return this.clientMap.get(roomId) as MonitorClient;
        if (!clientUrl) throw new Error("Invalid input. clientUrl is required");
        let client = new MonitorClient(roomId, clientUrl);
        await client.start(this.nextScreenNumber()).catch((error: any) => {
            client!.stop();
            throw new Error("Failed to create new Client for room " + roomId + " with error: " + (error.message || error));
        });
        this.clientMap.set(roomId, client);
        return client;
    }

    getClient(roomId: string): MonitorClient | undefined {
        return this.clientMap.get(roomId);
    }

    async reload(roomId: string, clientUrl: string) {
        if (!this.clientMap.has(roomId)) {
            logger.error("no client data for room " + roomId);
            throw new Error("no client data for room " + roomId);
        }
        try {
            let client = this.clientMap.get(roomId) as MonitorClient;
            client?.reload(clientUrl);
        } catch(error: any) {
            logger.error("Failed to reload browser client for room " + roomId + " with error" + (error.message || error));
            throw new Error("Failed to reload browser client for room " + roomId + " with error" + (error.message || error));
        }
    }

    async stopClient(roomId: string) {
        if (!this.clientMap.has(roomId)) {
            logger.error("No client data for room " + roomId);
            throw new Error("No client data for room " + roomId);
        }
        try {
            let client = this.clientMap.get(roomId);
            await client?.stop();
            this.clientMap.delete(roomId);
            if (this.clientMap.size == 0) {
                this.clientCounter = 0;
                this.cleanResource();
            }
        } catch(error: any) {
            logger.error("Failed to stop browser client for room " + roomId + " with error" + error.message);
            throw new Error("Failed to stop browser client for room " + roomId + " with error" + error.message);
        }
    }

    async cleanResource() {
        logger.info("All client closed. clean all resource");
        this.clientCounter = XVFB_DISPLAY_START_NUM;
        Ffmpeg.killAll();
        Xvfb.killAll();
        PulseAudio.killAll();
    }

    getAllClient() {
        return Array.from(this.clientMap.values())
            .map((client: MonitorClient) => client.getClientInfo());
    }
}

export default new MonitorController();
