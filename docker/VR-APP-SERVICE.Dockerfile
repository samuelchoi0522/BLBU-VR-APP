FROM gradle:8.9.0-jdk22 AS build
WORKDIR /build
COPY . .
WORKDIR /build/BLBU_VR_APP_SERVICE
RUN chmod +x gradlew && ./gradlew clean build --no-daemon

FROM openjdk:22
WORKDIR /app
COPY --from=build /build/BLBU_VR_APP_SERVICE/build/libs/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]

