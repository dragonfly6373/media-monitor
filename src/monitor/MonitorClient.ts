import path from 'path';
import puppeteer, { Browser, Page } from 'puppeteer';

import { mkDirByPathSync } from '../lib/utils';
import Xvfb from '../lib/Xvfb';
import Logger from '../lib/Logger';
import AppConfig from '../lib/AppConfig';
import { PulseAudio } from '../lib/PulseAudio';
import Ffmpeg from '../lib/Ffmpeg';

const {
    // XVFB: useXVFB,
    SCREEN_WIDTH: screenWidth,
    SCREEN_HEIGHT: screenHeight,
    CHROME_DISK_CACHE_DIR,
    CHROME_DISK_CACHE_SIZE,
    RECORD_OUTPUT_DIR
} = AppConfig.getConfigs();

const VIEWPORT = {width: screenWidth, height: screenHeight};

const logger = new Logger('MonitorClient');

export default class MonitorClient {
    roomId: string;
    clientUrl: string;
    rtmpUrl: string = "";
    screenNo: number = 99;

    xvfbProcess: any;
    pulseProcess: PulseAudio | any;
    browser: Browser | null = null;
    rtmpProcess: Ffmpeg | null = null;
    recProcess: Ffmpeg | null = null;

    constructor(roomId: string, clientUrl: string) {
        this.roomId = roomId;
        this.clientUrl = clientUrl;
    }

    async start(screenNo: number) {
        logger.info(`RoomID ${this.roomId} start new monitor client`);
        this.screenNo = screenNo;
        try {
            this.pulseProcess = new PulseAudio(screenNo);
            await this.pulseProcess.start((error: any, data: any) => {
                if (error) logger.error(`RoomID ${this.roomId} failed to start new pulseAudio procees with error`, error.message);
                else logger.info(`RoomId ${this.roomId} start new pulseAudio`, this.pulseProcess.sinkId, data);
            });
            this.xvfbProcess = this._newScreen();
            this.browser = await this._newBrowser(this.clientUrl, {
                xvfb: this.xvfbProcess,
                pulseAudio: this.pulseProcess
            });
        } catch(error: any) {
            throw new Error("Failed to start monitor client with error " + error.message);
        }
    }

    async reload(clientUrl?: string) {
        logger.info(`RoomID ${this.roomId} reload page`);
        if (this.browser) {
            let [page] = await this.browser?.pages() || [null];
            if (!page) {
                page = await this.browser?.newPage() as Page;
                // page.waitForDevicePrompt().catch(logger.warn);
                // page.on('domcontentloaded', () => {
                //     logger.debug("domcontentloaded");
                // });
                // page.on("load", () => logger.debug("page load"));
            }

            if (clientUrl) {
                await page.goto(clientUrl, { waitUntil: 'networkidle2' });
                this._handlePage(page);
            } else {
                page?.reload();
            }
        } else {
            this.browser = await this._newBrowser(this.clientUrl, {
                xvfb: this.xvfbProcess,
                pulseAudio: this.pulseProcess
            });
        }
    }

    recStart() {
        logger.info(`RoomID ${this.roomId} start record`);
        try {
            const filePath = path.join(RECORD_OUTPUT_DIR, this.roomId, `${Date.now()}.mkv`);
            mkDirByPathSync(path.dirname(filePath));
            if (!this.recProcess) {
                this.recProcess = new Ffmpeg(this.roomId, this.xvfbProcess.display(), this.pulseProcess.sinkId);
            }
            this.recProcess.streamTo(filePath);
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
            throw new Error("Fail to stop record with error " + error.message);
        }
    }

    upStream(rtmpServer: string) {
        this.rtmpUrl = rtmpServer;
        try {
            if (!this.rtmpProcess) {
                this.rtmpProcess = new Ffmpeg(this.roomId, this.xvfbProcess.display(), this.pulseProcess.sinkId);
            }
            this.rtmpProcess.streamTo(this.rtmpUrl);
            logger.info(`RoomID ${this.roomId} upStream to ${this.rtmpUrl}`);
            return true;
        } catch(error: any) {
            logger.error(`RoomID ${this.roomId} Failed to live stream to ` + this.rtmpUrl + "with error:", error);
            throw new Error(`RoomID ${this.roomId} Failed to create live stream with error: ` + error.message);
        }
    }

    restartStream() {
        try {
            if (this.rtmpProcess) {
                this.rtmpProcess.kill();
                this.rtmpProcess = null;
            }
            if (!this.rtmpProcess) this.rtmpProcess = new Ffmpeg(this.roomId, this.xvfbProcess.display(), this.pulseProcess.sinkId);
            this.rtmpProcess.streamTo(this.rtmpUrl);
            // this._streamTo(this.rtmpUrl);
        } catch(error: any) {
            logger.error(`RoomID ${this.roomId} Failed to live stream to ` + this.rtmpUrl + "with error:", error);
            throw new Error(`RoomID ${this.roomId} Failed to create live stream with error: ` + error.message);
        }
        return true;
    }

    async stop() {
        logger.info(`RoomID ${this.roomId} stop streaming`);
        try {
            if (this.rtmpProcess) this.rtmpProcess.kill();
            if (this.recProcess) this.recProcess.kill();
            await this.browser?.close().catch(logger.warn);
            this.xvfbProcess?.stop(() => {});
            this.pulseProcess?.stop(() => {});
        } catch(error: any) {
            throw new Error(`RoomID ${this.roomId} can't close client browser with error: ${error.message}`);
        }
    }

