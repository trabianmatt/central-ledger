FROM mhart/alpine-node:6.2.1

WORKDIR /opt/e2e
COPY . /opt/e2e
RUN [ "npm", "install" ]

CMD [ "npm", "test" ]