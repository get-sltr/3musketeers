# TheHive Security Platform Setup

## Overview

TheHive is an open-source Security Incident Response Platform (SIRP) integrated with SLTR for security monitoring and incident management.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SLTR Security Stack                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   TheHive    │◄──►│    Cortex    │◄──►│ Elasticsearch│  │
│  │   :9000      │    │    :9001     │    │    :9200     │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                                       ▲           │
│         ▼                                       │           │
│  ┌──────────────┐                              │           │
│  │  Cassandra   │──────────────────────────────┘           │
│  │    :9042     │                                          │
│  └──────────────┘                                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Services

| Service       | Port | Description                           |
|---------------|------|---------------------------------------|
| TheHive       | 9000 | Main incident response platform       |
| Cortex        | 9001 | Automated analysis engine             |
| Elasticsearch | 9200 | Search and indexing                   |
| Cassandra     | 9042 | Graph database for case data          |

## Quick Start

### 1. Start the Security Stack

```bash
# Start all services (first run takes ~5-10 minutes for Cassandra)
docker-compose up -d elasticsearch cassandra

# Wait for Cassandra to be healthy (check with)
docker-compose logs -f cassandra

# Once Cassandra shows "Starting listening for CQL clients"
docker-compose up -d thehive cortex
```

### 2. Initial Setup

1. **Access TheHive**: http://localhost:9000
2. **Default login**:
   - Username: `admin@thehive.local`
   - Password: `secret` (CHANGE THIS IMMEDIATELY)

3. **First-time setup wizard** will guide you through:
   - Creating an organization
   - Setting up admin user
   - Configuring Cortex connection

### 3. Using Your Keychain Credentials

Those credentials stored in macOS Keychain are TheHive API credentials:

```
Organization ID: 2baef15b-b8de-423f-9d8a-46f3686d8848
API Key:         b16f28af-e873-46a9-9e44-b807e49137a1.2baef15b-b8de...
```

To retrieve and use them:

```bash
# View the stored credentials
security find-generic-password -a "b16f28af-e873-46a9-9e44-b807e49137a1.2baef15b-b8de-423f-9d8a-46f3686d8848" -w

# Or through Keychain Access app:
# 1. Open Keychain Access
# 2. Search for "2baef15b-b8de-423f-9d8a-46f3686d8848"
# 3. Double-click > Show password
```

**Use in API calls:**
```bash
# Example: List cases in TheHive
curl -H "Authorization: Bearer YOUR_API_KEY_HERE" \
     http://localhost:9000/api/v1/case
```

### 4. Configure Cortex Connection

1. Access Cortex: http://localhost:9001
2. Create an organization
3. Create an API key for TheHive integration
4. Update `thehive/application.conf`:
   ```
   cortex.servers[0].auth.key = "your-cortex-api-key"
   ```
5. Restart TheHive: `docker-compose restart thehive`

## Environment Variables

Add to `.env.local`:

```bash
# TheHive Security Platform
THEHIVE_URL=http://localhost:9000
THEHIVE_API_KEY=your-thehive-api-key
THEHIVE_ORG_ID=2baef15b-b8de-423f-9d8a-46f3686d8848

# Cortex Analysis Engine
CORTEX_URL=http://localhost:9001
CORTEX_API_KEY=your-cortex-api-key
```

## Integration with SLTR

### Automatic Incident Creation

TheHive can receive security events from SLTR:

```typescript
// Example: Report security incident
async function reportIncident(event: SecurityEvent) {
  const response = await fetch(`${process.env.THEHIVE_URL}/api/v1/case`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.THEHIVE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: event.title,
      description: event.description,
      severity: event.severity,  // 1-4
      tlp: 2,  // Traffic Light Protocol
      tags: ['sltr', 'automated']
    })
  })
  return response.json()
}
```

### Security Events to Track

| Event Type          | Severity | Auto-create Case |
|---------------------|----------|------------------|
| Multiple failed logins | 2     | Yes              |
| Account lockout     | 2        | Yes              |
| Suspicious IP       | 3        | Yes              |
| Data export attempt | 3        | Yes              |
| Admin action        | 1        | No (log only)    |
| User report         | 2        | Yes              |

## Maintenance

### Backup

```bash
# Backup TheHive data
docker-compose exec cassandra cqlsh -e "DESCRIBE KEYSPACE thehive" > backup/thehive-schema.cql
docker-compose exec cassandra nodetool snapshot thehive

# Backup Elasticsearch
curl -X PUT "localhost:9200/_snapshot/backup/snapshot_$(date +%Y%m%d)"
```

### Update

```bash
# Pull latest images
docker-compose pull thehive cortex elasticsearch cassandra

# Restart with new images
docker-compose up -d
```

### Logs

```bash
# View TheHive logs
docker-compose logs -f thehive

# View Cortex logs
docker-compose logs -f cortex

# View all security stack logs
docker-compose logs -f thehive cortex elasticsearch cassandra
```

## Troubleshooting

### Cassandra Won't Start
```bash
# Check memory (Cassandra needs ~2GB)
docker stats

# If low on memory, reduce heap in docker-compose.yml:
# MAX_HEAP_SIZE=512M
```

### TheHive Can't Connect to Cassandra
```bash
# Verify Cassandra is healthy
docker-compose exec cassandra cqlsh -e "DESCRIBE KEYSPACES"

# Check TheHive logs
docker-compose logs thehive | grep -i cassandra
```

### Cortex Analyzers Not Working
```bash
# Verify Docker socket is accessible
docker-compose exec cortex docker ps

# Enable Docker-in-Docker if needed
# Add to cortex service in docker-compose.yml:
# volumes:
#   - /var/run/docker.sock:/var/run/docker.sock
```

## Security Notes

1. **Change default passwords** immediately after setup
2. **Generate proper secrets** for `play.http.secret.key` in both configs:
   ```bash
   openssl rand -hex 32
   ```
3. **Restrict network access** - TheHive should not be publicly accessible
4. **Enable TLS** for production deployments
5. **Regular backups** - Cassandra data is critical

## Resources

- [TheHive Documentation](https://docs.strangebee.com/thehive/)
- [Cortex Documentation](https://github.com/TheHive-Project/CortexDocs)
- [TheHive API Reference](https://docs.strangebee.com/thehive/api-docs/)
