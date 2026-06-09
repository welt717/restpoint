#!/bin/bash

# ============================================
# Production Deployment Script
# ============================================
# This script deploys the application to production
# Usage: ./scripts/deploy.sh [options]
#
# Options:
#   --build     Force rebuild of all Docker images
#   --no-cache  Build without using cache
#   --help      Show this help message
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
FORCE_BUILD=false
NO_CACHE=false
COMPOSE_FILE="docker-compose.prod.yml"

# Parse arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --build) FORCE_BUILD=true ;;
        --no-cache) NO_CACHE=true ;;
        --help) 
            echo "Production Deployment Script"
            echo ""
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --build     Force rebuild of all Docker images"
            echo "  --no-cache  Build without using cache"
            echo "  --help      Show this help message"
            exit 0
            ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

# Functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    print_success "Docker is installed"
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    print_success "Docker Compose is installed"
    
    if [ ! -f "$COMPOSE_FILE" ]; then
        print_error "Compose file not found: $COMPOSE_FILE"
        exit 1
    fi
    print_success "Compose file found: $COMPOSE_FILE"
    
    if [ ! -f ".env.production" ]; then
        print_warning ".env.production not found. Using default values."
    else
        print_success ".env.production found"
    fi
}

# Stop existing containers
stop_containers() {
    print_header "Stopping Existing Containers"
    
    docker-compose -f "$COMPOSE_FILE" down 2>/dev/null || true
    print_success "Containers stopped"
}

# Build images
build_images() {
    print_header "Building Docker Images"
    
    if [ "$FORCE_BUILD" = true ]; then
        print_warning "Force rebuild enabled"
        
        if [ "$NO_CACHE" = true ]; then
            print_warning "Building without cache"
            docker-compose -f "$COMPOSE_FILE" build --no-cache
        else
            docker-compose -f "$COMPOSE_FILE" build
        fi
    else
        print_success "Using existing images (use --build to force rebuild)"
    fi
}

# Run migrations
run_migrations() {
    print_header "Running Database Migrations"
    
    # Start only the migration service
    docker-compose -f "$COMPOSE_FILE" up migrate
    
    print_success "Migrations completed"
}

# Start services
start_services() {
    print_header "Starting Services"
    
    docker-compose -f "$COMPOSE_FILE" up -d
    
    print_success "Services started"
}

# Health check
health_check() {
    print_header "Running Health Checks"
    
    local services=("api-gateway:8000" "auth-service:8001" "tenant-service:8002")
    local all_healthy=true
    
    for service in "${services[@]}"; do
        local name="${service%%:*}"
        local port="${service##*:}"
        
        echo -n "Checking $name..."
        
        local retries=30
        local wait=2
        
        for ((i=1; i<=$retries; i++)); do
            if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port/health" | grep -q "200"; then
                print_success "$name is healthy"
                all_healthy=true
                break
            fi
            
            if [ $i -eq $retries ]; then
                print_error "$name is not healthy"
                all_healthy=false
            else
                sleep $wait
            fi
        done
    done
    
    if [ "$all_healthy" = false ]; then
        print_error "Some services are not healthy"
        return 1
    fi
    
    print_success "All services are healthy"
}

# Show status
show_status() {
    print_header "Deployment Status"
    
    docker-compose -f "$COMPOSE_FILE" ps
}

# Main deployment function
main() {
    print_header "Starting Production Deployment"
    
    check_prerequisites
    stop_containers
    build_images
    run_migrations
    start_services
    
    sleep 5
    
    health_check
    show_status
    
    print_header "Deployment Complete!"
    echo -e "${GREEN}Your application is now running in production.${NC}"
    echo ""
    echo -e "API Gateway: ${BLUE}http://localhost:8000${NC}"
    echo -e "Auth Service: ${BLUE}http://localhost:8001${NC}"
    echo -e "Tenant Service: ${BLUE}http://localhost:8002${NC}"
    echo ""
    echo -e "To view logs: ${YELLOW}docker-compose -f $COMPOSE_FILE logs -f${NC}"
    echo -e "To stop: ${YELLOW}docker-compose -f $COMPOSE_FILE down${NC}"
}

# Run main function
main