
---

# StatusOverview

<p align="center">
  <img src="https://Swap-nul.github.io/statusoverview/screenshots/StatusOverviewBanner.png" alt="StatusOverview" width="838">
</p>

[![Build](https://github.com/Swap-nul/statusoverview/actions/workflows/Build.yml/badge.svg)](https://github.com/Swap-nul/statusoverview/actions/workflows/Build.yml)

**StatusOverview** is a comprehensive dashboard tool designed to display version information, deployments, environments, and endpoints for multiple applications, typically microservices. It provides developers and DevOps teams with an eagle-eye view across all environments, ensuring seamless operations and quick insights into the application landscape.

## 🚀 Latest Features

- 🔐 **PKCE Authentication**: Integrated Keycloak with PKCE (Proof Key for Code Exchange) for secure, modern OAuth 2.0 authentication
- 🎭 **Role-based Access Control**: Granular access control with custom roles and permissions
- 🔑 **JWT Token Management**: Automatic token handling, refresh, and secure API calls
- 🛡️ **Security Guards**: Route protection with automatic login redirection
- 🎨 **Modern UI**: Angular 17 with Material Design components
- 🌙 **Dark Mode Support**: Toggle between light and dark themes
- 📱 **Responsive Design**: Works seamlessly across desktop and mobile devices
- 🚀 **Bulk Deployment**: Deploy multiple applications from one environment to another using Jenkins automation
- ⚙️ **Jenkins Integration**: Built-in Jenkins server for automated deployment workflows

---

## 📸 Screenshots

<p align="center">
  <img src="https://Swap-nul.github.io/statusoverview/screenshots/StatusOverviewDashboard.png" alt="StatusOverview Dashboard" width="838">
</p>

---

## ✨ Key Benefits

- **Version Tracking**: Instantly see if the latest version is deployed across environments
- **Deployment Details**: Drill down to see who deployed what, with commit details and messages
- **Environment Overview**: Compare application states across dev, staging, and production
- **Security First**: PKCE-enabled OAuth 2.0 ensures secure access to sensitive deployment data
- **Role-based UI**: Show/hide features based on user roles and permissions
- **Dark Mode**: Eye-friendly interface for extended monitoring sessions
- **Bulk Operations**: Deploy multiple applications simultaneously with automated workflows
- **Jenkins Integration**: Built-in CI/CD pipeline for streamlined deployment processes

![DrillDownPopUp](https://Swap-nul.github.io/statusoverview/screenshots/drilldown.png "Drill Down Popup")

---

## 🏗️ Architecture

The application consists of:
- **Frontend**: Angular 17 with TypeScript, Angular Material, and Keycloak integration
- **Backend API**: PostgREST providing RESTful APIs over PostgreSQL
- **Authentication**: Keycloak server for OAuth 2.0/OIDC authentication
- **CI/CD**: Jenkins server for automated deployment workflows
- **Database**: PostgreSQL for data persistence
- **Database**: PostgreSQL for storing application metadata and deployment information
- **Authentication**: Keycloak server for identity and access management
- **Container Stack**: Docker Compose for local development environment

---

## 🚀 Quick Start

### Prerequisites

- **Docker** and **Docker Compose** installed
- **Node.js** (v18+) and **pnpm** package manager
- **Git** for version control

### 1. Clone the Repository

```bash
git clone https://github.com/Swap-nul/statusoverview.git
cd statusoverview
```

### 2. Start the Backend Services

Start PostgreSQL, PostgREST, and Keycloak:

```bash
docker compose up -d
```

This will start:
- **PostgreSQL** on port 3579
- **PostgREST** on port 3000
- **Keycloak** on port 8081
- **Jenkins** on port 8082 (optional, for bulk deployment feature)

### 3. Set Up Keycloak Authentication

Wait for Keycloak to fully start (usually 1-2 minutes), then run the automated setup:

**For Linux/Mac:**
```bash
chmod +x keycloak-setup.sh
./keycloak-setup.sh
```

**For Windows (PowerShell):**
```powershell
.\keycloak-setup.ps1
```

The script automatically creates:
- ✅ `statusoverview` realm
- ✅ `statusoverview-app` client with PKCE enabled
- ✅ Test user: `testuser` / `testpass123`
- ✅ Default roles: `admin`, `user`, `viewer`

### 4. Set Up Jenkins (Optional - for Bulk Deployment)

For the bulk deployment feature, set up Jenkins:

**For Linux/Mac:**
```bash
chmod +x jenkins-setup.sh
./jenkins-setup.sh
```

**For Windows (PowerShell):**
```powershell
.\jenkins-setup.ps1
```

This will:
- ✅ Start Jenkins on port 8082
- ✅ Create admin user: `admin` / `admin123`
- ✅ Set up bulk deployment job with pipeline
- ✅ Configure API integration with CSRF disabled
- ✅ Install required plugins automatically

**Jenkins Access:**
- URL: http://localhost:8082
- Username: admin
- Password: admin123

**Jenkins Features:**
- **Bulk Deployment Job**: Pre-configured pipeline for deploying multiple applications
- **API Integration**: RESTful API endpoints for triggering deployments
- **CORS Support**: Configured to work with Angular frontend via proxy
- **Docker Support**: Docker-in-Docker enabled for containerized deployments

See [JENKINS_SETUP.md](JENKINS_SETUP.md) for detailed configuration and troubleshooting.

### 5. Initialize Database

```bash
# Execute database schema
docker exec -i statusoverview-db psql -U postgres -d statusoverview_DB < database/Database_Schema.sql

# Load sample data (optional)
docker exec -i statusoverview-db psql -U postgres -d statusoverview_DB < database/Dummy_Data_Insert_Scripts.sql
```

### 6. Start the Frontend Application

```bash
# Install dependencies
pnpm install

# Start development server with Jenkins proxy support
pnpm start
```

The application will be available at **http://localhost:4200**

**Note**: The development server is configured with a proxy (`proxy.conf.json`) to handle Jenkins API calls and avoid CORS issues. Jenkins APIs are accessible at `/jenkins/*` endpoints in the Angular application.

---

## 🔐 Authentication Flow

1. **Visit** `http://localhost:4200`
2. **Login Page** appears with Status Overview branding
3. **Click** "Sign In with Keycloak"
4. **Authenticate** with Keycloak (use `testuser` / `testpass123`)
5. **Redirected** to the main dashboard upon successful authentication

### Test Credentials

| Username | Password | Roles |
|----------|----------|-------|
| testuser | testpass123 | user |

---

## 🚀 Bulk Deployment Feature

The StatusOverview application includes a comprehensive bulk deployment feature powered by Jenkins automation.

### Overview

The bulk deployment feature allows you to:
- Select multiple applications from a source environment
- Deploy them to a target environment with a single operation
- Monitor deployment progress and results in real-time
- View detailed deployment logs and status

### How It Works

1. **Environment Selection**: Choose source (FROM) and target (TO) environments
2. **Application Selection**: Select applications using checkboxes in a responsive table
3. **Version Management**: View current versions and branches for each application
4. **Jenkins Integration**: Deployments are executed via Jenkins pipeline jobs
5. **Real-time Monitoring**: Track deployment progress and view results

### Usage

1. Navigate to the main dashboard
2. Click the "Bulk Deploy" button (requires appropriate permissions)
3. Select source and target environments from dropdowns
4. Use checkboxes to select applications for deployment
5. Review the selection and click "Deploy Selected Applications"
6. Monitor progress through Jenkins job execution

### Jenkins Pipeline

The bulk deployment job includes:
- **Parameter Validation**: Ensures all required parameters are provided
- **Pre-deployment Checks**: Validates applications and environments
- **Deployment Execution**: Processes each application sequentially
- **Post-deployment Verification**: Validates deployment success
- **Results Summary**: Provides detailed deployment report

### API Integration

The feature uses Jenkins REST API for:
- Triggering deployment jobs with parameters
- Monitoring job status and progress
- Retrieving console output and build results
- Managing authentication and error handling

### Security

- CSRF protection disabled for API endpoints
- Basic authentication with Jenkins admin credentials
- Role-based access control for bulk deployment feature
- Proxy configuration to handle cross-origin requests

---

## ⚙️ Configuration

### Keycloak Settings

Update `src/assets/config.json` for your environment:

```json
{
  "keycloak": {
    "url": "http://localhost:8081",
    "realm": "statusoverview", 
    "clientId": "statusoverview-app"
  },
  "authentication": {
    "skipUrls": [
      "/assets/",
      "/login", 
      "/silent-check-sso.html",
      "keycloak",
      "/realms/"
    ],
    "skipDomains": [
      "localhost:3000"
    ]
  },
  "database_hostname_port": "http://localhost:3000",
  "database_baseUrl": "/statusoverview",
  "jenkinsBaseUrl": "/jenkins",
  "jenkinsApiUser": "admin",
  "jenkinsApiToken": "admin123",
  "jenkinsBulkDeployJobName": "bulk-deployment-job"
}
```

#### Jenkins Configuration

The Jenkins integration uses a proxy-based approach to avoid CORS issues:

- **`jenkinsBaseUrl`**: Set to `/jenkins` to use the Angular development proxy
- **`jenkinsApiUser`**: Jenkins admin username (default: `admin`)
- **`jenkinsApiToken`**: Jenkins admin password (default: `admin123`)
- **`jenkinsBulkDeployJobName`**: Name of the bulk deployment job (default: `bulk-deployment-job`)

The proxy configuration (`proxy.conf.json`) automatically forwards requests from `/jenkins/*` to `http://localhost:8082/`.

#### Authentication Configuration

The `authentication` section controls which URLs and domains are excluded from JWT token injection:

- **`skipUrls`**: URL patterns that should bypass authentication (static assets, login pages, Keycloak endpoints)
- **`skipDomains`**: Domain patterns for external APIs that don't require authentication (like PostgREST database API)

This configuration is automatically used by both the `AuthInterceptor` and Keycloak initialization, making it easy to manage authentication exclusions in one place.

### Environment-Specific Configuration

Configure the following files for your specific needs:

```
src/assets/config.json              # API endpoints, Keycloak config
src/app/models/ELEMENT_DATA.ts       # Project and app names
src/app/models/dataModel/EnvAppInfoData.ts  # Environment-specific app configurations
src/app/models/dataModel/RepoData.ts        # Repository endpoints
```

---

## 🛡️ Role-Based Access Control

### Using the HasRole Directive

Control UI elements based on user roles:

```html
<!-- Only visible to admins -->
<button *appHasRole="'admin'" mat-raised-button>
  Admin Controls
</button>

<!-- Visible to multiple roles -->
<div *appHasRole="['admin', 'user']">
  User Dashboard Content
</div>

<!-- Visible to everyone (no role check) -->
<span>Public Information</span>
```

### Protecting Routes

Routes are automatically protected by the `AuthGuard`:

```typescript
const routes: Routes = [
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    data: { roles: ['user', 'admin'] }  // Optional role requirement
  }
];
```

---

## 🔧 Development

### Project Structure

```
src/
├── app/
│   ├── components/          # Angular components
│   │   ├── dashboard/       # Main dashboard
│   │   ├── login/          # Custom login page
│   │   ├── header/         # Navigation header
│   │   └── bulk-deploy-dialog/ # Bulk deployment modal
│   ├── services/           # Angular services
│   │   ├── keycloak.service.ts     # Authentication service
│   │   ├── applications.service.ts # Business logic
│   │   └── jenkins.service.ts      # Jenkins API integration
│   ├── guards/             # Route guards
│   │   └── auth.guard.ts   # Authentication guard
│   ├── interceptors/       # HTTP interceptors
│   │   └── auth.interceptor.ts     # JWT token injection
│   ├── directives/         # Custom directives
│   │   └── has-role.directive.ts   # Role-based visibility
│   └── init/              # App initialization
│       └── keycloak-init.factory.ts # Keycloak setup
├── assets/                # Static assets
│   └── config.json        # Application configuration
├── environments/          # Environment configs
└── proxy.conf.json        # Proxy configuration for Jenkins
jenkins/                   # Jenkins configuration
├── Dockerfile            # Custom Jenkins image
├── plugins.txt           # Jenkins plugins list
└── init.groovy.d/        # Jenkins initialization scripts
    ├── 01-basic-setup.groovy    # Basic Jenkins configuration
    └── 02-create-job.groovy     # Bulk deployment job creation
```

### Available Scripts

```bash
# Development
pnpm start              # Start dev server with Jenkins proxy
pnpm build              # Build for production
pnpm test               # Run unit tests
pnpm lint               # Lint code

# Docker Services
docker compose up       # Start all services (PostgreSQL, PostgREST, Keycloak, Jenkins)
docker compose up -d    # Start services in background
docker compose down     # Stop all services
docker compose restart  # Restart services

# Jenkins Management
./jenkins-setup.sh      # Setup Jenkins (Linux/Mac)
.\jenkins-setup.ps1     # Setup Jenkins (Windows)

# Service-specific operations
docker compose up -d jenkins    # Start only Jenkins
docker compose logs jenkins     # View Jenkins logs
docker compose restart jenkins  # Restart Jenkins

# Build custom Jenkins image
docker compose build jenkins
```

### Adding New Roles

1. **Create role in Keycloak** (Admin Console → Roles)
2. **Assign to users** (Admin Console → Users → Role Mappings)
3. **Use in templates**:
   ```html
   <div *appHasRole="'new-role'">New Feature</div>
   ```

---

## 🏭 Production Deployment

### Frontend Build

```bash
# Build optimized production bundle
pnpm run build

# Output will be in dist/ directory
# Deploy to your web server (NGINX, Apache, etc.)
```

### Production Keycloak Setup

1. **Use production-grade Keycloak deployment**
2. **Configure proper SSL/TLS certificates**
3. **Set strong admin passwords**
4. **Configure production database**
5. **Update CORS and redirect URIs**

### Environment Variables

Create production environment files:

```typescript
// src/environments/environment.prod.ts
export const environment = {
  production: true,
  keycloak: {
    url: 'https://your-keycloak.domain.com',
    realm: 'statusoverview',
    clientId: 'statusoverview-app'
  }
};
```

### Security Checklist

- [ ] HTTPS enabled for all services
- [ ] Keycloak admin console secured
- [ ] Strong passwords and proper token lifetimes
- [ ] CORS properly configured
- [ ] Production database secured
- [ ] Regular security updates applied

---

## 🐛 Troubleshooting

### Common Issues

**Authentication Errors:**
```bash
# Check Keycloak status
docker logs keycloak

# Verify Keycloak is accessible
curl http://localhost:8081/realms/statusoverview
```

**Database Connection Issues:**
```bash
# Check PostgREST logs
docker logs postgrest

# Test database connection
docker exec -it statusoverview-db psql -U postgres -d statusoverview_DB
```

**Jenkins API Issues:**
```bash
# Check Jenkins status
docker logs statusoverview-jenkins

# Test Jenkins API
curl -u admin:admin123 http://localhost:8082/api/json

# Test bulk deployment job
curl -u admin:admin123 http://localhost:8082/job/bulk-deployment-job/api/json

# Rebuild Jenkins with latest configuration
docker compose build jenkins
docker compose up -d jenkins
```

**Build Errors:**
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
pnpm install

# Clear Angular cache
pnpm ng cache clean
```

**CORS Issues with Jenkins:**
The application uses a proxy configuration to avoid CORS issues. If you encounter problems:

1. Ensure `proxy.conf.json` exists in the project root
2. Verify Jenkins is running on port 8082
3. Check that `jenkinsBaseUrl` in `config.json` is set to `/jenkins`
4. Restart the Angular development server after changes

**Jenkins Job Creation Issues:**
If the bulk deployment job isn't created automatically:

1. Check Jenkins initialization logs: `docker compose logs jenkins`
2. Manually trigger job creation by restarting Jenkins
3. Verify plugins are installed: Check Jenkins plugin manager
4. Review `jenkins/init.groovy.d/` scripts for errors

### CORS Issues

If you encounter CORS errors:

**For Keycloak Authentication:**
1. Open Keycloak Admin Console
2. Navigate to Clients → statusoverview-app
3. Add your application URL to "Web Origins"
4. Save changes

**For Jenkins API:**
The application automatically handles Jenkins CORS through:
- Angular development proxy (`proxy.conf.json`)
- Jenkins CSRF protection disabled for API calls
- Proper authentication headers in service calls

No manual CORS configuration is needed for Jenkins when using the provided setup.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/Swap-nul/statusoverview/issues)
- **Documentation**: Check the [Wiki](https://github.com/Swap-nul/statusoverview/wiki)
- **Discussions**: [GitHub Discussions](https://github.com/Swap-nul/statusoverview/discussions)

---

**Made with ❤️ for the DevOps community**