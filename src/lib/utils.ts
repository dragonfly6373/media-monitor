import child_process from 'child_process';
import fs from 'fs';
import path from 'path';

export const parseBoolean = (value?: string): boolean => {
    if (value) {
        return JSON.parse(value) as boolean;
    }
    return false;
}

export const parseArray = <T>(value?: string, sep: string = ",", parser?: Function): Array<T> => {
    if (value) {
        let results = value.split(sep);
        if (parser) return results.map(i => parser(i) as T);
        return results as Array<T>;
    }
    return [];
}

export const replaceUrlProtocol = (url: string, protocol: string): string => {
    return url.replace(/^([a-z0-9])+(:\/\/)/i, protocol + "$2");
}

export const replaceUrlPort = (url: string, newport: number): string => {
    return url.replace(/^([a-z]+:\/\/[a-z0-9.]+)(:[0-9]+)/i, `$1:${newport}/`);
}

export function mkDirByPathSync(targetDir: string, { isRelativeToScript = false } = {}) {
    const sep = path.sep;
    const initDir = path.isAbsolute(targetDir) ? sep : '';
    const baseDir = isRelativeToScript ? __dirname : '.';

    return targetDir.split(sep).reduce((parentDir, childDir) => {
        const curDir = path.resolve(baseDir, parentDir, childDir);
        try {
            fs.mkdirSync(curDir);
        } catch (err: any) {
            if (err.code === 'EEXIST') { // curDir already exists!
                return curDir;
            }
            // To avoid `EISDIR` error on Mac and `EACCES`-->`ENOENT` and `EPERM` on Windows.
            if (err.code === 'ENOENT') { // Throw the original parentDir error on curDir `ENOENT` failure.
                throw new Error(`EACCES: permission denied, mkdir '${parentDir}'`);
            }
            const caughtErr = ['EACCES', 'EPERM', 'EISDIR'].indexOf(err.code) > -1;
            if (!caughtErr || caughtErr && curDir === path.resolve(targetDir)) {
                throw err; // Throw if it's just the last created dir.
            }
        }
        return curDir;
    }, initDir);
}

export function execShellCommand(cmd: string): Promise<any> {
    return new Promise((resolve, reject) => {
        child_process.exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.warn(error);
            }
            resolve(stdout ? stdout : stderr);
        });
    });
}

export function spawnProcess(cmd: string, options: Array<string>, stdcallback: Function): child_process.ChildProcessWithoutNullStreams {
    const child = child_process.spawn(cmd, options)
    child.stdout.on('data', (data: any) => stdcallback.call(stdcallback, cmd, "stdout", data?.toString()));
    child.stderr.on('data', (data: any) => stdcallback.call(stdcallback, cmd, "stderr", data?.toString()));
    // child.on('exit', (data: any) => callback.call(callback, cmd, "exit", data?.toString()));
    // child.on('error', (data: any) => callback.call(callback, cmd, "error", data?.toString()));
    // child.on('message', (data: any) => callback.call(callback, cmd, "message", data?.toString()));
    // child.on('close', (data: any) => callback.call(callback, cmd, "close", data?.toString()));
    return child;
}
