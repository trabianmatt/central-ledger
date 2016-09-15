FROM mhart/alpine-node:6.5.0

ENV FUNC_TEST_CMD error

ADD . /opt/functional
WORKDIR /opt/functional

RUN npm install

RUN chmod +x start.sh
CMD ./start.sh
