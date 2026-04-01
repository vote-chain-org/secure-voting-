FROM eclipse-temurin:17-jdk-alpine

WORKDIR /app

COPY backend ./backend

WORKDIR /app/backend

RUN chmod +x mvnw
RUN ./mvnw clean package -DskipTests

EXPOSE 8080

<<<<<<< HEAD
CMD ["java", "-jar", "target/backend-0.0.1-SNAPSHOT.jar"]
=======
CMD ["java", "-jar", "target/backend-0.0.1-SNAPSHOT.jar"]
>>>>>>> 7a141aae50d6663ae55d48d9d80f64111da2d638
