FROM gradle:8.9.0-jdk22 AS build
WORKDIR /build
COPY . .

RUN ./gradlew build --no-daemon -p .

FROM openjdk:22
WORKDIR /app
COPY --from=build /build/build/libs/VR-APP-SERVICE-1.0.0-SNAPSHOT.jar app.jar

ENTRYPOINT exec java $JAVA_OPTS -jar app.jar
