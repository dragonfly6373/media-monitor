#!/bin/bash

# Init enviroment
export XDG_RUNTIME_DIR="/run/user/$(id -u)"
export DBUS_SESSION_BUS_ADDRESS="unix:path=${XDG_RUNTIME_DIR}/bus"
# chkconfig dbus on
echo $DBUS_SESSION_BUS_ADDRESS
systemctl --user start dbus
/etc/init.d/dbus start
rc-update add dbus default
# Start PulseAudio Daemonize
systemctl --user start pulseaudio.{socket,service}
pulseaudio --start --daemonize
pulseaudio -k
# Start monitor server
/usr/bin/node ./dist/server.js

