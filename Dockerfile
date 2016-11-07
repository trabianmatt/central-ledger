FROM mhart/alpine-node:6.5.0

WORKDIR /opt/central-ledger
COPY src /opt/central-ledger/src
COPY migrations /opt/central-ledger/migrations
COPY config /opt/central-ledger/config
COPY node_modules /opt/central-ledger/node_modules
COPY package.json /opt/central-ledger/package.json

RUN npm prune --production && \
  npm uninstall -g npm

EXPOSE 3000
CMD node src/server.js
