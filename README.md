
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

![DrillDownPopUp](https://Swap-nul.github.io/statusoverview/screenshots/drilldown.png "Drill Down Popup")

---

## 🏗️ Architecture

The application consists of:
- **Frontend**: Angular 17 with TypeScript, Angular Material, and Keycloak integration
- **Backend API**: PostgREST providing RESTful APIs over PostgreSQL
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

### 4. Initialize Database

```bash
# Execute database schema
docker exec -i statusoverview-db psql -U postgres -d statusoverview_DB < database/Database_Schema.sql

# Load sample data (optional)
docker exec -i statusoverview-db psql -U postgres -d statusoverview_DB < database/Dummy_Data_Insert_Scripts.sql
```

### 5. Start the Frontend Application

```bash
# Install dependencies
pnpm install

# Start development server
pnpm start
```

The application will be available at **http://localhost:4200**

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
  "database_baseUrl": "/statusoverview"
}
```

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
│   │   └── header/         # Navigation header
│   ├── services/           # Angular services
│   │   ├── keycloak.service.ts     # Authentication service
│   │   └── applications.service.ts # Business logic
│   ├── guards/             # Route guards
│   │   └── auth.guard.ts   # Authentication guard
│   ├── interceptors/       # HTTP interceptors
│   │   └── auth.interceptor.ts     # JWT token injection
│   ├── directives/         # Custom directives
│   │   └── has-role.directive.ts   # Role-based visibility
│   └── init/              # App initialization
│       └── keycloak-init.factory.ts # Keycloak setup
├── assets/                # Static assets
└── environments/          # Environment configs
```

### Available Scripts

```bash
# Development
pnpm start              # Start dev server
pnpm build              # Build for production
pnpm test               # Run unit tests
pnpm lint               # Lint code

# Docker
docker compose up       # Start all services
docker compose down     # Stop all services
docker compose restart  # Restart services
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

**Build Errors:**
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
pnpm install

# Clear Angular cache
pnpm ng cache clean
```

### CORS Issues

If you encounter CORS errors, ensure your Keycloak client has the correct web origins configured:

1. Open Keycloak Admin Console
2. Navigate to Clients → statusoverview-app
3. Add your application URL to "Web Origins"
4. Save changes

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