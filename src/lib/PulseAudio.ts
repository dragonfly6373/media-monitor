import { execShellCommand } from './utils';
import Logger from './Logger';

var logger = new Logger("PulseAudio");

export class PulseAudio {
    _sink_no: number;
    _system_sink_id: string;
    _process: any;

    constructor(sink_number: number) {
        this._sink_no = sink_number;
        this._system_sink_id = process.env.PULSE_SINK || "";
    }

    /* set sinkId(sink_number: number) {
        this._sink_id = "sink" + sink_number;
    } */

    get sinkId(): string {
        return "sink" + this._sink_no;
    }

    async start(cb?: Function): Promise<PulseAudio> {
        let options = ["load-module", "module-null-sink", `sink_name=${this.sinkId}`];
        logger.info("execShellCommand -", ["pactl", ...options].join(" "));
        this._process = await execShellCommand(["pactl", ...options].join(" "));
        // for ALSA: use alsamixer
        // for Pulseaudio: use pacmd set-sink-mute n 0 where n is the sink index (likely 0)
        this.unMute();
        if (cb) cb(null, this._process);
        return this;
    }

    async unMute(): Promise<void> {
        this.setSinkEnvVariable();
        await execShellCommand(`pactl set-sink-mute ${this.sinkId} 0`, {env: {DISPLAY: `:${this._sink_no}`}});
        this.restoreSinkEnvVariable();
    }

    stop(cb: Function) {
        if (this._process) {
            logger.info("execShellCommand -", ["pactl", "unload-module", this._process].join(" "));
            this.setSinkEnvVariable();
            execShellCommand(`pactl unload-module ${this._process}`);
            this.restoreSinkEnvVariable();
            if (cb) cb(null, this._process);
        } else {
            return cb && cb(null);
        }
    }

    setSinkEnvVariable() {
        this._system_sink_id = process.env.PULSE_SINK || "";
        process.env.PULSE_SINK = this.sinkId;
    }

    restoreSinkEnvVariable() {
        process.env.PULSE_SINK = this._system_sink_id;
    }

    static async killAll() {
        let result = await execShellCommand("pactl unload-module module-null-sink");
        logger.info(" > kill all pulseaduio module", result);
    }
}
