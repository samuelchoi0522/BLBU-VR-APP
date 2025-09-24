FROM node:20 AS build
WORKDIR /build
COPY . .

RUN yarn install
RUN yarn run build

FROM node:20
WORKDIR /app
COPY --from=build /build .

ENTRYPOINT exec yarn start