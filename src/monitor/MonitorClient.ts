import child_process from 'child_process';
import path from 'path';
// const chromium = require('chrome-aws-lambda');
import puppeteer, { Browser, Page } from 'puppeteer';
import { mkDirByPathSync, parseBoolean } from '../lib/utils';
import Logger from '../lib/Logger';
import { replaceUrlProtocol, replaceUrlPort, spawnProcess } from '../lib/utils';

const useXVFB = parseBoolean(process.env.XVFB);
const screenWidth = parseInt(process.env.SCREEN_WIDTH || "1280");
const screenHeight = parseInt(process.env.SCREEN_HEIGHT || "720");
const VIEWPORT = {width: screenWidth, height: screenHeight};

const logger = new Logger('MonitorClient');

export default class MonitorClient {
    roomId: string;
    clientUrl: string;
    rtmpUrl: string = "";

    xvfbProcess: any;
    browser: Browser | null = null;
    rtmpProcess: any;
    recProcess: any;

    constructor(roomId: string, clientUrl: string) {
        this.roomId = roomId;
        this.clientUrl = clientUrl;
    }

    async start(screenNo: number) {
        logger.info(`RoomID ${this.roomId} start new monitor client`);
        if (useXVFB) this.xvfbProcess = await this._newScreen(screenNo);
        this.browser = await this._newBrowser(useXVFB ? screenNo : 0, this.clientUrl);
    }

    async reload(clientUrl?: string) {
        let [page] = await this.browser?.pages() || [null];
        if (!page) {
            page = await this.browser?.newPage() as Page;
            // page.waitForDevicePrompt().catch(logger.warn);
            page.on('domcontentloaded', () => {
                logger.debug("domcontentloaded");
            });
            page.on("load", () => logger.debug("page load"));
        }

        if (clientUrl) {
            await page.goto(clientUrl, { waitUntil: 'networkidle2' });
            this._handlePage(page);
        } else {
            page?.reload();
        }
    }

    recStart() {
        logger.info(`RoomID ${this.roomId} start record`);
        try {
            const filePath = `./records/${this.roomId}/${Date.now()}.mkv`;
            mkDirByPathSync(path.dirname(filePath));
            this.recProcess = this._streamTo(filePath);
        } catch(error: any) {
            logger.error(`RoomID ${this.roomId} record fail with error:`, error);
            return false;
        }
        return true;
    }

    recPause() {
        logger.info(`RoomID ${this.roomId} stop record`);
        try {
            if (this.recProcess) {
                this.recProcess.kill();
                this.recProcess = null;
            } else {
                throw new Error("Record is not running");
            }
        } catch(error: any) {
            throw new Error("Fail to stop record with error" + error.message);
        }
    }

    upStream(rtmpServer: string, options: {appname: string, channelkey: string}) {
        this.rtmpUrl = path.join(rtmpServer, options.appname, options.channelkey);
        // ffmpeg -video_size 1365x767 -framerate 30 -f x11grab -i :1.0 -f pulse -ac 2 -i default -vcodec libx264 -f flv ${rtmpUrl} -y
        try {
            this.rtmpProcess = this._streamTo(this.rtmpUrl);
            logger.info(`RoomID ${this.roomId} upStream to ${this.rtmpUrl}`, options);
        } catch(error: any) {
            logger.error("fail to live stream to " + this.rtmpUrl + "with error:", error);
            throw new Error("fail to create live stream with error:" + error.message);
        }
        return {
            rtmp: replaceUrlPort(replaceUrlProtocol(rtmpServer, "rtmp"), 1945)
                + path.join(options.appname, this.roomId),
            flv: replaceUrlPort(rtmpServer, 7001) + path.join(options.appname, `${this.roomId}.flv`),
            hls: replaceUrlPort(rtmpServer, 7002) + path.join(options.appname, `${this.roomId}.m3u8`)
        };
    }

    restartStream() {
        try {
            if (this.rtmpProcess) {
                this.rtmpProcess.kill();
                this.rtmpProcess = null;
            }
            this.rtmpProcess = this._streamTo(this.rtmpUrl);
        } catch(error: any) {
            logger.error("fail to live stream to " + this.rtmpUrl + "with error:", error);
            throw new Error("fail to create live stream with error:" + error.message);
        }
        return true;
    }

