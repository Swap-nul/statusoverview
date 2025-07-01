# StatusOverview Backend

This is the Spring Boot backend for the StatusOverview application.

## Project Setup

1. Build the project:
```bash
./gradlew build
```

2. Run the application:
```bash
./gradlew bootRun
```

3. Build Docker image:
```bash
docker build -t statusoverview-backend .
```

## Configuration

The application is configured to:
- Run on port 8080
- Connect to PostgreSQL database on localhost:5432
- Serve frontend Angular application from /frontend directory

## Dependencies

- Spring Boot 3.2.0
- Spring Web
- Spring Data JPA
- PostgreSQL Driver
- Thymeleaf (for frontend integration)
