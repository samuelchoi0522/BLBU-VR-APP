FROM gradle:8.9.0-jdk22 AS build
WORKDIR /build
COPY . .
RUN chmod +x gradlew && ./gradlew clean build --no-daemon

FROM eclipse-temurin:22-jdk
WORKDIR /app
COPY --from=build /build/build/libs/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]

