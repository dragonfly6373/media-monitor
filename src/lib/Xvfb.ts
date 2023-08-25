import fs from 'fs';
import { spawn } from 'child_process';
import { execShellCommand, parseBoolean, spawnProcess } from './utils';
import Logger from './Logger';

var logger = new Logger("Xvfb");

var usleep: any = (microsecs: number) => {
    // Fall back to busy loop.
    var deadline = Date.now() + microsecs / 1000;
    while (Date.now() <= deadline);
};

export default class Xvfb {
    _display: string;
    _oldDisplay: string = "";
    _reuse: boolean;
    _timeout: number = 3000;
    _silent: boolean = true;
    _xvfb_args: Array<string> = [];
    _process: any;

    constructor(options: any) {
        options = options || {};
        this._display = ":" + options.displayNo;
        this._reuse = options.reuse;
        this._timeout = options.timeout || 3000;
        this._silent = options.silent;
        this._xvfb_args = options.xvfb_args || [];
    }

    start(cb: Function) {
        if (!this._process) {
            let lockFile = this._lockFile();

            this._setDisplayEnvVariable();
            let exists = fs.existsSync(lockFile);
            if (exists) {
                if (!this._reuse) {
                    throw new Error('Display ' + this.display() + ' is already in use and the "reuse" option is false.');
                }
            }
            let didSpawnFail = false;
            try {
                this._spawnProcess((e: any) => {
                    didSpawnFail = true;
                    if (cb) cb(e);
                });
            } catch (e) {
                return cb && cb(e);
            }

            let totalTime = 0;
            let checkIfStarted = () => {
                let exists = fs.existsSync(lockFile);
                if (didSpawnFail) {
                    // When spawn fails, the callback will immediately be called.
                    // So we don't have to check whether the lock file exists.
                    return;
                }
                if (exists) {
                    return cb && cb(null, this._process);
                } else {
                    totalTime += 10;
                    if (totalTime > this._timeout) {
                        return cb && cb(new Error('Could not start Xvfb.'));
                    } else {
                        setTimeout(checkIfStarted.bind(this), 10);
                    }
                }
            };
            checkIfStarted();
        }
    }

    startSync() {
        if (!this._process) {
            let lockFile = this._lockFile();

            this._setDisplayEnvVariable();
            if (fs.existsSync(lockFile)) {
                if (!this._reuse) {
                    throw new Error('Display ' + this.display() + ' is already in use and the "reuse" option is false.');
                }
            }
            this._spawnProcess((e: any) => {
                // Ignore async spawn error. While usleep is active, tasks on the
                // event loop cannot be executed, so spawn errors will never be
                // received during the startSync call.
            });

            let totalTime = 0;
            while (!fs.existsSync(lockFile)) {
                if (totalTime > this._timeout) {
                    throw new Error('Could not start Xvfb.');
                }
                usleep(10000);
                totalTime += 10;
            }
        }

        return this._process;
    }

    stop(cb: Function) {
        if (this._process) {
            this._killProcess();
            this._restoreDisplayEnvVariable();

            let lockFile = this._lockFile();
            let totalTime = 0;
            let checkIfStopped = () => {
                let exists = fs.existsSync(lockFile);
                if (!exists) {
                    return cb && cb(null, this._process);
                } else {
                    totalTime += 10;
                    if (totalTime > this._timeout) {
                        return cb && cb(new Error('Could not stop Xvfb.'));
                    } else {
                        setTimeout(checkIfStopped.bind(this), 10);
                    }
                }
            };
            checkIfStopped();
        } else {
            return cb && cb(null);
        }
    }

    stopSync() {
        if (this._process) {
            this._killProcess();
            this._restoreDisplayEnvVariable();

            var lockFile = this._lockFile();
            var totalTime = 0;
            while (fs.existsSync(lockFile)) {
                if (totalTime > this._timeout) {
                    throw new Error('Could not stop Xvfb.');
                }
                usleep(10000);
                totalTime += 10;
            }
        }
    }

    display() {
        if (!this._display) {
            let displayNo = 98;
            let lockFile;
            do {
                displayNo++;
                lockFile = this._lockFile(displayNo);
            } while (!this._reuse && fs.existsSync(lockFile));
            this._display = ':' + displayNo;
        }
        return this._display;
    }

    _setDisplayEnvVariable() {
        this._oldDisplay = process.env.DISPLAY || "";
        process.env.DISPLAY = this.display();
    }

    _restoreDisplayEnvVariable() {
        process.env.DISPLAY = this._oldDisplay;
    }

    _spawnProcess(onAsyncSpawnError: Function) {
        let display = this.display();

        let args = [display].concat(this._xvfb_args);
        logger.info("spawnProcess Xvfb", args);
        this._process = spawnProcess('Xvfb', args, (data: any) => {
            if (!this._silent) {
                process.stderr.write(data);
            }
        });
        // Bind an error listener to prevent an error from crashing node.
        this._process.once('error', function (e: any) {
            onAsyncSpawnError(e);
        });
    }

    _killProcess() {
        this._process.kill();
        this._process = null;
    }

    _lockFile(displayNo?: number): string {
        let d = displayNo?.toString || this.display().toString().replace(/^:/, '');
        return '/tmp/.X' + d + '-lock';
    }

    static async isScreenUsed(displayNo: string): Promise<boolean> {
        return parseBoolean(await execShellCommand(`xdpyinfo -display ${displayNo} >/dev/null 2>&1 && echo true || echo false`) || "false");
    }

    async _isScreenUsed(): Promise<boolean> {
        return await Xvfb.isScreenUsed(this.display());
    }
}

/* 
if (require.main === module) {
  var assert = require('assert');
  var xvfb = new Xvfb({ displayNo: 88 });
  xvfb.startSync();
  console.error('started sync');
  xvfb.stopSync();
  console.error('stopped sync');
  xvfb.start(function(err: any) {
    assert.equal(err, null);
    console.error('started async');
    xvfb.stop(function(err: any) {
      assert.equal(err, null);
      console.error('stopped async');
      xvfb.start(function(err: any) {
        assert.equal(err, null);
        console.error('started async');
        xvfb.stopSync();
        console.error('stopped sync');
        xvfb.startSync();
        console.error('started sync');
        xvfb.stop(function(err: any) {
          assert.equal(err, null);
          console.error('stopped async');
        });
      });
    });
  });
} */