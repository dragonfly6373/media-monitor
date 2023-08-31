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
File: ./src/server.ts
Descriptions:
* Create pure http server.
* Handle request, get request method, request pathname, request searchParams

## Rest Controller
File: ./src/controller/RestController.ts
Handle routing and execute client's request by method, pathname, and searchParams
Handle request path:

### Pathname '/create':
Create new Xvfb Display, open puppeteer - google chrome, join web client to room, Ffmpeg capture entire screen and send mediastream to RTMP server.

**Params:**
* **roomId**: string (required)
* **clientUrl**: string (required)
* **rtmpServer**: string (required)

**Return:**
* **result**: {rtmp: string}

### Pathname '/restart'
Kill and re-create Ffmpeg media stream to RTMP Server

**Params:**
* **roomId**: string (required)

**Return:**
* **success**: boolean

### Pathname '/reload'
Reload client URL (does not kill streaming process)

**Params:**
* **roomId**: string (required)
* **clientUrl**: string (optional)

**Return:**
* **success**: boolean

### Pathname '/stop'
**Params:**
* **roomId**: string (required)

**Return:**
* **success**: boolean

### Pathname '/recStart'
**Params:**
* **roomId**: string (required)

**Return:**
* **success**: boolean
### Pathname '/recPause'
**Params:**
* **roomId**: string (required)

**Return:**
* **success**: boolean

## Monitor Controller
**Properties:**
* **clientMap**: Map<string, MonitorClient> = new Map()
* **clientCounter**: number = XVFB_DISPLAY_START_NUM

**Methods:**
* **constructor()**
* **nextScreenNumber()**: number
* **async createClient(roomId: string, clientUrl: string)**: Promise<MonitorClient>
* **getClient(roomId: string)**: MonitorClient | undefined
* **async reload(roomId: string, clientUrl: string)**: void
* **async stopClient(roomId: string)**: void
* **async cleanResource()**: void

## Libraries
### XVFB
**Properties:**

**Methods:**

### Pulse Audio
**Properties:**
* **_sink_id**: string
* **_system_sink_id**: string
* **_process**: any

**Methods:**
* **constructor(sink_number: number)**
* **set sinkId(sink_number: number)**
* **get sinkId()**: string
* **async start(cb?: Function)**: Promise<PulseAudio>
* **stop(cb: Function)**: void
* **_setSinkEnvVariable()**: void
* **_restoreSinkEnvVariable()**: void
* **static async killAll()**: void

### Puppeteer
**Properties:**

**Methods:**

### FFMPEG
**Properties:**

**Methods:**

# Refferences:

## Puppeteer:
* [Puppeteer](https://devdocs.io/puppeteer/)

## PulseAudio:
* [PulseAudio](https://www.freedesktop.org/wiki/Software/PulseAudio/Documentation/User/Modules/)

## FFMPEG:
* [Ffmpeg](https://trac.ffmpeg.org/wiki/Capture/Desktop)

# Stream to Youtube:
* [Github Demo](https://gist.github.com/olasd/9841772)

