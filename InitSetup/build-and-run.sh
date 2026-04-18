#!/bin/bash

# Exit on error
set -e

echo "Starting build and run process..."

echo "1. Building Frontend..."
cd frontend || exit 1
pnpm install
pnpm build

echo "2. Copying Frontend Build to Backend..."
cd ../backend
cp -r ../frontend/dist/statusoverview/* src/main/resources/static/

echo "3. Building Backend..."
./gradlew clean build

echo "4. Running Spring Boot Application..."
./gradlew bootRun
