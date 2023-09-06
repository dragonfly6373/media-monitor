# Usage:

## Install All Dependencies
> npm install

## Run Dev
> npm start

**Output:**
```
14:01:29 GMT+0700 (Indochina Time) [INFO][Server] http://localhost Server running at http://localhost:8090/
14:01:29 GMT+0700 (Indochina Time) [INFO][Server] Application Configs: AppConfig {
  DOMAIN: 'http://localhost',
  PORT: 8090,
  XVFB: true,
  XVFB_DISPLAY_START_NUM: 2,
  SCREEN_WIDTH: 1280,
  SCREEN_HEIGHT: 720,
  CHROME_DISK_CACHE_DIR: './temp/gomeet-v3/browser-cache-disk',
  CHROME_DISK_CACHE_SIZE: 33554432,
  RTMP_SERVER: 'http://10.70.123.13:8890',
  RTMP_UPSTREAM: 'rtmp://10.70.123.13:1945',
  RECORD_OUTPUT_DIR: './tmp/records',
  LOGGER_CONFIGS: {
    level: 4,
    isWriteToFile: false,
    logDir: '/var/log/gomeet-v3/monitor',
    timeIncluded: true
  }
}
```

**Create Client from clientUrl and get RMTP Link:**
> curl --location 'http://localhost:8090/live?roomId=demo&clientUrl=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3Db1kbLwvqugk&rtmpServer=http%3A%2F%2F10.70.123.13%3A8890'

**Reload Client If any error occur:**
> curl --location 'http://localhost:8090/reload?roomId=demo&clientUrl=https%3A%2F%2Fgomeetv3-dev.vnptit.vn%2Froom%3FsessionToken%3DBfN7nuQFQiSNDH3xia22kPEttgYDmMn7'

**Stop Monitor Client:**
> curl --location 'http://localhost:8090/stop?roomId=demo'

## Build Docker:
> npm run build:docker

## Build Production:
> npm run build:prod

## Start Production:
> npm run start:prod

# App Structures:

## Enviroment:
```
DOMAIN=http://localhost
PORT=8090
XVFB_DISPLAY_START_NUM=2
SCREEN_WIDTH=1280
SCREEN_HEIGHT=720

# Puppeteer
CHROME_DISK_CACHE_DIR=./temp/gomeet-v3/browser-cache-disk
CHROME_DISK_CACHE_SIZE=33554432
ENABLE_CLIENT_DOMAIN=https://vnptit.vn,https://gomeetv3.vnptit.vn,https://gomeetv3-dev.vnptit.vn,https://gomeet.vnpt.vn

# RTMP Server
RTMP_SERVER=http://10.70.123.13:8890
RTMP_UPSTREAM=rtmp://10.70.123.13:1945

# Recording
RECORD_OUTPUT_DIR=./tmp/records

# Logger Configurations
LOGGER_LEVEL=4
LOGGER_WRITE_FILE=false
LOGGER_OUTPUT=/var/log/gomeet-v3/monitor
LOGGER_TIME_INCLUDED=true
```
## Server
**File:** ./src/server.ts

**Descriptions:**
* Create pure http server.
* Handle request, get request method, request pathname, request searchParams

## Rest Controller
**File:** ./src/controller/RestController.ts

**Descriptions:** Handle routing and execute client's request by method, pathname, and searchParams
Handle request path:

### 1. '/live':
Create new Xvfb Display, open puppeteer - google chrome, join web client to room, Ffmpeg capture entire screen and send mediastream to RTMP server.

**Params:**
* **roomId**: string (required)
* **clientUrl**: string (required)
* **rtmpServer**: string (required)

**Return:**
* **success**: boolean

### 2. '/restart'
Kill and re-create Ffmpeg media stream to RTMP Server

**Params:**
* **roomId**: string (required)

**Return:**
* **success**: boolean

### 3. '/reload'
Reload client URL (does not kill streaming process)

**Params:**
* **roomId**: string (required)
* **clientUrl**: string (optional)

**Return:**
* **success**: boolean

### 4. '/stop'
**Params:**
* **roomId**: string (required)

**Return:**
* **success**: boolean

### 5. '/recStart'
**Params:**
* **roomId**: string (required)

