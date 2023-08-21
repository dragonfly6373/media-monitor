#!/usr/bin/env node

import {createServer, IncomingMessage, ServerResponse} from 'http';
import * as dotenv from 'dotenv';

import RestController from './controller/RestController';
import { IResponseData } from './controller/ResponseData';
import Logger from './lib/Logger';
import AppConfig from './lib/AppConfig';

dotenv.config();
// AppConfig.init();
const appConfigs = AppConfig.getConfigs();

Logger.config(appConfigs.LOGGER_CONFIGS);

const logger = new Logger('Server');
const domain: string = process.env.DOMAIN || "http://127.0.0.1";
const serverPort: number = parseInt(process.env.PORT || "8090");

const controller = RestController.getInstance();

var server = createServer((req: IncomingMessage, res: ServerResponse) => {
    // logger.debug("# request path:", req.url, domain, serverPort);
    try {
        const url = new URL(req.url || "", domain + ":" + serverPort);
        controller.exec(req.method || "GET", url.pathname, url.searchParams).then((resData: IResponseData) => {
            if (resData.headers && resData.headers instanceof Object && Object.keys(resData.headers).length > 0) {
                res.writeHead( resData.code, resData.headers);
            } else if (resData.code != 200) {
                res.statusCode = resData.code;
            }
            // logger.debug("# response:", resData.data);
            res.end(JSON.stringify(resData.data));
        }).catch((error: any) => {
            logger.error(error.message);
            res.statusCode = 500;
            res.end("ERROR: " + JSON.stringify(error.message));
        });
    } catch(error: any) {
        logger.error(error.message);
        res.statusCode = 500;
        res.end("ERROR: " + JSON.stringify(error.message));
    }
});

server.listen(serverPort, () => {
    logger.info(`${process.env.DOMAIN} Server running at ${domain}:${serverPort}/`);
});
