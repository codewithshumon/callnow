# VoiceSeek — Database Backups & Restore Guide

This directory contains full database backups and automated scripts to backup or restore the VoiceSeek PostgreSQL database.

---

## Files in this Directory

| File | Description |
| :--- | :--- |
| `voiceseek_backup.sql` | Plain-text SQL dump containing schema, constraints, sequences, and all data. |
| `voiceseek_backup.dump` | PostgreSQL custom binary format dump (for `pg_restore`). |
| `restore.sh` | One-command restore script that restores onto `voiceseek` or an empty database. |
| `backup.sh` | One-command backup script that refreshes both `.sql` and `.dump` files. |

---

## What is Included in the Backup

* **Users & Credentials**: All accounts (including `shumon@acoscale.com` and `admin@voiceseek.com`).
* **Subscription Plans**: Free, Pro, and Business tiers.
* **Phone Numbers**: Configured lines (including Dallas line `+14696388176`).
* **Call Detail Records (CDRs)**: Full call history, durations, costs, and statuses.
* **Conversations & Messages**: All synced SMS threads and incoming/outgoing message history.
* **All Schema Tables**: Full 22 database tables, indices, triggers, and foreign key relations.

---

## How to Restore onto an Empty Database

To restore to the default `voiceseek` database:
```bash
cd /mnt/D/callnow/database
chmod +x restore.sh
./restore.sh
```

To restore onto a brand-new, empty database (e.g., `voiceseek_new`):
```bash
./restore.sh voiceseek_new
```

### Manual Restore (Alternative Commands):

**Using SQL Dump:**
```bash
docker exec -i voiceseek-postgres psql -U postgres -d voiceseek < voiceseek_backup.sql
```

**Using Binary Dump:**
```bash
docker exec -i voiceseek-postgres pg_restore -U postgres -d voiceseek --clean --if-exists < voiceseek_backup.dump
```

---

## How to Take a New Backup Anytime

```bash
cd /mnt/D/callnow/database
chmod +x backup.sh
./backup.sh
```
