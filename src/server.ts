#!/usr/bin/env node

import {createServer, IncomingMessage, ServerResponse} from 'http';
import * as dotenv from 'dotenv';

import RestController from './controller/RestController';
import { IResponseData } from './controller/ResponseData';
import Logger from './lib/Logger';
import AppConfig from './lib/AppConfig';
import Ffmpeg from './lib/Ffmpeg';
import Xvfb from './lib/Xvfb';
import { PulseAudio } from './lib/PulseAudio';

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
    logger.info("Application Configs:", appConfigs);
});

const exitHandler = (options: any, exitCode: number) => {
    try {
        if (options.cleanup) {
            logger.info('clean');
            Xvfb.killAll();
            Ffmpeg.killAll();
            PulseAudio.killAll();
        }
    } catch(error: any) {
        logger.error("kill all child processes failed with error", error.message);
    } finally {
        if (exitCode || exitCode === 0) console.log(exitCode);
        if (options.exit) process.exit();
    }
}

//do something when app is closing
process.on('exit', exitHandler.bind(null, {cleanup: true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit: true}));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit: true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit: true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit: true}));
