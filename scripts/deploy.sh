#!/bin/bash

# HalalCheck EU - Production Deployment Script
# 
# This script handles deployment to production with zero-downtime updates

set -e

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
BACKUP_DIR="/backups"
LOG_FILE="/var/log/halalcheck/deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a "$LOG_FILE"
}

# Check if running as root
check_permissions() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root"
        exit 1
    fi
}

# Validate environment
validate_environment() {
    log "Validating environment..."
    
    # Check if Docker is running
    if ! docker info &> /dev/null; then
        error "Docker is not running"
        exit 1
    fi
    
    # Check if docker-compose is available
    if ! command -v docker-compose &> /dev/null; then
        error "docker-compose is not installed"
        exit 1
    fi
    
    # Check if compose file exists
    if [ ! -f "$COMPOSE_FILE" ]; then
        error "Compose file $COMPOSE_FILE not found"
        exit 1
    fi
    
    # Check if .env file exists
    if [ ! -f ".env" ]; then
        error ".env file not found"
        exit 1
    fi
    
    log "Environment validation passed"
}

# Create backup
create_backup() {
    log "Creating database backup..."
    
    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"
    
    # Generate backup filename
    BACKUP_FILE="$BACKUP_DIR/halalcheck-backup-$(date +%Y%m%d-%H%M%S).sql"
    
    # Create database backup
    docker exec halalcheck-postgres pg_dump -U "${POSTGRES_USER}" "${POSTGRES_DB}" > "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        log "Database backup created: $BACKUP_FILE"
        
        # Compress backup
        gzip "$BACKUP_FILE"
        log "Backup compressed: ${BACKUP_FILE}.gz"
        
        # Clean old backups (keep last 10)
        cd "$BACKUP_DIR"
        ls -t halalcheck-backup-*.sql.gz | tail -n +11 | xargs -r rm
        log "Old backups cleaned"
    else
        error "Failed to create database backup"
        exit 1
    fi
}

# Pull latest images
pull_images() {
    log "Pulling latest Docker images..."
    
    docker-compose -f "$COMPOSE_FILE" pull
    
    if [ $? -eq 0 ]; then
        log "Images pulled successfully"
    else
        error "Failed to pull images"
        exit 1
    fi
}

# Health check function
health_check() {
    local service_url=$1
    local max_attempts=30
    local attempt=1
    
    log "Performing health check for $service_url"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$service_url/health" > /dev/null; then
            log "Health check passed for $service_url"
            return 0
        fi
        
        log "Health check attempt $attempt/$max_attempts failed, retrying in 5 seconds..."
        sleep 5
        ((attempt++))
    done
    
    error "Health check failed for $service_url"
    return 1
}

# Zero-downtime deployment
deploy_services() {
    log "Starting zero-downtime deployment..."
    
    # Update backend first
    log "Updating backend service..."
    docker-compose -f "$COMPOSE_FILE" up -d --no-deps backend
    
    # Wait for backend to be healthy
    sleep 30
    if ! health_check "https://api.halalcheck.eu"; then
        error "Backend deployment failed"
        rollback
        exit 1
    fi
    
    # Update frontend
    log "Updating frontend service..."
    docker-compose -f "$COMPOSE_FILE" up -d --no-deps frontend
    
    # Wait for frontend to be healthy
    sleep 30
    if ! health_check "https://halalcheck.eu"; then
        error "Frontend deployment failed"
        rollback
        exit 1
    fi
    
    # Update supporting services
    log "Updating supporting services..."
    docker-compose -f "$COMPOSE_FILE" up -d
    
    log "Deployment completed successfully"
}

# Rollback function
rollback() {
    warning "Initiating rollback..."
    
    # Get the previous image tags from backup
    BACKUP_COMPOSE="docker-compose.prod.yml.backup"
    
    if [ -f "$BACKUP_COMPOSE" ]; then
        log "Rolling back using backup compose file..."
        docker-compose -f "$BACKUP_COMPOSE" up -d
        
        # Restore database if backup exists
        LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/halalcheck-backup-*.sql.gz | head -1)
        if [ -n "$LATEST_BACKUP" ]; then
            log "Restoring database from $LATEST_BACKUP"
            gunzip -c "$LATEST_BACKUP" | docker exec -i halalcheck-postgres psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}"
        fi
        
        log "Rollback completed"
    else
        error "No backup compose file found, cannot rollback"
    fi
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    docker exec halalcheck-backend npm run migrate:up
    
    if [ $? -eq 0 ]; then
        log "Migrations completed successfully"
    else
        error "Migrations failed"
        rollback
        exit 1
    fi
}

# Clean up old Docker resources
cleanup() {
    log "Cleaning up old Docker resources..."
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused volumes
    docker volume prune -f
    
    # Remove unused networks
    docker network prune -f
    
    log "Cleanup completed"
}

# Send notification
send_notification() {
    local status=$1
    local message=$2
    
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚀 HalalCheck EU Deployment $status: $message\"}" \
            "$SLACK_WEBHOOK_URL"
    fi
    
    if [ -n "$EMAIL_NOTIFICATION" ]; then
        echo "$message" | mail -s "HalalCheck EU Deployment $status" "$EMAIL_NOTIFICATION"
    fi
}

# Main deployment function
main() {
    log "Starting HalalCheck EU deployment..."
    
    # Backup current compose file
    cp "$COMPOSE_FILE" "${COMPOSE_FILE}.backup"
    
    # Load environment variables
    source .env
    
    # Validate environment
    validate_environment
    
    # Create backup
    create_backup
    
    # Pull latest images
    pull_images
    
    # Deploy services
    deploy_services
    
    # Run migrations
    run_migrations
    
    # Final health checks
    log "Performing final health checks..."
    if health_check "https://halalcheck.eu" && health_check "https://api.halalcheck.eu"; then
        log "All health checks passed"
    else
        error "Final health checks failed"
        rollback
        exit 1
    fi
    
    # Cleanup
    cleanup
    
    # Send success notification
    send_notification "SUCCESS" "Deployment completed successfully at $(date)"
    
    log "Deployment completed successfully!"
}

# Trap to handle script interruption
trap 'error "Deployment interrupted"; rollback; exit 1' INT TERM

# Parse command line arguments
case "${1:-deploy}" in
    deploy)
        check_permissions
        main
        ;;
    rollback)
        check_permissions
        rollback
        ;;
    health)
        health_check "https://halalcheck.eu"
        health_check "https://api.halalcheck.eu"
        ;;
    backup)
        source .env
        create_backup
        ;;
    cleanup)
        cleanup
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|health|backup|cleanup}"
        exit 1
        ;;
esac