**Return:**
* **success**: boolean
### 6. '/recPause'
**Params:**
* **roomId**: string (required)

**Return:**
* **success**: boolean

## Monitor Controller
**Properties:**
* **clientMap**: Map<string, MonitorClient> = new Map()
* **clientCounter**: number = XVFB_DISPLAY_START_NUM

**Methods:**
1. **constructor()**
2. **nextScreenNumber()**: number
3. async **createClient(roomId: string, clientUrl: string)**: Promise<MonitorClient>
4. **getClient(roomId: string)**: MonitorClient | undefined
5. async **reload(roomId: string, clientUrl: string)**: void
6. async **stopClient(roomId: string)**: void
7. async **cleanResource()**: void

## MonitorClient:
**Properties:**
1. **roomId**: string
2. **clientUrl**: string
3. **rtmpUrl**: string = ""
4. **screenNo**: number = 99
5. **xvfbProcess**: any
6. **pulseProcess**: PulseAudio | any = null
7. **browser**: Browser | null = null
8. **rtmpProcess**: Ffmpeg | null = null
9. **recProcess**: Ffmpeg | null = null

**Method:**
1. **constructor**(roomId: string, clientUrl: string)
2. async **start**(screenNo: number)
3. async **reload**(clientUrl?: string)
4. **recStart**()
5. **recPause**()
6. **upStream**(rtmpServer: string)
7. **restartStream**()
8. async **stop**()
9. **_newScreen**(): Xvfb
10. async _**newBrowser**(clientUrl: string, options: {xvfb: any, pulseAudio: any}): Promise<Browser>
11. _**handlePage**(page?: Page | null)

## Libraries
### XVFB
**Properties:**
1. **_display**: string = ""
2. **_oldDisplay**: string = ""
3. **_reuse**: boolean
4. **_timeout**: number = 3000
5. **_silent**: boolean = true
6. **_xvfb_args**: Array<string> = []
7. **_process**: any

**Methods:**
1. **constructor(options: any)**

**options:**
* **displayNo**: number - display number. Will be converted to :1.0
* **reuse**: boolean - reuse display if exists
* **timeout**: number - create screen timeout. Defautl value 3000ms
* **silent**: boolean - mute on stderr. Default value true
* **xvfb_args**: Array<string>

2. **start(cb: Function)**
3. **startSync()**
4. **stop(cb: Function)**
5. **stopSync()**
6. **display()**
7. **_setDisplayEnvVariable()**
8. **_restoreDisplayEnvVariable()**
9. **_spawnProcess(onAsyncSpawnError: Function)**
10.  **_killProcess()**
11. **_lockFile(displayNo?: number)**: string
12. static async **isScreenUsed(displayNo: string)**: Promise<boolean>
13. async **_isScreenUsed()**: Promise<boolean>
14. static **killAll()**
### Pulse Audio
**Properties:**
1. **_sink_id**: string
2. **_system_sink_id**: string
3. **_process**: any

**Methods:**
1. **constructor(sink_number: number)**
2. set **sinkId(sink_number: number)**
3. get **sinkId()**: string
4. async **start(cb?: Function)**: Promise<PulseAudio>
5. **stop(cb: Function)**: void
6. **_setSinkEnvVariable()**: void
7. **_restoreSinkEnvVariable()**: void
8. static async **killAll()**: void

### FFMPEG
**Properties:**
1. _roomId: string
2. _display: string = ":1.0"
3. _pulseSinkId: string = "default"
4. _process: any

**Methods:**
1. **constructor(roomId: string, display: string, pulseSinkId: string)**
2. **streamTo(dest: string)**
3. **kill()**
3. static **killAll()**

# Refferences:
## Puppeteer:
* [Puppeteer](https://devdocs.io/puppeteer/)

## PulseAudio:
* [PulseAudio](https://www.freedesktop.org/wiki/Software/PulseAudio/Documentation/User/Modules/)

## FFMPEG:
* [Ffmpeg](https://trac.ffmpeg.org/wiki/Capture/Desktop)

## Open Source:
* [Github Demo](https://gist.github.com/olasd/9841772)
* [Bigbluebutton Recorder](https://github.com/jibon57/bbb-recorder)
* [Youtube Live Streaming API](https://developers.google.com/youtube/v3/live/docs/)

