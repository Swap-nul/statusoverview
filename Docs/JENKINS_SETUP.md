# Jenkins Setup for Bulk Deployment

This guide explains how to set up and configure Jenkins for the bulk deployment feature in the Status Overview application.

## Overview

The Jenkins setup includes:
- Jenkins server running in Docker container
- Pre-configured bulk deployment job
- API integration with the Status Overview application
- Automated job creation and configuration

## Prerequisites

- Docker and Docker Compose installed
- Status Overview application repository cloned
- Basic understanding of Jenkins and CI/CD concepts

## Quick Start

### 1. Start Jenkins with Docker Compose

```bash
# Navigate to the project root
cd statusoverview

# Start all services including Jenkins
docker compose up -d

# Or start only Jenkins
docker compose up -d jenkins
```

### 2. Access Jenkins

- **URL**: http://localhost:8082
- **Username**: admin
- **Password**: admin123

### 3. Verify Setup

1. Log into Jenkins using the credentials above
2. Navigate to the "bulk-deployment-job"
3. Verify the job configuration and parameters

## Configuration Details

### Docker Compose Configuration

```yaml
jenkins:
  image: jenkins/jenkins:lts
  container_name: statusoverview-jenkins
  privileged: true
  user: root
  ports:
    - "8082:8080"
    - "50000:50000"
  environment:
    - JENKINS_OPTS=--httpPort=8080
    - JAVA_OPTS=-Djenkins.install.runSetupWizard=false
  volumes:
    - jenkins_home:/var/jenkins_home
    - /var/run/docker.sock:/var/run/docker.sock
    - ./jenkins/init.groovy.d:/var/jenkins_home/init.groovy.d
    - ./jenkins/plugins.txt:/usr/share/jenkins/ref/plugins.txt
  networks:
    - statusoverview-net
```

### Key Features

- **No Setup Wizard**: Automatically configured with admin user
- **Docker-in-Docker**: Supports Docker operations within jobs
- **Auto Plugin Installation**: Essential plugins installed automatically
- **Persistent Storage**: Jenkins data persisted in Docker volume
- **Network Integration**: Connected to the application network

### Installed Plugins

The following plugins are automatically installed:

- Blue Ocean (Modern UI)
- Pipeline and Workflow plugins
- Git and GitHub integration
- Docker plugins
- Security and authentication plugins
- Build and deployment utilities

See `jenkins/plugins.txt` for the complete list.

## Bulk Deployment Job

### Job Overview

The `bulk-deployment-job` is automatically created during Jenkins startup and includes:

- **Type**: Pipeline job
- **Parameters**: Project name, environments, application list
- **Stages**: Validation, pre-checks, deployment, verification
- **Results**: Deployment summary and artifact storage

### Job Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `PROJECT_NAME` | String | Name of the project | `alpha` |
| `FROM_ENVIRONMENT` | String | Source environment | `qa` |
| `TO_ENVIRONMENT` | String | Target environment | `uat` |
| `APPLICATIONS_JSON` | Text | JSON array of applications | `[{"appName":"app1","version":"v1.0","branch":"main"}]` |
| `TRIGGER_USER` | String | User who triggered deployment | `john.doe` |

### Pipeline Stages

1. **Validate Parameters**
   - Validates required parameters
   - Parses application JSON
   - Displays deployment summary

2. **Pre-deployment Checks**
   - Validates each application
   - Checks version availability
   - Performs environment checks

3. **Deploy Applications**
   - Iterates through each application
   - Simulates deployment process
   - Tracks success/failure status

4. **Post-deployment Verification**
   - Verifies deployment status
   - Generates deployment report
   - Sets build result based on outcomes

### Customization

To customize the deployment logic, edit the pipeline script in:
`jenkins/init.groovy.d/01-basic-setup.groovy`

Replace the simulation steps with actual deployment commands:

```groovy
// Replace this simulation
echo "1. Pulling image for ${app.appName}:${app.version}"
sleep(2)

// With actual deployment commands
sh "docker pull your-registry/${app.appName}:${app.version}"
sh "kubectl set image deployment/${app.appName} ${app.appName}=your-registry/${app.appName}:${app.version}"
```

## API Integration

### Configuration

The Status Overview application is configured to connect to Jenkins:

```json
{
  "jenkinsBaseUrl": "http://localhost:8082",
  "jenkinsApiUser": "admin",
  "jenkinsApiToken": "admin123",
  "jenkinsBulkDeployJobName": "bulk-deployment-job"
}
```

### Authentication

The application uses basic authentication with the Jenkins API:
- **Username**: admin
- **Password**: admin123 (can be changed in the init script)

For production use, consider:
- Creating a dedicated API user
- Using Jenkins API tokens instead of passwords
- Implementing proper RBAC (Role-Based Access Control)

### API Endpoints Used

- `POST /job/bulk-deployment-job/buildWithParameters` - Trigger deployment
- `GET /job/bulk-deployment-job/{buildNumber}/api/json` - Get job status
- `GET /job/bulk-deployment-job/{buildNumber}/consoleText` - Get console output

