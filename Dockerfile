FROM mhart/alpine-node:6.2.1

WORKDIR /opt/central-ledger
COPY . /opt/central-ledger
RUN [ "npm", "install" ]

EXPOSE 3000
CMD npm run migrate && \
    npm start