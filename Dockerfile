# FROM node:18-bullseye

# LABEL version="1.0.1"
# LABEL description="Media Monitor"

# # Update the package list and install curl gnupg xvfb and ffmpeg
# RUN apt-get update --fix-missing && apt-get -y upgrade \
#     && apt-get install -y software-properties-common \
#     && apt-get install -y wget curl gnupg

# # && apt-get clean \
# # && rm -rf /var/lib/apt/lists/* /var/cache/* /var/log/*

# # Add the ffmpeg 5 repository
# RUN add-apt-repository --remove ppa:mc3man/trusty-media
# RUN add-apt-repository --remove ppa:network-manager/trunk
# # RUN add-apt-repository ppa:savoury1/ffmpeg5
# # RUN add-apt-repository ppa:ubuntudde-dev/stable
# # Add the google-chrome repository and install
# RUN curl -sS -o - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add
# RUN echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list

# #  --no-install-recommends
# RUN apt-get -y update && apt-get -y full-upgrade \
#     && apt-get install -y ffmpeg xvfb google-chrome-stable \
#     && rm -rf /var/lib/apt/lists/* \
#     && rm -rf /src/*.deb

FROM livestream-base:v1.0.1

RUN mkdir -p /var/log/live-streaming
WORKDIR /opt/live-streaming

COPY package.json package-lock.json .env ./
RUN npm install --production

COPY ./dist ./dist
# CMD npm run start:prod
COPY run.sh ./
RUN chmod a+x ./run.sh
RUN useradd -rm -s /bin/bash -g root -G sudo -u 1001 monitor -d /home/monitor
RUN usermod -aG pulse,pulse-access monitor
RUN adduser root pulse-access
# RUN mkdir -p /home/monitor/.config/systemd/user/docker.service.d
RUN mkdir /run/user/1001
RUN chown -R monitor /run/user/1001
RUN chown -R monitor /home/monitor
# Check dbus Service
# RUN chkconfig dbus on
# RUN service start dbus
# RUN /etc/init.d/dbus start
# RUN rc-update add dbus default

USER monitor
# RUN export XDG_RUNTIME_DIR="/run/user/$UID"
# RUN export DBUS_SESSION_BUS_ADDRESS="unix:path=${XDG_RUNTIME_DIR}/bus"

# RUN systemctl --user enable pulseaudio
# RUN systemctl --user stop pulseaudio.{socket,service}
RUN rm -fr /home/monitor/.pulse
RUN rm -fr /home/monitor/.pulse-cookie
RUN rm -fr /home/monitor/.config/pulse
COPY pulse/client.conf /home/monitor/.config/pulse/
COPY pulse/default.pa /home/monitor/.config/pulse/

# # Start PulseAudio Daemonize
# RUN systemctl --user start pulseaudio.{socket,service}
# RUN pulseaudio --start --daemonize
# RUN pulseaudio -k

# Start Service
ENTRYPOINT ["/bin/bash","-c","/opt/live-streaming/run.sh"]

EXPOSE 8090
