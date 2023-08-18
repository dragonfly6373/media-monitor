# Use ubuntu 20.04 as the base image
# FROM ubuntu:20.04

# LABEL version="1.0.1"
# LABEL description="Media Monitor"

# # Update the package list and install curl gnupg xvfb and ffmpeg
# RUN apt-get update --fix-missing && apt-get -y upgrade \
#     && apt-get install -y wget curl gnupg \
#     && apt-get install -y ffmpeg xvfb
# # && apt-get clean \
# # && rm -rf /var/lib/apt/lists/* /var/cache/* /var/log/*

# # Add the google-chrome repository and install
# RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
#     && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
#     && apt-get update \
#     && apt-get install -y google-chrome-unstable --no-install-recommends \
#     && rm -rf /var/lib/apt/lists/* \
#     && rm -rf /src/*.deb

# # Add the node js 18.x repository and install
# RUN curl -sL https://deb.nodesource.com/setup_18.x | bash -
# RUN apt-get install -y nodejs

FROM nguyendang2022/livestream-base:v1.0.1

WORKDIR /var/www/media-monitor

COPY package.json package-lock.json .env ./
RUN npm install --production

COPY ./dist ./dist

# Start Service
# CMD npm run start:prod
COPY run.sh ./
RUN chmod a+x ./run.sh
ENTRYPOINT ["/bin/bash","-c","/var/www/media-monitor/run.sh"]

EXPOSE 8090
