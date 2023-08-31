import Logger from "../lib/Logger";
import MonitorClient from "./MonitorClient";
import { execShellCommand } from "../lib/utils";
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
        let client = new MonitorClient(roomId, clientUrl);
        await client.start(this.nextScreenNumber());
        this.clientMap.set(roomId, client);
        return client;
    }

    getClient(roomId: string): MonitorClient | undefined {
        return this.clientMap.get(roomId);
    }

    async reload(roomId: string, clientUrl: string) {
        let client = this.clientMap.get(roomId) as MonitorClient;
        client?.reload(clientUrl);
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
                this.cleanResource();
            }
        } catch(error: any) {
            throw new Error("fail to stop browser client for room " + roomId + " with error" + error.message);
        }
    }

    async cleanResource() {
        logger.info("all client closed. clean all resource");
        this.clientCounter = XVFB_DISPLAY_START_NUM;
        Ffmpeg.killAll();
        Xvfb.killAll();
        PulseAudio.killAll();
    }
}

export default new MonitorController();