## Security Considerations

### Development Environment

The current setup is optimized for development with:
- Simple admin/admin123 credentials
- Disabled setup wizard
- Permissive security settings

### Production Recommendations

For production environments:

1. **Change Default Credentials**
   ```groovy
   hudsonRealm.createAccount("your-admin-user", "strong-password")
   ```

2. **Enable HTTPS**
   - Configure SSL certificates
   - Use HTTPS URLs in configuration

3. **Implement Proper Authentication**
   - LDAP/Active Directory integration
   - SAML/OAuth integration
   - Matrix-based security

4. **API Security**
   - Use Jenkins API tokens
   - Implement IP restrictions
   - Regular credential rotation

5. **Network Security**
   - Use private networks
   - Implement firewall rules
   - VPN access for management

## Maintenance

### Backup

Jenkins data is stored in the `jenkins_home` Docker volume:

```bash
# Backup Jenkins data
docker run --rm -v statusoverview_jenkins_home:/data -v $(pwd):/backup alpine tar czf /backup/jenkins-backup.tar.gz -C /data .

# Restore Jenkins data
docker run --rm -v statusoverview_jenkins_home:/data -v $(pwd):/backup alpine tar xzf /backup/jenkins-backup.tar.gz -C /data
```

### Updates

To update Jenkins:

```bash
# Stop Jenkins
docker compose stop jenkins

# Pull latest image
docker compose pull jenkins

# Start Jenkins
docker compose up -d jenkins
```

### Logs

View Jenkins logs:

```bash
# Real-time logs
docker compose logs -f jenkins

# Specific log lines
docker compose logs --tail=100 jenkins
```

## Troubleshooting

### Common Issues

1. **Jenkins Won't Start**
   - Check port 8082 is not in use
   - Verify Docker daemon is running
   - Check volume permissions

2. **Job Creation Failed**
   - Check init scripts in `jenkins/init.groovy.d/`
   - Verify plugins are installed
   - Review Jenkins startup logs

3. **API Connection Failed**
   - Verify Jenkins is running on port 8082
   - Check credentials in config.json
   - Test API endpoint manually

4. **Docker-in-Docker Issues**
   - Ensure Docker socket is mounted
   - Check user permissions (root user)
   - Verify privileged mode is enabled

### Debug Commands

```bash
# Check Jenkins container status
docker compose ps jenkins

# Access Jenkins container shell
docker compose exec jenkins bash

# Check Jenkins logs
docker compose logs jenkins

# Test API connectivity
curl -u admin:admin123 http://localhost:8082/api/json
```

### Reset Jenkins

To completely reset Jenkins:

```bash
# Stop and remove containers
docker compose down

# Remove Jenkins volume
docker volume rm statusoverview_jenkins_home

# Restart Jenkins
docker compose up -d jenkins
```

## Development Workflow

### Making Changes

1. **Modify Job Configuration**
   - Edit `jenkins/init.groovy.d/01-basic-setup.groovy`
   - Restart Jenkins container
   - Verify changes in Jenkins UI

2. **Update Plugins**
   - Edit `jenkins/plugins.txt`
   - Rebuild Jenkins container
   - Verify plugin installation

3. **Test Integration**
   - Use the bulk deployment feature in Status Overview
   - Monitor Jenkins job execution
   - Review deployment logs

### Testing

1. **Manual Testing**
   - Access Jenkins UI at http://localhost:8082
   - Trigger bulk-deployment-job manually
   - Verify parameter handling

2. **Integration Testing**
   - Use Status Overview bulk deployment feature
   - Test various scenarios (success, failure, partial success)
   - Verify error handling

3. **API Testing**
   ```bash
   # Trigger job via API
   curl -X POST -u admin:admin123 \
     "http://localhost:8082/job/bulk-deployment-job/buildWithParameters" \
     -d "PROJECT_NAME=test&FROM_ENVIRONMENT=qa&TO_ENVIRONMENT=uat&APPLICATIONS_JSON=[{\"appName\":\"test-app\",\"version\":\"v1.0\",\"branch\":\"main\"}]&TRIGGER_USER=test-user"
   ```

## Advanced Configuration

### Custom Pipeline Script

For complex deployment scenarios, create a custom pipeline script:

1. Create `jenkins/pipelines/custom-deployment.groovy`
2. Reference it in the job creation script
3. Implement your specific deployment logic

### Multi-Environment Support

Configure different Jenkins jobs for different environments:
- Development: `bulk-deployment-dev`
- Staging: `bulk-deployment-staging`
- Production: `bulk-deployment-prod`

### Integration with External Systems

- **ArgoCD**: Trigger ArgoCD sync operations
- **Kubernetes**: Direct kubectl commands
- **Docker Registry**: Image management
- **Notification Systems**: Slack, email, Teams integration

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Jenkins logs for error details
3. Consult Jenkins documentation: https://www.jenkins.io/doc/
4. Check Status Overview application logs for integration issues

---

**Note**: This setup is designed for development and testing. For production use, implement proper security measures and follow your organization's DevOps best practices.
