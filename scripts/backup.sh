#!/bin/bash

# HalalCheck EU - Backup Script
# 
# Automated backup script for database and file storage

set -e

# Configuration
BACKUP_DIR="/backups"
LOG_FILE="/var/log/halalcheck/backup.log"
RETENTION_DAYS=30
AWS_S3_BUCKET="${AWS_S3_BUCKET:-halalcheck-prod-backups}"

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

# Load environment variables
load_env() {
    if [ -f ".env" ]; then
        source .env
    else
        error ".env file not found"
        exit 1
    fi
}

# Create backup directories
setup_directories() {
    log "Setting up backup directories..."
    
    mkdir -p "$BACKUP_DIR/database"
    mkdir -p "$BACKUP_DIR/files"
    mkdir -p "$BACKUP_DIR/logs"
    mkdir -p "/var/log/halalcheck"
    
    log "Backup directories created"
}

# Database backup
backup_database() {
    local timestamp=$(date +%Y%m%d-%H%M%S)
    local backup_file="$BACKUP_DIR/database/postgres-$timestamp.sql"
    
    log "Starting database backup..."
    
    # Create database dump
    docker exec halalcheck-postgres pg_dump \
        -U "$POSTGRES_USER" \
        -d "$POSTGRES_DB" \
        --no-password \
        --verbose \
        --create \
        --clean \
        --if-exists > "$backup_file"
    
    if [ $? -eq 0 ]; then
        log "Database backup created: $backup_file"
        
        # Compress backup
        gzip "$backup_file"
        backup_file="${backup_file}.gz"
        
        local size=$(du -h "$backup_file" | cut -f1)
        log "Database backup compressed: $backup_file ($size)"
        
        # Upload to S3 if configured
        if [ -n "$AWS_S3_BUCKET" ] && command -v aws &> /dev/null; then
            upload_to_s3 "$backup_file" "database/$(basename "$backup_file")"
        fi
        
        return 0
    else
        error "Database backup failed"
        return 1
    fi
}

# Redis backup
backup_redis() {
    local timestamp=$(date +%Y%m%d-%H%M%S)
    local backup_file="$BACKUP_DIR/database/redis-$timestamp.rdb"
    
    log "Starting Redis backup..."
    
    # Save Redis data
    docker exec halalcheck-redis redis-cli BGSAVE
    
    # Wait for background save to complete
    while [ "$(docker exec halalcheck-redis redis-cli LASTSAVE)" = "$(docker exec halalcheck-redis redis-cli LASTSAVE)" ]; do
        sleep 1
    done
    
    # Copy RDB file
    docker cp halalcheck-redis:/data/dump.rdb "$backup_file"
    
    if [ $? -eq 0 ]; then
        log "Redis backup created: $backup_file"
        
        # Compress backup
        gzip "$backup_file"
        backup_file="${backup_file}.gz"
        
        local size=$(du -h "$backup_file" | cut -f1)
        log "Redis backup compressed: $backup_file ($size)"
        
        # Upload to S3 if configured
        if [ -n "$AWS_S3_BUCKET" ] && command -v aws &> /dev/null; then
            upload_to_s3 "$backup_file" "redis/$(basename "$backup_file")"
        fi
        
        return 0
    else
        error "Redis backup failed"
        return 1
    fi
}

# File storage backup
backup_files() {
    local timestamp=$(date +%Y%m%d-%H%M%S)
    local backup_file="$BACKUP_DIR/files/uploads-$timestamp.tar.gz"
    
    log "Starting file storage backup..."
    
    # Check if uploads directory exists
    if docker exec halalcheck-backend test -d /app/uploads; then
        # Create tar archive of uploads
        docker exec halalcheck-backend tar -czf - /app/uploads > "$backup_file"
        
        if [ $? -eq 0 ]; then
            local size=$(du -h "$backup_file" | cut -f1)
            log "File storage backup created: $backup_file ($size)"
            
            # Upload to S3 if configured
            if [ -n "$AWS_S3_BUCKET" ] && command -v aws &> /dev/null; then
                upload_to_s3 "$backup_file" "files/$(basename "$backup_file")"
            fi
            
            return 0
        else
            error "File storage backup failed"
            return 1
        fi
    else
        warning "No uploads directory found, skipping file backup"
        return 0
    fi
}

# Log backup
backup_logs() {
    local timestamp=$(date +%Y%m%d-%H%M%S)
    local backup_file="$BACKUP_DIR/logs/application-logs-$timestamp.tar.gz"
    
    log "Starting log backup..."
    
    # Check if log directory exists
    if docker exec halalcheck-backend test -d /app/logs; then
        # Create tar archive of logs
        docker exec halalcheck-backend tar -czf - /app/logs > "$backup_file"
        
        if [ $? -eq 0 ]; then
            local size=$(du -h "$backup_file" | cut -f1)
            log "Log backup created: $backup_file ($size)"
            
            # Upload to S3 if configured
            if [ -n "$AWS_S3_BUCKET" ] && command -v aws &> /dev/null; then
                upload_to_s3 "$backup_file" "logs/$(basename "$backup_file")"
            fi
            
            return 0
        else
            error "Log backup failed"
            return 1
        fi
    else
        warning "No log directory found, skipping log backup"
        return 0
    fi
}

# Upload to S3
upload_to_s3() {
    local local_file=$1
    local s3_key=$2
    
    log "Uploading $local_file to S3..."
    
    aws s3 cp "$local_file" "s3://$AWS_S3_BUCKET/$s3_key" \
        --storage-class STANDARD_IA \
        --server-side-encryption AES256
    
    if [ $? -eq 0 ]; then
        log "Successfully uploaded to S3: s3://$AWS_S3_BUCKET/$s3_key"
    else
        error "Failed to upload to S3: $local_file"
    fi
}

