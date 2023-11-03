import * as dotenv from 'dotenv';
import { parseArray, parseBoolean } from "./utils";

dotenv.config();

export default class AppConfig {
    DOMAIN: string = "http://localhost";
    PORT: number = 8090;

    XVFB: boolean = true;
    XVFB_DISPLAY_START_NUM: number = 100;
    FFMPEG_FRAME_RATE: number = 30;
    FFMPEG_PROBESIZE: string = "42M";
    FFMPEG_PRESET: string = "fast";
    FFMPEG_MAXRATE: string = "1200k";
    FFMPEG_BUFSIZE: string = "2400k";
    FFMPEG_AUDIO_BITRATE: string = "128k";
    SCREEN_WIDTH: number = 1365;
    SCREEN_HEIGHT: number = 767;
    CHROME_DISK_CACHE_DIR: string = "";
    CHROME_DISK_CACHE_SIZE: number = 33554432; // 32 * 1024 * 1024
    CHROME_ENABLE_CLIENT_DOMAIN: Array<string> = [];
    CHROME_OVERRIDE_PERMISSION: Array<string> = [];

    RECORD_OUTPUT_DIR: string = "./temp/records";

    LOGGER_CONFIGS: {
        appName: string,
        level: number,
        isWriteToFile: boolean,
        logDir: string,
        timeIncluded: boolean
    };

    private constructor(
        DOMAIN: string,
        PORT: number,
        XVFB: boolean,
        XVFB_DISPLAY_START_NUM: number,
        FFMPEG_FRAME_RATE: number,
        FFMPEG_PROBESIZE: string,
        FFMPEG_PRESET: string,
        FFMPEG_MAXRATE: string,
        FFMPEG_BUFSIZE: string,
        FFMPEG_AUDIO_BITRATE: string,
        SCREEN_WIDTH: number,
        SCREEN_HEIGHT: number,
        CHROME_DISK_CACHE_DIR: string,
        CHROME_DISK_CACHE_SIZE: number,
        CHROME_ENABLE_CLIENT_DOMAIN: Array<string>,
        CHROME_OVERRIDE_PERMISSION: Array<string>,
        RECORD_OUTPUT_DIR: string,
        LOGGER_APPNAME: string,
        LOGGER_LEVEL: number,
        LOGGER_WRITE_FILE: boolean,
        LOGGER_OUTPUT: string,
        LOGGER_TIME_INCLUDED: boolean
    ) {
        this.DOMAIN = DOMAIN;
        this.PORT = PORT;
        this.XVFB = XVFB;
        this.XVFB_DISPLAY_START_NUM = XVFB_DISPLAY_START_NUM;
        this.FFMPEG_FRAME_RATE = FFMPEG_FRAME_RATE;
        this.FFMPEG_PROBESIZE = FFMPEG_PROBESIZE;
        this.FFMPEG_PRESET = FFMPEG_PRESET;
        this.FFMPEG_MAXRATE = FFMPEG_MAXRATE;
        this.FFMPEG_BUFSIZE = FFMPEG_BUFSIZE;
        this.FFMPEG_AUDIO_BITRATE = FFMPEG_AUDIO_BITRATE;
        this.SCREEN_WIDTH = SCREEN_WIDTH;
        this.SCREEN_HEIGHT = SCREEN_HEIGHT;
        this.CHROME_DISK_CACHE_DIR = CHROME_DISK_CACHE_DIR;
        this.CHROME_DISK_CACHE_SIZE = CHROME_DISK_CACHE_SIZE;
        this.CHROME_ENABLE_CLIENT_DOMAIN = CHROME_ENABLE_CLIENT_DOMAIN;
        this.CHROME_OVERRIDE_PERMISSION = CHROME_OVERRIDE_PERMISSION;
        this.RECORD_OUTPUT_DIR = RECORD_OUTPUT_DIR;
        this.LOGGER_CONFIGS = {
            appName: LOGGER_APPNAME,
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
            parseInt(process.env.XVFB_DISPLAY_START_NUM || "100"),
            parseInt(process.env.FFMPEG_FRAME_RATE || "30"),
            process.env.FFMPEG_PROBESIZE || "42M",
            process.env.FFMPEG_PRESET || "fast",
            process.env.FFMPEG_MAXRATE || "1200k",
            process.env.FFMPEG_BUFSIZE || "2400k",
            process.env.FFMPEG_AUDIO_BITRATE || "128k",
            parseInt(process.env.SCREEN_WIDTH || "1920"),
            parseInt(process.env.SCREEN_HEIGHT || "1080"),
            process.env.CHROME_DISK_CACHE_DIR || "",
            parseInt(process.env.CHROME_DISK_CACHE_SIZE || "33554432"),
            parseArray(process.env.CHROME_ENABLE_CLIENT_DOMAIN),
            parseArray(process.env.CHROME_OVERRIDE_PERMISSION),
            process.env.RECORD_OUTPUT_DIR || "",
            process.env.LOGGER_APPNAME || "",
            parseInt(process.env.LOGGER_LEVEL || "4"),
            parseBoolean(process.env.LOGGER_WRITE_FILE || "false"),
            process.env.LOGGER_OUTPUT || "",
            parseBoolean(process.env.LOGGER_TIME_INCLUDED || "false"),
        );
    }
}
