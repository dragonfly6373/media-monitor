#!/bin/bash

# Start PulseAudio Daemonize
pulseaudio -D --system --disallow-exit
# Start monitor server
/usr/bin/node ./dist/server.js
