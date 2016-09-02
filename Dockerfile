FROM mhart/alpine-node:6.5.0

WORKDIR /opt/central-ledger
COPY . /opt/central-ledger
RUN [ "npm", "install" ]

EXPOSE 3000
CMD npm run migrate && \
    npm start