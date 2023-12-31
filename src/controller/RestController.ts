import path from 'path';
import fs from 'fs';
import {IResponseData} from './ResponseData';
import monitorController from '../monitor/MonitorController';
import AppConfig from '../lib/AppConfig';
import Logger from '../lib/Logger';

const logger = new Logger('RestController');

const { RECORD_OUTPUT_DIR } = AppConfig.getConfigs();

var INSTANCE: RestController | null = null;

export default class RestController {
    constructor() {}

    static getInstance(): RestController {
        if (!INSTANCE) INSTANCE = new RestController();
        return INSTANCE as RestController;
    }

    async exec(method: string, pathname: string, params: URLSearchParams): Promise<IResponseData> {
        logger.info("handle request", {method, pathname, params});
        let resData: IResponseData = {
            headers: {'Content-Type': 'application/json'},
            code: 200,
            data: null,
            stream: null
        };

        switch (pathname) {
            case '/live': {
                let roomId: string = params.get("roomId") || "";
                let clientUrl: string = params.get("clientUrl") || "";
                let clientAssertions: any = JSON.parse(params.get("assertions") || "{}");
                let rtmpServer: string = params.get("rtmpServer") || "";
                if (!roomId || !clientUrl || !rtmpServer) throw new Error("Invalid input. Required params: roomId, clientUrl, rtmpServer");
                try {
                    let client = await monitorController.createClient(roomId, clientUrl, clientAssertions);
                    // let res = await axios.get(`${rtmpServer}/control/get?room=${roomId}`, {timeout: 5000});
                    // let {status, data: channelkey} = res.data;
                    // logger.debug("# get rtmp url", res.data);
                    // path.join(rtmpServer, 'live', channelkey);
                    const result: any = client.upStream(rtmpServer);
                    // client.upStream(replaceUrlPort(replaceUrlProtocol(rtmpServer, "rtmp"), 1945), {appname: 'live', channelkey: channelkey as string});
                    resData.data = result;
                } catch(error: any) {
                    resData.code = 500;
                    resData.data = error.message || error;
                }
                break;
            }
            case '/restart': {
                let roomId: string = params.get("roomId") || "";
                if (!roomId) throw new Error("Invalid input. Required params: roomId");
                try {
                    let client = monitorController.getClient(roomId);
                    const result: any = client?.restartStream();
                    resData.data = result;
                } catch(error: any) {
                    resData.code = 500;
                    resData.data = error.message || error;
                }
            }
            case '/recStart': {
                let roomId: string = params.get("roomId") || "";
                let clientUrl: string = params.get("clientUrl") || "";
                let clientAssertions: any = JSON.parse(params.get("assertions") || "null");
                if (!roomId) throw new Error("Invalid input. Required params: roomId");
                logger.info("recStart", {roomId});
                try {
                    let client = await monitorController.createClient(roomId, clientUrl, clientAssertions);
                    client?.recStart();
                    resData.data = true;
                } catch(error: any) {
                    resData.code = 500;
                    resData.data = error.message || error;
                }
                break;
            }
            case '/recPause': {
                let roomId: string = params.get("roomId") || "";
                if (!roomId) throw new Error("Invalid input. Required params: roomId");
                logger.info("recPause", {roomId});
                try {
                    monitorController.getClient(roomId)?.recPause();
                    resData.data = true;
                } catch(error: any) {
                    resData.code = 500;
                    resData.data = error.message || error;
                }
                break;
            }
            case '/reload': {
                let roomId: string = params.get("roomId") || "";
                let clientUrl: string = params.get("clientUrl") || "";
                if (!roomId) throw new Error("Invalid input. Params: roomId (required), clientUrl (optional)");
                // TODO: implement update livestream clientUrl by roomId
                logger.info("reload", {roomId, clientUrl});
                try {
                    await monitorController.reload(roomId, clientUrl);
                    resData.data = true;
                } catch(error: any) {
                    resData.code = 500;
                    resData.data = error.message || error;
                }
                break;
            }
            case '/stop': {
                let roomId: string = params.get("roomId") || "";
                if (!roomId) throw new Error("Invalid input. Required params: roomId");
                logger.info("stop", {roomId});
                await monitorController.stopClient(roomId)
                    .then(() => {
                        resData.data = true;
                    })
                    .catch((error: any) => {
                        resData.code = 500;
                        resData.data = "Internal Server error " + (error.message || error);
                    });
                break;
            }
            case '/record/download': {
                let roomId: string = params.get("roomId") || "";
                if (!roomId) throw new Error("Invalid input. Required params: roomId");
                let filePath = path.join(RECORD_OUTPUT_DIR, `${roomId}.mp4`);
                let ff = fs.statSync(filePath);
                if (!ff.isFile()) {
                    logger.error("record file does not exist for room " + roomId)
                    throw new Error("record file does not exist for room " + roomId);
                }
                const stream = fs.createReadStream(filePath);
                logger.info("record download", filePath, ff.size);
                resData.headers = {
                    'Content-Disposition': `attachment;filename=${roomId}.mp4`,
                    'Content-Type': 'audio/mpeg',
                    'Content-Length': ff.size
                }
                resData.stream = stream;
                break;
            }
            case '/getAll': {
                logger.info("get all running clients");
                resData.data = monitorController.getAllClient();
                break;
            }
            default:
                resData.code = 404;
                resData.data = "Invalid URL.";
                break;
        }
        return resData;
    }
}