    // Attempt to launch Xvfb
    // async _newScreen(): Promise<child_process.ChildProcessWithoutNullStreams> {
    _newScreen(): Xvfb {
        try {
            logger.info(`RoomID ${this.roomId} Xvfb start newScreen`, this.screenNo, `${screenWidth}x${screenHeight}x24`);
            this.pulseProcess?.setSinkEnvVariable();
            /* let p = spawnProcess("Xvfb", [
                ":" + this.screenNo, "-ac",
                "-screen", "+extension", `${screenWidth}x${screenHeight}x24`,
                "-nocursor",
                "-displayID", ":" + this.screenNo
                // "-nolisten", "tcp &"
            ], logger.info.bind(logger));
            return p; */
            let p = new Xvfb({
                displayNo: this.screenNo,
                reuse: true,
                timeout: 10000,
                xvfb_args: [
                    "-ac",
                    "-screen", "+extension", `${screenWidth}x${screenHeight}x24`,
                    // "&", "pulseaudio",
                    "-nocursor",
                    "-displayID", ":" + this.screenNo
                ]
            });
            p.startSync();
            this.pulseProcess?.restoreSinkEnvVariable();
            return p;
        } catch(error: any) {
            throw new Error(`RoomID ${this.roomId} Failed to start Xvfb virtual screen with error ` + error.message);
        }
    }

    async _newBrowser(clientUrl: string, options: {xvfb: any, pulseAudio: any}): Promise<Browser> {
        let browser: Browser | null = null;
        logger.info(`RoomID ${this.roomId} new browser client on screen: ${this.screenNo}`);
    
        try {
            browser = await puppeteer.launch({
                // product: 'chrome',
                executablePath: 'google-chrome',
                headless: false, // we will use headful chrome
                ignoreHTTPSErrors: true,
                env: {
                    DISPLAY: options.xvfb.display(),
                    PULSE_SINK: options.pulseAudio.sinkId
                },
                ignoreDefaultArgs: ['--enable-automation'],
                args: [
                    '--no-sandbox', // Stability and security will suffer
                    '--disable-infobars',
                    // '--disable-setuid-sandbox', // Stability and security will suffer
                    '--disable-print-preview',
                    '--disable-site-isolation-trials',
                    '--disable-speech-api',
                    '--disable-web-security',
                    '--disable-dev-shm-usage',
                    '--hide-scrollbars',
                    '--use-fake-ui-for-media-stream',
                    '--allow-running-insecure-content',
                    '--start-fullscreen',
                    '--disk-cache-dir=' + CHROME_DISK_CACHE_DIR,
                    '--disk-cache-size=' + CHROME_DISK_CACHE_SIZE,
                    '--display=' + options.xvfb.display(),
                    `--window-size=${screenWidth},${screenHeight}`,
                    `--alsa-output-device=hw:${this.screenNo},0`
                ]
            });
            const context = browser.defaultBrowserContext();
            [
                'https://gomeetv3-dev.vnptit.vn',
                'https://gomeetv3.vnptit.vn'
            ].forEach((domain) => context.overridePermissions(domain, ['notifications']));
            // let page: Page = await browser.newPage();
            let [page] = await browser.pages();
            page.setViewport(VIEWPORT);
            // page.waitForDevicePrompt().catch(logger.warn);
            await page.goto(clientUrl, { waitUntil: 'networkidle2' });
            page.on("domcontentloaded", () => logger.debug("domcontentloaded"));
            page.on("load", () => {
                logger.debug("page loaded");
                this._handlePage(page);
            });
            this._handlePage(page);
        } catch (error: any) {
            // return callback(error);
            logger.error(`RoomID ${this.roomId} Failed to create new browser with error:`, error);
        } finally {
            return browser as Browser;
        }
    };

    _handlePage(page?: Page | null) {
        if (!page) return;
        try {
            /** for test youtube page */
            /* page.waitForSelector(".ytp-play-button")
                .then(() => {
                    page.$eval(".ytp-play-button", (el: any) => {
                        if (el?.title.includes("Play")) el?.click();
                    }).catch((error: any) => logger.warn(`RoomID ${this.roomId} assert element error`, error));
                })
                .catch((error: any) => logger.warn(`RoomID ${this.roomId} assert element error`, error)); */

            /** for test zing mp3 page */
            page.waitForSelector(".btn-play-all")
                .then(() => {
                    page.$eval(".btn-play-all", (el: any) => {
                        el?.click();
                    }).catch((error: any) => logger.warn(`RoomID ${this.roomId} assert element error`, error));
                })
                .catch((error: any) => logger.warn(`RoomID ${this.roomId} assert element error`, error));

            /** GoMeet click to join audio */
            page.waitForSelector("#join-audio-btn")
                .then(() => {
                    page.$eval("#join-audio-btn", (el: any) => {
                        el?.click();
                        logger.debug("handle click #join-audio-btn");
                    }).catch((error: any) => logger.warn(`RoomID ${this.roomId} click element error`, error.message));
                })
                .catch((error: any) => {logger.warn(`RoomID ${this.roomId} assert element error`, error.message)});

            /** GoMeet click to active fullscreen */
            page.waitForSelector("#btnFullScreen")
                .then(() => {
                    page.$eval("#btnFullScreen", (el: any) => {
                        el?.click();
                        logger.debug("handle click #btnFullScreen");
                    }).catch((error: any) => {logger.warn(`RoomID ${this.roomId} click element error`, error.message)});
                })
                .catch((error: any) => {logger.warn(`RoomID ${this.roomId} assert element error`, error.message)});
        } catch (error: any) {
            logger.warn(`RoomID ${this.roomId} fail to handle page element with error:`, error.message);
        }
    }
}
