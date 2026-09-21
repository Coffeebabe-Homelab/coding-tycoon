FROM maven:3.9.11-eclipse-temurin-25 AS build

WORKDIR /workspace/backend

COPY backend/.mvn .mvn
COPY backend/mvnw backend/pom.xml ./
RUN ./mvnw -B -DskipTests dependency:go-offline

COPY backend/src src
RUN ./mvnw -B -DskipTests package

FROM eclipse-temurin:25-jre-alpine

WORKDIR /app

COPY --from=build /workspace/backend/target/quarkus-app/lib/ lib/
COPY --from=build /workspace/backend/target/quarkus-app/*.jar ./
COPY --from=build /workspace/backend/target/quarkus-app/app/ app/
COPY --from=build /workspace/backend/target/quarkus-app/quarkus/ quarkus/

EXPOSE 8080

ENV JAVA_OPTS_APPEND="-Dquarkus.http.host=0.0.0.0 -Djava.util.logging.manager=org.jboss.logmanager.LogManager"

CMD ["sh", "-c", "java $JAVA_OPTS_APPEND -jar quarkus-run.jar"]
