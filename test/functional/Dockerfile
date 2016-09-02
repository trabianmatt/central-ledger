FROM mhart/alpine-node:6.5.0

WORKDIR /opt/functional
COPY . /opt/functional
RUN [ "npm", "install" ]

CMD [ "npm", "test" ]