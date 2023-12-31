import { EventEmitter } from "node:events";
import AppConfig from "./AppConfig";
import Logger from "./Logger";
import { execShellCommand, spawnProcess } from "./utils";

var logger = new Logger("FFMPEG");

const {
    SCREEN_WIDTH: screenWidth,
    SCREEN_HEIGHT: screenHeight,
    FFMPEG_FRAME_RATE,
    FFMPEG_PROBESIZE,
    FFMPEG_MAX_MUXING_QUEUE_SIZE,
    FFMPEG_CRF,
    FFMPEG_PRESET,
    FFMPEG_FPS,
    FFMPEG_MAXRATE,
    FFMPEG_BUFSIZE,
    FFMPEG_AUDIO_BITRATE,
    FFMPEG_VIDEO_BITRATE
} = AppConfig.getConfigs();

export default class Ffmpeg extends EventEmitter {
    _roomId: string;
    _display: string = ":1.0";
    _pulseSinkId: string = "default";
    _process: any;

    static EVT_ERROR = "error";
    static EVT_CLOSE = "close";
    static EVT_EXIT = "exit";

    constructor(roomId: string, display: string, pulseSinkId: string) {
        super();
        this._roomId = roomId;
        this._display = display;
        this._pulseSinkId = pulseSinkId;
    }

    /**
     * FFMPEG create screen record
     * Local run ok: ffmpeg -video_size 1365x767 -framerate 30 -f x11grab -i :101.0 -f pulse -ac 2 -i default -vcodec libx264 -f flv rtmp://10.70.123.13:1945/live/OQcqnbkDwZk2AnHuCuMplJ2P52a3hK0nZ2CfnQEWH1jLR7Nk -y
     * Docker run ok: ffmpeg -video_size 1365x767 -framerate 25 -f x11grab -i :101.0 -vcodec libx264 -acodec aac -max_muxing_queue_size 99999 -preset veryfast -f flv rtmp://10.70.123.13:1945/live/OQcqnbkDwZk2AnHuCuMplJ2P52a3hK0nZ2CfnQEWH1jLR7Nk -y
     * @param dest 
     * @returns 
     */
    streamTo(dest: string) {
        let args = [
            '-video_size',            `${screenWidth}x${screenHeight - 56}`,
            '-framerate',             `${FFMPEG_FRAME_RATE}`,
            '-probesize',             `${FFMPEG_PROBESIZE}`,
            '-f',                     'x11grab',
            '-draw_mouse',            '0',
            '-i',                     `${this._display}.0+0,56`,
            '-f',                     `pulse`,
            '-ac',                    '2',
            '-i',                     this._pulseSinkId + ".monitor",
            '-acodec',                'aac',
            '-b:a',                   FFMPEG_AUDIO_BITRATE,
            '-vcodec',                'libx264',
            '-b:v',                   FFMPEG_VIDEO_BITRATE,
            '-max_muxing_queue_size', `${FFMPEG_MAX_MUXING_QUEUE_SIZE}`,
            '-crf',                   `${FFMPEG_CRF}`,
            '-preset',                FFMPEG_PRESET,
            '-r',                     `${FFMPEG_FPS}`,
            '-maxrate',               FFMPEG_MAXRATE,
            '-bufsize',               FFMPEG_BUFSIZE,
            '-filter:v',              `fps=${FFMPEG_FRAME_RATE}`,
            '-g',                     '60',
            '-f',                     'flv',
            dest,                     '-y'
        ];
        logger.info(`RoomID ${this._roomId} - ffmpeg`, args.join(" "));
        try {
            this._process = spawnProcess("ffmpeg", args,
                {
                    DISPLAY: `:${this._display}`,
                    PULSE_SINK: this._pulseSinkId
                },
                (data: any) => {
                    // process.stderr.write(data);
                    // logger.debug("ffmpeg stderr", data);
                });
            this._process.on("error", (data: any) => {
                logger.info("ffmpeg error", data);
                this.emit(Ffmpeg.EVT_ERROR, data);
            });
            this._process.on("close", (data: any) => {
                logger.info("ffmpeg close", data);
                this.emit(Ffmpeg.EVT_CLOSE, data);
            });
            this._process.on("exit", (data: any) => {
                logger.info("ffmpeg exit", data);
                this.emit(Ffmpeg.EVT_EXIT, data);
            });
            return this;
        } catch (error: any) {
            logger.error(`RoomID ${this._roomId} failed to start process with error`, error.message);
            throw error;
        }
    }

    kill() {
        logger.info(`RoomID ${this._roomId} end process`);
        if (this._process) {
            this._process.kill();
            this._process = null;
            this.eventNames().forEach(this.removeAllListeners.bind(this));
        }
    }

    /**
     * Concatenating media files
     * @param input file pattern e.g: ./*.mkv
     * @param output file. e.g: /tmp/records/output.mp4
     * @param callback(ouputfile)
     */
    static async concatmedias(input: string, output: string, callback?: Function) {
        /* let options = [
            "-f", "concat",
            "-safe", "0",
            "-i", `<(for f in ${input}; do echo "file '$PWD/$f'"; done)`,
            "-c", "copy", output
        ]
        return await execShellCommand(["ffmpeg", ...options].join(" ")) */
        return await execShellCommand(`./scripts/ff_concat.sh '${input}' '${output}'`)
            .then((data) => {
                logger.info("Output concatenating media file:" + output, data);
                if (callback) callback(output);
            })
            .catch((error: any) => {
                logger.warn("Failed to concatenate media files with error", (error.message || error));
            });
    }

    static killAll() {
        execShellCommand("pkill -9 ffmpeg")
            .then((data) => {
                logger.info(" > kill all process", data);
            })
            .catch((error: any) => {
                logger.warn("Failed to kill all ffmpeg process with error", (error.message || error));
            });
    }
}
