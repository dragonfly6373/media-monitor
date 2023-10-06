import AppConfig from "./AppConfig";
import Logger from "./Logger";
import { execShellCommand, spawnProcess } from "./utils";

var logger = new Logger("FFMPEG");

const {
    SCREEN_WIDTH: screenWidth,
    SCREEN_HEIGHT: screenHeight,
} = AppConfig.getConfigs();

export default class Ffmpeg {
    _roomId: string;
    _display: string = ":1.0";
    _pulseSinkId: string = "default";
    _process: any;

    constructor(roomId: string, display: string, pulseSinkId: string) {
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
        /* let localargs = [
            '-video_size', `${screenWidth}x${screenHeight}`,
            '-framerate',  '30',
            '-f',          'x11grab',
            '-i',          `:${this.screenNo}.0`,
            '-f',          'pulse',
            '-ac',         '2',
            '-i',          'default',
            '-vcodec',     'libx264',
            // '-fps_mode',   'vfr',
            '-f',          'flv',
            dest,  '-y'
        ]; */
        let args = [
            '-video_size',            `${screenWidth}x${screenHeight - 56}`,
            '-framerate',             '25',
            '-f',                     'x11grab',
            '-draw_mouse',            '0',
            '-i',                     `${this._display}.0+0,56`,
            '-f',                     `pulse`,
            '-ac',                    '2',
            '-i',                     this._pulseSinkId + ".monitor",
            '-vcodec',                'libx264',
            '-acodec',                'aac',
            '-max_muxing_queue_size', '99999',
            '-preset',                'veryfast',
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
            this._process.on("error", (data: any) => logger.info("ffmpeg error", data));
            this._process.on("close", (data: any) => logger.info("ffmpeg close", data));
            this._process.on("exit", (data: any) => logger.info("ffmpeg exit", data));
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
