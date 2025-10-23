FROM node:20 AS build
WORKDIR /build
COPY . .

ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

RUN echo "Building with NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}"

RUN yarn config set network-timeout 6000000 && yarn install
RUN yarn run build

FROM node:20
WORKDIR /app
COPY --from=build /build .

ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

ENTRYPOINT exec yarn start
