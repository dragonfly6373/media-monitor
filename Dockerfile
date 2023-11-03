FROM node:18 as builder

RUN mkdir /app
WORKDIR /app
ADD . .

RUN npm install -y
# RUN npm run build
RUN npm run build:prod

# FROM ./Dockerfile.base
FROM livestream-base:v1.0.1

LABEL version="1.0.1"
LABEL description="Live Streaming Server"

RUN mkdir -p /var/log/live-streaming
RUN mkdir -p /opt/live-streaming/dist
WORKDIR /opt/live-streaming
COPY --from=builder /app/package.json ./
COPY --from=builder /app/.env ./
RUN npm install --production -y
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/scripts ./scripts
RUN chmod a+x ./scripts/*.sh
COPY --from=builder /app/run.sh ./
RUN chmod a+x ./run.sh
RUN adduser root pulse-access
RUN sed -i '/; default-server/c\; default-server = /var/run/pulse/native' /etc/pulse/client.conf

# COPY pulse/pulseaudio.service /etc/systemd/system/pulseaudio.service
# RUN systemctl daemon-reload
# RUN systemctl --system enable pulseaudio

# Start Service
ENTRYPOINT ["/bin/bash","-c","/opt/live-streaming/run.sh"]

EXPOSE 8090
