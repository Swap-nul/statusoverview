# PowerShell script to build and run the application

Write-Host "Starting build and run process..."

# Navigate to frontend directory
Write-Host "1. Building Frontend..."

# Install dependencies and build frontend
pnpm install
pnpm build

# Navigate to backend directory
Write-Host "2. Copying Frontend Build to Backend..."


# Copy frontend build to backend resources
Copy-Item -Path "dist\statusoverview\*" -Destination "backend\src\main\resources\static" -Recurse -Force

Set-Location -Path "backend"
Write-Host "3. Building Backend..."
gradle clean build

Write-Host "4. Running Spring Boot Application..."
gradle bootRun

Set-Location -Path ".."