    _streamTo(dest: string) {
        return spawnProcess("ffmpeg", [
            '-video_size', `${screenWidth}x${screenHeight}`,
            '-framerate',  '30',
            '-f',          'x11grab',
            '-i',          ':1.0',
            '-f',          'pulse',
            '-ac',         '2',
            '-i',          'default',
            '-vcodec',     'libx264',
            '-fps_mode',   'vfr',
            '-f',          'flv',
            dest,  '-y'
        ], logger.info.bind(logger));
    }

    async stop() {
        logger.info(`RoomID ${this.roomId} stop streaming`);
        try {
            if (this.rtmpProcess) this.rtmpProcess.kill();
            if (this.recProcess) this.recProcess.kill();
            await this.browser?.close().catch(logger.warn);
            if (useXVFB) await this.xvfbProcess.kill();
        } catch(error: any) {
            throw new Error(`RoomID ${this.roomId} can't close client browser with error: ${error.message}`);
        }
    }

    async _newScreen(screenNo: number): Promise<child_process.ChildProcessWithoutNullStreams> {
        // Attempt to launch Xvfb
        try {
            // let output = await execShellCommand(`Xvfb :99 -ac -screen ${screenNo} ${screenWidth}x${screenHeight}x24 -nolisten tcp &`);
            // logger.info("newScreen" + output);
            let process = spawnProcess("Xvfb", [
                ":99", "-ac",
                "-screen", screenNo.toString(), `${screenWidth}x${screenHeight}x24`,
                "-nolisten",
                "tcp &"
            ], logger.info);
            return process;
        } catch(error: any) {
            throw new Error("fail to start Xvfb virtual screen with error " + error.message);
        }
    }

    async _newBrowser(screenNo: number, clientUrl: string): Promise<Browser> {
        let browser: Browser | null = null;
    
        try {
            browser = await puppeteer.launch({
                // product: 'chrome',
                executablePath: 'google-chrome',
                headless: false, // we will use headful chrome
                ignoreHTTPSErrors: true,
                args: ['--no-sandbox', '--disable-infobars', '--use-fake-ui-for-media-stream']
                //, '--start-fullscreen', '--display=' + screenNo]
            });
            // let page: Page = await browser.newPage();
            let [page] = await browser.pages();
            page.setViewport(VIEWPORT);
            // page.waitForDevicePrompt().catch(logger.warn);
            page.on("domcontentloaded", () => logger.debug("domcontentloaded"));
            page.on("load", () => {
                logger.debug("page loaded");
                this._handlePage(page);
            });
            await page.goto(clientUrl, { waitUntil: 'networkidle2' });
            logger.info(`RoomID ${this.roomId} new browser client`);
            this._handlePage(page);
        } catch (error: any) {
            // return callback(error);
            logger.error("ERROR", error);
        } finally {
            return browser as Browser;
        }
    };

    _handlePage(page?: Page | null) {
        if (!page) return;
        try {
            page.waitForSelector("#register-btn")
                .then(() => {
                    page.$eval("#register-btn", (el: any) => {
                        el?.click();
                    }).catch((error: any) => logger.warn(`RoomID ${this.roomId} assert element error`, error));
                })
                .catch((error: any) => logger.warn(`RoomID ${this.roomId} assert element error`, error));
            page.waitForSelector("#join-audio-btn")
                .then(() => {
                    page.$eval("#join-audio-btn", (el: any) => {
                        el?.click();
                    }).catch((error: any) => logger.warn(`RoomID ${this.roomId} assert element error`, error));
                })
                .catch((error: any) => logger.warn(`RoomID ${this.roomId} assert element error`, error));
            page.waitForSelector("#btnFullScreen")
                .then(() => {
                    page.$eval("#btnFullScreen", (el: any) => {
                        el?.click();
                    }).catch((error: any) => logger.warn(`RoomID ${this.roomId} assert element error`, error));
                })
                .catch((error: any) => logger.warn(`RoomID ${this.roomId} assert element error`, error));
        } catch (error: any) {
            logger.warn(`RoomID ${this.roomId} fail to assert page element with error:`, error.message);
        }
    }
}

