FROM livestream-base:v1.0.1

LABEL version="1.0.1"
LABEL description="Live Streaming Server"

RUN mkdir -p /var/log/live-streaming
WORKDIR /opt/live-streaming

COPY package.json package-lock.json .env ./
RUN npm install --production

COPY ./dist ./dist
COPY ./scripts ./scripts
RUN chmod a+x ./scripts/*.sh

COPY run.sh ./
RUN chmod a+x ./run.sh
RUN adduser root pulse-access
RUN sed -i '/; default-server/c\; default-server = /var/run/pulse/native' /etc/pulse/client.conf

# COPY pulse/pulseaudio.service /etc/systemd/system/pulseaudio.service
# RUN systemctl daemon-reload
# RUN systemctl --system enable pulseaudio

# Start Service
ENTRYPOINT ["/bin/bash","-c","/opt/live-streaming/run.sh"]

EXPOSE 8090
