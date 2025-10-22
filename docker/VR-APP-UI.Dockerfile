FROM node:20 AS build
WORKDIR /build
COPY . .

RUN yarn config set network-timeout 6000000 && yarn install
RUN yarn run build

FROM node:20
WORKDIR /app
COPY --from=build /build .

ENTRYPOINT exec yarn start
