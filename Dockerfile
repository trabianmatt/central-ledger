FROM mhart/alpine-node:6.5.0

WORKDIR /opt/central-ledger
COPY . /opt/central-ledger

RUN apk add --no-cache make gcc g++ python && \
  npm install --production && \
  npm uninstall -g npm

EXPOSE 3000
CMD node src/server.js
