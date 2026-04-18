#!/bin/bash

# Jenkins Setup Script for Status Overview
# This script helps set up and manage Jenkins for bulk deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    print_status "Checking Docker..."
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_success "Docker is running"
}

# Function to check if ports are available
check_ports() {
    print_status "Checking if required ports are available..."
    
    # Check port 8082 (Jenkins)
    if lsof -Pi :8082 -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "Port 8082 is already in use. Jenkins might already be running or another service is using this port."
        read -p "Do you want to continue anyway? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        print_success "Port 8082 is available"
    fi
}

# Function to setup Jenkins
setup_jenkins() {
    print_status "Setting up Jenkins..."
    
    # Create jenkins directory if it doesn't exist
    if [ ! -d "jenkins" ]; then
        mkdir -p jenkins/init.groovy.d
        print_status "Created jenkins directory structure"
    fi
    
    # Start Jenkins
    print_status "Starting Jenkins with Docker Compose..."
    docker compose up -d jenkins
    
    print_status "Waiting for Jenkins to start..."
    
    # Wait for Jenkins to be ready
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f http://localhost:8082/login >/dev/null 2>&1; then
            break
        fi
        print_status "Attempt $attempt/$max_attempts: Waiting for Jenkins to be ready..."
        sleep 10
        ((attempt++))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        print_error "Jenkins failed to start within the expected time"
        print_status "Checking Jenkins logs..."
        docker compose logs --tail=20 jenkins
        exit 1
    fi
    
    print_success "Jenkins is running at http://localhost:8082"
}

# Function to verify Jenkins setup
verify_jenkins() {
    print_status "Verifying Jenkins setup..."
    
    # Check if Jenkins is responding
    if ! curl -s -f http://localhost:8082/api/json >/dev/null 2>&1; then
        print_error "Jenkins API is not responding"
        return 1
    fi
    
    # Check if bulk deployment job exists
    if curl -s -u admin:admin123 "http://localhost:8082/job/bulk-deployment-job/api/json" | grep -q "bulk-deployment-job"; then
        print_success "Bulk deployment job is configured"
    else
        print_warning "Bulk deployment job not found. It should be created automatically during startup."
    fi
    
    print_success "Jenkins verification completed"
}

# Function to show Jenkins information
show_info() {
    echo
    echo "==============================================="
    echo "           JENKINS SETUP COMPLETE"
    echo "==============================================="
    echo
    echo "Jenkins URL: http://localhost:8082"
    echo "Username: admin"
    echo "Password: admin123"
    echo
    echo "Job: bulk-deployment-job"
    echo "API Endpoint: http://localhost:8082/job/bulk-deployment-job"
    echo
    echo "To test the setup:"
    echo "1. Open http://localhost:8082 in your browser"
    echo "2. Login with admin/admin123"
    echo "3. Navigate to 'bulk-deployment-job'"
    echo "4. Click 'Build with Parameters' to test"
    echo
    echo "To view logs:"
    echo "  docker compose logs -f jenkins"
    echo
    echo "To stop Jenkins:"
    echo "  docker compose stop jenkins"
    echo
    echo "To restart Jenkins:"
    echo "  docker compose restart jenkins"
    echo
    echo "==============================================="
}

# Function to test Jenkins API
test_api() {
    print_status "Testing Jenkins API..."
    
    local response=$(curl -s -u admin:admin123 "http://localhost:8082/api/json" || echo "")
    
    if echo "$response" | grep -q "Jenkins"; then
        print_success "Jenkins API is working"
    else
        print_error "Jenkins API test failed"
        return 1
    fi
    
    # Test job API
    local job_response=$(curl -s -u admin:admin123 "http://localhost:8082/job/bulk-deployment-job/api/json" || echo "")
    
    if echo "$job_response" | grep -q "bulk-deployment-job"; then
        print_success "Bulk deployment job API is working"
    else
        print_warning "Bulk deployment job API test failed - job might not be created yet"
    fi
}

