import * as dotenv from 'dotenv';
import { parseBoolean } from "./utils";

dotenv.config();

export default class AppConfig {
    DOMAIN: string = "http://localhost";
    PORT: number = 8090;

    XVFB: boolean = true;
    SCREEN_WIDTH: number = 1365;
    SCREEN_HEIGHT: number = 767;
    GOOGLE_CHROME_DISK_CACHE_DIR: string = "";

    RTMP_SERVER: string = "http://10.70.123.13:8890";
    RTMP_UPSTREAM: string = "rtmp://10.70.123.13:1945";

    RECORD_OUTPUT_DIR: string = "./temp/records";

    LOGGER_CONFIGS: {
        level: number,
        isWriteToFile: boolean,
        logDir: string,
        timeIncluded: boolean
    };

    private constructor(
        DOMAIN: string,
        PORT: number,
        XVFB: boolean,
        SCREEN_WIDTH: number,
        SCREEN_HEIGHT: number,
        GOOGLE_CHROME_DISK_CACHE_DIR: string,
        RTMP_SERVER: string,
        RECORD_OUTPUT_DIR: string,
        LOGGER_LEVEL: number,
        LOGGER_WRITE_FILE: boolean,
        LOGGER_OUTPUT: string,
        LOGGER_TIME_INCLUDED: boolean
    ) {
        this.DOMAIN = DOMAIN;
        this.PORT = PORT;
        this.XVFB = XVFB;
        this.SCREEN_WIDTH = SCREEN_WIDTH;
        this.SCREEN_HEIGHT = SCREEN_HEIGHT;
        this.GOOGLE_CHROME_DISK_CACHE_DIR = GOOGLE_CHROME_DISK_CACHE_DIR;
        this.RTMP_SERVER = RTMP_SERVER;
        // this.RTMP_UPSTREAM = RTMP_UPSTREAM;
        this.RECORD_OUTPUT_DIR = RECORD_OUTPUT_DIR;
        this.LOGGER_CONFIGS = {
            level: LOGGER_LEVEL,
            isWriteToFile: LOGGER_WRITE_FILE,
            logDir: LOGGER_OUTPUT,
            timeIncluded: LOGGER_TIME_INCLUDED
        };
    }


    static INSTANCE: AppConfig;

    static getConfigs() {
        if (!this.INSTANCE) this._init();
        return this.INSTANCE;
    }

    private static _init() {
        this.INSTANCE = new AppConfig(
            process.env.DOMAIN || "",
            parseInt(process.env.PORT || "8090"),
            parseBoolean(process.env.XVFB || "false"),
            parseInt(process.env.SCREEN_WIDTH || "1920"),
            parseInt(process.env.SCREEN_HEIGHT || "1080"),
            process.env.GOOGLE_CHROME_DISK_CACHE_DIR || "",
            process.env.RTMP_SERVER || "",
            process.env.RECORD_OUTPUT_DIR || "",
            parseInt(process.env.LOGGER_LEVEL || "4"),
            parseBoolean(process.env.LOGGER_WRITE_FILE || "false"),
            process.env.LOGGER_OUTPUT || "",
            parseBoolean(process.env.LOGGER_TIME_INCLUDED || "false"),
        );
    }
}
