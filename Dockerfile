FROM mhart/alpine-node:6.5.0

WORKDIR /opt/central-ledger
COPY . /opt/central-ledger
RUN cd $(npm root -g)/npm \
    && npm install fs-extra \
    && sed -i -e s/graceful-fs/fs-extra/ -e s/fs.rename/fs.move/ ./lib/utils/rename.js \
    && cd /opt/central-ledger \
    && npm install --production

EXPOSE 3000
CMD npm run migrate && \
    npm start