# Function to show logs
show_logs() {
    print_status "Showing Jenkins logs (Ctrl+C to exit)..."
    docker compose logs -f jenkins
}

# Function to stop Jenkins
stop_jenkins() {
    print_status "Stopping Jenkins..."
    docker compose stop jenkins
    print_success "Jenkins stopped"
}

# Function to restart Jenkins
restart_jenkins() {
    print_status "Restarting Jenkins..."
    docker compose restart jenkins
    print_success "Jenkins restarted"
}

# Function to reset Jenkins (remove all data)
reset_jenkins() {
    print_warning "This will remove all Jenkins data including jobs, builds, and configuration."
    read -p "Are you sure you want to reset Jenkins? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Reset cancelled"
        return
    fi
    
    print_status "Stopping Jenkins..."
    docker compose stop jenkins
    
    print_status "Removing Jenkins volume..."
    docker volume rm statusoverview_jenkins_home || true
    
    print_status "Starting fresh Jenkins..."
    docker compose up -d jenkins
    
    print_success "Jenkins has been reset"
}

# Function to backup Jenkins
backup_jenkins() {
    local backup_file="jenkins-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
    
    print_status "Creating Jenkins backup: $backup_file"
    
    docker run --rm \
        -v statusoverview_jenkins_home:/data \
        -v "$(pwd):/backup" \
        alpine tar czf "/backup/$backup_file" -C /data .
    
    print_success "Backup created: $backup_file"
}

# Function to restore Jenkins
restore_jenkins() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        print_error "Please specify backup file: $0 restore <backup-file>"
        exit 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        print_error "Backup file not found: $backup_file"
        exit 1
    fi
    
    print_warning "This will replace all current Jenkins data."
    read -p "Are you sure you want to restore from backup? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Restore cancelled"
        return
    fi
    
    print_status "Stopping Jenkins..."
    docker compose stop jenkins
    
    print_status "Restoring from backup: $backup_file"
    docker run --rm \
        -v statusoverview_jenkins_home:/data \
        -v "$(pwd):/backup" \
        alpine tar xzf "/backup/$backup_file" -C /data
    
    print_status "Starting Jenkins..."
    docker compose up -d jenkins
    
    print_success "Jenkins restored from backup"
}

# Main script logic
case "${1:-setup}" in
    "setup")
        print_status "Starting Jenkins setup for Status Overview..."
        check_docker
        check_ports
        setup_jenkins
        sleep 5
        verify_jenkins
        test_api
        show_info
        ;;
    "verify")
        verify_jenkins
        test_api
        ;;
    "logs")
        show_logs
        ;;
    "stop")
        stop_jenkins
        ;;
    "restart")
        restart_jenkins
        ;;
    "reset")
        reset_jenkins
        ;;
    "backup")
        backup_jenkins
        ;;
    "restore")
        restore_jenkins "$2"
        ;;
    "info")
        show_info
        ;;
    "test")
        test_api
        ;;
    "help"|"--help"|"-h")
        echo "Jenkins Setup Script for Status Overview"
        echo
        echo "Usage: $0 [command]"
        echo
        echo "Commands:"
        echo "  setup     - Setup and start Jenkins (default)"
        echo "  verify    - Verify Jenkins configuration"
        echo "  logs      - Show Jenkins logs"
        echo "  stop      - Stop Jenkins"
        echo "  restart   - Restart Jenkins"
        echo "  reset     - Reset Jenkins (removes all data)"
        echo "  backup    - Create Jenkins backup"
        echo "  restore   - Restore from backup"
        echo "  info      - Show Jenkins information"
        echo "  test      - Test Jenkins API"
        echo "  help      - Show this help"
        echo
        echo "Examples:"
        echo "  $0                    # Setup Jenkins"
        echo "  $0 logs              # View logs"
        echo "  $0 backup            # Create backup"
        echo "  $0 restore backup.tar.gz  # Restore backup"
        ;;
    *)
        print_error "Unknown command: $1"
        print_status "Use '$0 help' for available commands"
        exit 1
        ;;
esac