# Clean old backups
cleanup_old_backups() {
    log "Cleaning up old backups..."
    
    # Clean local backups older than retention period
    find "$BACKUP_DIR" -name "*.gz" -mtime +$RETENTION_DAYS -delete
    
    # Clean S3 backups if configured
    if [ -n "$AWS_S3_BUCKET" ] && command -v aws &> /dev/null; then
        local cutoff_date=$(date -d "$RETENTION_DAYS days ago" +%Y-%m-%d)
        
        aws s3 ls "s3://$AWS_S3_BUCKET/" --recursive | \
        awk '$1 < "'$cutoff_date'" {print $4}' | \
        while read file; do
            aws s3 rm "s3://$AWS_S3_BUCKET/$file"
            log "Deleted old S3 backup: $file"
        done
    fi
    
    log "Cleanup completed"
}

# Health check
health_check() {
    log "Performing health check..."
    
    # Check database connectivity
    if docker exec halalcheck-postgres pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" &> /dev/null; then
        log "Database is healthy"
    else
        error "Database health check failed"
        return 1
    fi
    
    # Check Redis connectivity
    if docker exec halalcheck-redis redis-cli ping | grep -q PONG; then
        log "Redis is healthy"
    else
        error "Redis health check failed"
        return 1
    fi
    
    return 0
}

# Generate backup report
generate_report() {
    local timestamp=$(date +%Y%m%d-%H%M%S)
    local report_file="$BACKUP_DIR/backup-report-$timestamp.txt"
    
    log "Generating backup report..."
    
    {
        echo "HalalCheck EU Backup Report"
        echo "Generated: $(date)"
        echo "=========================================="
        echo ""
        echo "Backup Statistics:"
        
        # Database backup size
        local db_backup_size=$(find "$BACKUP_DIR/database" -name "postgres-*.gz" -mtime -1 -exec du -sh {} \; | head -1 | cut -f1)
        echo "Database backup: ${db_backup_size:-N/A}"
        
        # Redis backup size
        local redis_backup_size=$(find "$BACKUP_DIR/database" -name "redis-*.gz" -mtime -1 -exec du -sh {} \; | head -1 | cut -f1)
        echo "Redis backup: ${redis_backup_size:-N/A}"
        
        # File backup size
        local file_backup_size=$(find "$BACKUP_DIR/files" -name "uploads-*.gz" -mtime -1 -exec du -sh {} \; | head -1 | cut -f1)
        echo "File backup: ${file_backup_size:-N/A}"
        
        # Log backup size
        local log_backup_size=$(find "$BACKUP_DIR/logs" -name "application-logs-*.gz" -mtime -1 -exec du -sh {} \; | head -1 | cut -f1)
        echo "Log backup: ${log_backup_size:-N/A}"
        
        echo ""
        echo "Total backup size: $(du -sh "$BACKUP_DIR" | cut -f1)"
        echo "Available disk space: $(df -h "$BACKUP_DIR" | tail -1 | awk '{print $4}')"
        
        echo ""
        echo "Recent backups:"
        find "$BACKUP_DIR" -name "*.gz" -mtime -7 | sort
        
    } > "$report_file"
    
    log "Backup report generated: $report_file"
}

# Send notification
send_notification() {
    local status=$1
    local message=$2
    
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"💾 HalalCheck EU Backup $status: $message\"}" \
            "$SLACK_WEBHOOK_URL"
    fi
    
    if [ -n "$EMAIL_NOTIFICATION" ]; then
        echo "$message" | mail -s "HalalCheck EU Backup $status" "$EMAIL_NOTIFICATION"
    fi
}

# Main backup function
main() {
    log "Starting HalalCheck EU backup..."
    
    local start_time=$(date +%s)
    local success=true
    
    # Load environment
    load_env
    
    # Setup directories
    setup_directories
    
    # Health check
    if ! health_check; then
        error "Health check failed, aborting backup"
        send_notification "FAILED" "Backup failed due to health check failure"
        exit 1
    fi
    
    # Perform backups
    if ! backup_database; then
        error "Database backup failed"
        success=false
    fi
    
    if ! backup_redis; then
        error "Redis backup failed"
        success=false
    fi
    
    if ! backup_files; then
        error "File backup failed"
        success=false
    fi
    
    if ! backup_logs; then
        error "Log backup failed"
        success=false
    fi
    
    # Cleanup old backups
    cleanup_old_backups
    
    # Generate report
    generate_report
    
    # Calculate duration
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    if [ "$success" = true ]; then
        log "Backup completed successfully in ${duration}s"
        send_notification "SUCCESS" "All backups completed successfully in ${duration}s"
    else
        error "Some backups failed, check logs for details"
        send_notification "PARTIAL_FAILURE" "Some backups failed, check logs for details"
        exit 1
    fi
}

# Parse command line arguments
case "${1:-backup}" in
    backup)
        main
        ;;
    database)
        load_env
        setup_directories
        backup_database
        ;;
    redis)
        load_env
        setup_directories
        backup_redis
        ;;
    files)
        load_env
        setup_directories
        backup_files
        ;;
    logs)
        load_env
        setup_directories
        backup_logs
        ;;
    cleanup)
        load_env
        cleanup_old_backups
        ;;
    report)
        load_env
        generate_report
        ;;
    *)
        echo "Usage: $0 {backup|database|redis|files|logs|cleanup|report}"
        exit 1
        ;;
esac