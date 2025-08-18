# Keycloak Setup Troubleshooting Guide

This guide helps resolve common issues when setting up Keycloak with the Status Overview application.

## 🔧 Prerequisites Check

Before running the setup scripts, ensure you have:

### For Bash Script (Linux/Mac)
```bash
# Check if required tools are installed
curl --version
jq --version

# If missing:
# Ubuntu/Debian: sudo apt-get install curl jq
# macOS: brew install curl jq
# CentOS/RHEL: sudo yum install curl jq
```

### For PowerShell Script (Windows)
```powershell
# PowerShell 5.1 or later is required
$PSVersionTable.PSVersion

# Check if Invoke-RestMethod is available (should be built-in)
Get-Command Invoke-RestMethod
```

## 🚀 Common Issues and Solutions

### 1. "Connection Refused" Error

**Problem**: Can't connect to Keycloak
```
Waiting for Keycloak server...
curl: (7) Failed to connect to localhost port 8081
```

**Solution**:
```bash
# Check if Keycloak is running
docker ps | grep keycloak

# If not running, start it
docker-compose up keycloak

# Check if port 8081 is accessible
curl -I http://localhost:8081
```

### 2. "Failed to get admin token"

**Problem**: Invalid admin credentials
```
❌ Failed to get admin token. Please check Keycloak credentials.
```

**Solutions**:
1. **Wait for Keycloak to fully start** (can take 2-3 minutes)
2. **Check admin credentials in docker-compose.yml**:
   ```yaml
   environment:
     KEYCLOAK_ADMIN: admin
     KEYCLOAK_ADMIN_PASSWORD: admin
   ```
3. **Try accessing admin console manually**: http://localhost:8081/admin

### 3. PowerShell Execution Policy Issues

**Problem**: PowerShell script won't run
```
execution of scripts is disabled on this system
```

**Solution**:
```powershell
# Check current policy
Get-ExecutionPolicy

# Allow script execution (run as Administrator)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Or run script directly
PowerShell -ExecutionPolicy Bypass -File .\keycloak-setup.ps1
```

### 4. "Realm already exists" but setup incomplete

**Problem**: Partial setup from previous attempts

**Solution**:
```bash
# Option 1: Delete and recreate (via Admin Console)
# 1. Go to http://localhost:8081/admin
# 2. Login with admin/admin
# 3. Delete 'statusoverview' realm
# 4. Re-run setup script

# Option 2: Manual cleanup via API
curl -X DELETE "http://localhost:8081/admin/realms/statusoverview" \
     -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 5. Docker Network Issues

**Problem**: Services can't communicate

**Solution**:
```bash
# Check network exists
docker network ls | grep statusoverview

# Recreate if needed
docker-compose down
docker-compose up
```

## 📋 Step-by-Step Manual Verification

If automated scripts fail, verify each step manually:

### 1. Verify Keycloak is Running
```bash
# Check container status
docker ps | grep keycloak

# Check logs
docker logs keycloak

# Test admin console
curl -I http://localhost:8081/admin
```

### 2. Get Admin Token Manually
```bash
curl -X POST "http://localhost:8081/realms/master/protocol/openid-connect/token" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "username=admin" \
     -d "password=admin" \
     -d "grant_type=password" \
     -d "client_id=admin-cli"
```

### 3. Create Realm Manually
```bash
# Use token from step 2
TOKEN="your-admin-token-here"

curl -X POST "http://localhost:8081/admin/realms" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "realm": "statusoverview",
       "enabled": true,
       "displayName": "Status Overview"
     }'
```

## 🔍 Debugging Commands

### Check Keycloak Status
```bash
# Container status
docker ps -f name=keycloak

# Container logs
docker logs keycloak --tail 50

# Network connectivity
docker exec keycloak curl -I http://localhost:8080
```

### Test API Endpoints
```bash
# Health check
curl http://localhost:8081/health

# Realm info
curl http://localhost:8081/realms/statusoverview/.well-known/openid-configuration
```

### Verify Angular Configuration
```typescript
// Check src/assets/config.json
{
  "keycloak": {
    "url": "http://localhost:8081",
    "realm": "statusoverview", 
    "clientId": "statusoverview-app"
  }
}
```

## 🛠️ Reset Everything

If you need to start completely fresh:

```bash
# Stop all containers
docker-compose down

# Remove volumes (WARNING: This deletes all data!)
docker-compose down -v

# Remove images (optional)
docker rmi $(docker images -q)

# Start fresh
docker-compose up

# Wait for Keycloak to start, then run setup
./keycloak-setup.sh
```

## 📞 Getting Help

### Log Collection
When reporting issues, include:

1. **Docker logs**:
   ```bash
   docker logs keycloak > keycloak.log 2>&1
   ```

2. **Script output**:
   ```bash
   ./keycloak-setup.sh > setup.log 2>&1
   ```

3. **System info**:
   ```bash
   docker --version
   docker-compose --version
   curl --version
   ```

### Common Log Patterns

**Normal startup**:
```
Keycloak 23.x.x (WildFly Core 20.x.x) started
Admin console listening on http://127.0.0.1:8080/admin
```

**Configuration errors**:
```
ERROR [org.keycloak.services] (main) KC-SERVICES0010: Failed to add user
```

**Network issues**:
```
Connection refused
Failed to connect to localhost port 8081
```

### Contact Information

- **GitHub Issues**: [statusoverview/issues](https://github.com/swapnil512/statusoverview/issues)
- **Documentation**: [README.md](./README.md)
- **Implementation Guide**: [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)

## 🎯 Success Indicators

You know the setup worked when:

1. ✅ **Script completes without errors**
2. ✅ **Admin console accessible**: http://localhost:8081/admin
3. ✅ **Realm visible**: 'statusoverview' appears in realm dropdown
4. ✅ **Client configured**: 'statusoverview-app' exists with PKCE enabled
5. ✅ **Test user works**: Can login with testuser/testpass123
6. ✅ **Angular app authenticates**: Login flow works at http://localhost:4200

Good luck! 🚀
