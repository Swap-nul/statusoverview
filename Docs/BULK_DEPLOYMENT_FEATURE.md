# Bulk Deployment Feature

This document describes the new bulk deployment feature that allows users to deploy multiple applications from one environment to another using Jenkins automation.

## Overview

The bulk deployment feature provides a convenient way to:
- Select applications from a source environment
- Deploy them to a target environment
- Track deployment progress through Jenkins integration
- Provide user-friendly feedback during the deployment process

## Components

### 1. Bulk Deploy Dialog Component
**Location**: `src/app/components/bulk-deploy-dialog/`

- **Purpose**: Provides the user interface for bulk deployment operations
- **Features**:
  - Environment selection (FROM and TO)
  - Application listing with filtering
  - Checkbox selection for multiple applications
  - Real-time validation
  - Progress tracking

### 2. Jenkins Service
**Location**: `src/app/services/jenkins.service.ts`

- **Purpose**: Handles integration with Jenkins for triggering bulk deployment jobs
- **Features**:
  - Jenkins API authentication
  - Job triggering with parameters
  - Status monitoring
  - Error handling

### 3. Project Component Updates
**Location**: `src/app/components/project/`

- **Purpose**: Integrates the bulk deploy button into the existing project view
- **Features**:
  - Bulk Deploy button in the toolbar
  - Dialog opening and result handling

## Configuration

### Jenkins Configuration
Add the following configuration to your `src/assets/config.json`:

```json
{
  "jenkinsBaseUrl": "https://your-jenkins-instance.com",
  "jenkinsApiUser": "your-jenkins-user",
  "jenkinsApiToken": "your-jenkins-api-token",
  "jenkinsBulkDeployJobName": "bulk-deployment-job"
}
```

### Jenkins Job Requirements
Your Jenkins job should accept the following parameters:
- `PROJECT_NAME`: The name of the project
- `FROM_ENVIRONMENT`: Source environment name
- `TO_ENVIRONMENT`: Target environment name
- `APPLICATIONS_JSON`: JSON string containing application details
- `TRIGGER_USER`: User who triggered the deployment

Example JSON format for `APPLICATIONS_JSON`:
```json
[
  {
    "appName": "app1",
    "version": "v1.2.3",
    "branch": "main"
  },
  {
    "appName": "app2",
    "version": "v2.1.0",
    "branch": "develop"
  }
]
```

## Usage

### For End Users

1. **Access the Feature**:
   - Navigate to any project view
   - Click the "Bulk Deploy" button in the toolbar

2. **Select Environments**:
   - Choose the source environment (FROM)
   - Choose the target environment (TO)
   - The application table will automatically populate

3. **Select Applications**:
   - Use checkboxes to select individual applications
   - Use "Select All" to choose all applications
   - Use the filter field to search for specific applications

4. **Initiate Deployment**:
   - Click "Deploy X App(s)" button
   - Monitor the progress indicator
   - Receive confirmation or error feedback

### For Developers

#### Adding New Environment Support
1. Update `src/assets/config.json` environments array
2. Ensure your backend provides deployment data for the new environment

#### Customizing the Jenkins Integration
1. Modify `src/app/services/jenkins.service.ts`
2. Update the payload structure in `triggerBulkDeployment` method
3. Adjust error handling as needed

#### Extending the UI
1. Update `bulk-deploy-dialog.component.html` for UI changes
2. Modify `bulk-deploy-dialog.component.scss` for styling
3. Add new features to `bulk-deploy-dialog.component.ts`

## API Integration

### Jenkins API Endpoints Used
- `POST /job/{jobName}/buildWithParameters` - Trigger deployment job
- `GET /job/{jobName}/{buildNumber}/api/json` - Get job status
- `GET /job/{jobName}/{buildNumber}/consoleText` - Get console output

### Error Handling
The service handles common scenarios:
- Authentication failures (401)
- Permission issues (403)
- Job not found (404)
- Network connectivity issues

## Security Considerations

1. **Authentication**: Uses Jenkins API tokens for secure authentication
2. **Authorization**: Respects Jenkins job-level permissions
3. **Input Validation**: Validates environment selections and application data
4. **Error Sanitization**: Prevents sensitive information leakage in error messages

## Future Enhancements

Potential improvements for future versions:
- Deployment progress tracking in real-time
- Rollback functionality
- Deployment history and audit trails
- Email notifications
- Integration with other CI/CD tools
- Bulk deployment templates/presets

## Troubleshooting

### Common Issues

1. **Jenkins Connection Failed**
   - Verify `jenkinsBaseUrl` in config.json
   - Check network connectivity
   - Validate API credentials

2. **Job Trigger Failed**
   - Ensure Jenkins job exists and is properly configured
   - Verify user permissions for the job
   - Check job parameter names match expected values

3. **No Applications Shown**
   - Verify applications have deployment data for the selected environment
   - Check backend API responses
   - Ensure environment configuration is correct

### Debug Mode
Enable console logging to troubleshoot issues:
```typescript
// In jenkins.service.ts, uncomment debug statements
console.log('Jenkins payload:', payload);
console.log('Jenkins response:', response);
```

## Dependencies

### New Angular Material Modules Required
- `MatTableModule` (for application listing)
- `MatCheckboxModule` (for selection)
- `MatProgressSpinnerModule` (for loading indicators)
- `MatChipsModule` (for version/branch display)

### New CDK Modules Required
- `SelectionModel` from `@angular/cdk/collections`

### External Dependencies
- Jenkins instance with API access
- Proper CORS configuration if Jenkins is on different domain
