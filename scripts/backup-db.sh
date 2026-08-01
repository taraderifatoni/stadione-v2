#!/bin/bash
BACKUP_DIR=/opt/backups
mkdir -p $BACKUP_DIR
docker exec supabase-db-zurmq2lrm9hj510fmnj1seqr pg_dump -U supabase_admin postgres | gzip > $BACKUP_DIR/db-$(date +%F-%H%M).sql.gz
find $BACKUP_DIR -name "db-*.sql.gz" -mtime +14 -delete
echo "$(date): Backup complete" >> /var/log/stadione-backup.log
