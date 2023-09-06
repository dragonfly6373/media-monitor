import {IResponseData} from './ResponseData';
import monitorController from '../monitor/MonitorController';
import Logger from '../lib/Logger';
import AppConfig from '../lib/AppConfig';

const appConfigs = AppConfig.getConfigs();
const logger = new Logger('RestController');

var INSTANCE: RestController | null = null;
const RTMPServer = appConfigs.RTMP_SERVER;

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
            data: null
        };

        switch (pathname) {
            case '/live': {
                let roomId: string = params.get("roomId") || "";
                let clientUrl: string = params.get("clientUrl") || "";
                let rtmpServer: string = params.get("rtmpServer") || RTMPServer || "";
                if (!roomId || !clientUrl || !rtmpServer) throw new Error("Invalid input. Required params: roomId, clientUrl, rtmpServer");
                let client = await monitorController.createClient(roomId, clientUrl);
                // let res = await axios.get(`${rtmpServer}/control/get?room=${roomId}`, {timeout: 5000});
                // let {status, data: channelkey} = res.data;
                // logger.debug("# get rtmp url", res.data);
                // path.join(rtmpServer, 'live', channelkey);
                const result: any = client.upStream(rtmpServer);
                // client.upStream(replaceUrlPort(replaceUrlProtocol(rtmpServer, "rtmp"), 1945), {appname: 'live', channelkey: channelkey as string});
                resData.data = result;
                break;
            }
            case '/restart': {
                let roomId: string = params.get("roomId") || "";
                if (!roomId) throw new Error("Invalid input. Required params: roomId");
                let client = monitorController.getClient(roomId);
                const result: any = client?.restartStream();
                resData.data = result;
            }
            case '/live': {
                let roomId: string = params.get("roomId") || "";
                if (!roomId) throw new Error("Invalid input. Required params: roomId");
                logger.info("live", {roomId});
                // TODO: implement get livestream url by roomId
                resData.data = true;
                break;
            }
            case '/recStart': {
                let roomId: string = params.get("roomId") || "";
                if (!roomId) throw new Error("Invalid input. Required params: roomId");
                logger.info("recStart", {roomId});
                monitorController.getClient(roomId)?.recStart();
                resData.data = true
                break;
            }
            case '/recPause': {
                let roomId: string = params.get("roomId") || "";
                if (!roomId) throw new Error("Invalid input. Required params: roomId");
                logger.info("recPause", {roomId});
                monitorController.getClient(roomId)?.recPause();
                resData.data = true
                break;
            }
            case '/reload': {
                let roomId: string = params.get("roomId") || "";
                let clientUrl: string = params.get("clientUrl") || "";
                if (!roomId) throw new Error("Invalid input. Params: roomId (required), clientUrl (optional)");
                // TODO: implement update livestream clientUrl by roomId
                logger.info("reload", {roomId, clientUrl});
                monitorController.reload(roomId, clientUrl);
                resData.data = true;
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
                        resData.data = "Internal Server error" + error.message;
                    });
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

