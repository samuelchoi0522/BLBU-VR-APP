FROM gradle:8.9.0-jdk22 AS build
WORKDIR /build
COPY . .
RUN chmod +x gradlew && ./gradlew clean build --no-daemon

FROM openjdk:22
WORKDIR /app
COPY --from=build /build/build/libs/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]

