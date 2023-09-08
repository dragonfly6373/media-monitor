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

FROM nguyendang2022/livestream-base:v1.0.1

RUN mkdir -p /var/log/gomeet-v3/monitor
WORKDIR /var/www/media-monitor

COPY package.json package-lock.json .env ./
RUN npm install --production

COPY ./dist ./dist
# CMD npm run start:prod
COPY run.sh ./
RUN chmod a+x ./run.sh
RUN useradd -rm -s /bin/bash -g root -G sudo -u 1001 monitor
RUN usermod -aG pulse,pulse-access monitor

USER monitor

RUN rm -fr  ~/.config/pulse
RUN pulseaudio --start --daemonize

# Start Service
ENTRYPOINT ["/bin/bash","-c","/var/www/media-monitor/run.sh"]

EXPOSE 8090
