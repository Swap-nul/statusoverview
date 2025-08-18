# Keycloak PKCE Authentication Setup Guide

This comprehensive guide explains how to set up Keycloak authentication with PKCE (Proof Key for Code Exchange) for the Status Overview Angular application.

## 🎯 Overview

StatusOverview uses modern OAuth 2.0 with PKCE for secure authentication. This setup provides:
- **Secure authentication** without client secrets
- **Automatic token management** and refresh
- **Role-based access control** for fine-grained permissions
- **Single Sign-On (SSO)** capabilities

## 📋 Prerequisites

1. **Docker** and **Docker Compose** installed
2. **Node.js** (v18+) and **pnpm** package manager
3. **Angular CLI** installed globally
4. **Git** for version control

## 🚀 Quick Setup (Automated)

For fast setup, use our automated scripts:

**Linux/Mac:**
```bash
./keycloak-setup.sh
```

**Windows (PowerShell):**
```powershell
.\keycloak-setup.ps1
```

The script automatically creates everything you need and provides test credentials.

## 🔧 Manual Setup (Step-by-Step)

### 1. Start Keycloak Server

Start the Keycloak server using Docker Compose:

```bash
# Start all services including Keycloak
docker-compose up -d

# Or start only Keycloak
docker-compose up keycloak
```

The Keycloak server will be available at: `http://localhost:8081`

**Wait for Keycloak to fully start** (usually 1-2 minutes). You'll know it's ready when you can access the web interface.

### 2. Access Keycloak Admin Console

1. Open `http://localhost:8081` in your browser
2. Click on "Administration Console"
3. Login with default admin credentials:
   - **Username**: `admin`
   - **Password**: `admin`

### 3. Create a New Realm

1. In the Admin Console, click the dropdown next to "Master" (top-left)
2. Click "Create Realm"
3. Set the realm name to: **`statusoverview`**
4. Optionally set display name: **`Status Overview`**
5. Click "Create"

### 4. Configure Realm Settings

Navigate to **Realm Settings** and configure:

#### General Tab
- **Display name**: `Status Overview`
- **HTML Display name**: `<strong>Status Overview</strong>`
- **User registration**: `OFF`
- **Email as username**: `ON`
- **Login with email**: `ON`
- **Duplicate emails**: `OFF`
- **Verify email**: `OFF` (for development)
- **Reset password**: `ON`

#### Login Tab
- **User registration**: `OFF`
- **Edit username**: `OFF`
- **Forgot password**: `ON`
- **Remember me**: `ON`

### 5. Create the Angular Client

1. Navigate to **Clients** → **Create client**
2. **General Settings**:
   - **Client type**: `OpenID Connect`
   - **Client ID**: `statusoverview-app`
   - **Name**: `Status Overview App`
   - **Description**: `Angular application for Status Overview`
3. Click "Next"

4. **Capability config**:
   - **Client authentication**: `OFF` (public client)
   - **Authorization**: `OFF`
   - **Authentication flow**:
     - ✅ Standard flow (Authorization Code Flow)
     - ❌ Direct access grants
     - ❌ Implicit flow
     - ❌ Service accounts roles
5. Click "Next"

6. **Login settings**:
   - **Root URL**: `http://localhost:4200`
   - **Home URL**: `http://localhost:4200`
   - **Valid redirect URIs**: `http://localhost:4200/*`
   - **Valid post logout redirect URIs**: `http://localhost:4200/*`
   - **Web origins**: `http://localhost:4200`
7. Click "Save"

### 6. Enable PKCE

1. In the client settings, go to the **Advanced** tab
2. Find **"Proof Key for Code Exchange Code Challenge Method"**
3. Set it to: **`S256`**
4. Click "Save"

### 7. Create Roles

Navigate to **Realm roles** and create the following roles:

#### Admin Role
- **Role name**: `admin`
- **Description**: `Administrator role with full access to all features`

#### User Role  
- **Role name**: `user`
- **Description**: `Standard user role with basic access`

#### Viewer Role
- **Role name**: `viewer`
- **Description**: `Read-only viewer role with limited access`

### 8. Create Test Users

#### Create Main Test User

1. Go to **Users** → **Create new user**
2. Set user details:
   - **Username**: `testuser`
   - **Email**: `testuser@example.com`
   - **First name**: `Test`
   - **Last name**: `User`
   - **Email verified**: `ON`
   - **Enabled**: `ON`
3. Click "Create"

#### Set Password

1. Go to **Credentials** tab
2. Click "Set password"
3. Enter password: `testpass123`
4. Set **"Temporary"** to `OFF`
5. Click "Save"

#### Assign Roles

1. Go to **Role mapping** tab
2. Click "Assign role"
3. Select `user` role
4. Click "Assign"

#### Create Additional Test Users (Optional)

Create admin and viewer test users following the same process:

| Username | Password | Email | Roles |
|----------|----------|-------|--------|
| `admin` | `adminpass123` | `admin@example.com` | `admin`, `user` |
| `viewer` | `viewerpass123` | `viewer@example.com` | `viewer` |

### 9. Configure Token Settings

Navigate to **Realm Settings** → **Tokens** and configure:

- **Access Token Lifespan**: `15 minutes`
- **Access Token Lifespan for Implicit Flow**: `15 minutes`
- **SSO Session Idle**: `30 minutes`
- **SSO Session Max**: `10 hours`
- **Offline Session Idle**: `Offline Session Idle`

## 🧪 Testing the Setup

### 1. Start All Services

```bash
# Start database, PostgREST, and Keycloak
docker-compose up -d

# Check all services are running
docker-compose ps
```

### 2. Start Angular Application

```bash
# Install dependencies (if not done already)
pnpm install

# Start development server  
pnpm start
```

### 3. Test Authentication Flow

1. **Open** `http://localhost:4200` in your browser
2. **Login page** should appear with Status Overview branding
3. **Click** "Sign In with Keycloak"
4. **Keycloak login** page should appear
5. **Enter** test credentials: `testuser` / `testpass123`
6. **Success**: You should be redirected to the dashboard

### 4. Verify Role-Based Features

Test role-based access control by:
- Logging in with different users
- Checking that UI elements appear/disappear based on roles
- Testing protected routes

## ⚙️ Configuration Details

### Angular Configuration

The Keycloak configuration is stored in `src/assets/config.json`:

```json
{
  "keycloak": {
    "url": "http://localhost:8081",
    "realm": "statusoverview",
    "clientId": "statusoverview-app"
  }
}
```

### Environment-Specific Configuration

For different environments, create corresponding configuration files:

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

## 🔒 Security Features

The implementation includes:

1. **PKCE (Proof Key for Code Exchange)**: Additional security for OAuth 2.0
2. **JWT Bearer Tokens**: Automatic inclusion in API requests
3. **Route Guards**: Protect routes from unauthorized access
4. **HTTP Interceptors**: Automatic token injection and refresh
5. **Role-based Authorization**: Fine-grained access control
6. **Silent Token Refresh**: Background token renewal

## 🛠️ Advanced Configuration

### Custom Login Themes

To customize the Keycloak login page:

1. Navigate to **Realm Settings** → **Themes**
2. Set **Login theme** to your custom theme
3. Or modify the existing theme files in Keycloak

### Email Configuration

For password reset and notifications:

1. Go to **Realm Settings** → **Email**
2. Configure SMTP settings
3. Test email configuration

### Social Login (Optional)

To add social login providers:

1. Navigate to **Identity Providers**
2. Add providers like Google, GitHub, Facebook
3. Configure client credentials for each provider

## 🐛 Troubleshooting

### Common Issues

**CORS Errors**
```
Check that Web Origins in Keycloak client settings include:
- http://localhost:4200
- Your production domain
```

**Redirect URI Mismatch**
```
Ensure Valid Redirect URIs include:
- http://localhost:4200/*
- Your production URLs with wildcard
```

**Authentication Loop**
```
- Clear browser cache and cookies
- Check browser console for errors
- Verify Keycloak configuration matches Angular config
```

**Token Validation Errors**
```
- Verify realm name matches exactly
- Check client ID matches
- Ensure PKCE is enabled (S256)
```

### Debugging Steps

1. **Check Service Status**:
   ```bash
   docker-compose ps
   docker logs keycloak
   ```

2. **Browser Developer Tools**:
   - Console for JavaScript errors
   - Network tab for failed requests
   - Application tab for token storage

3. **Keycloak Admin Console**:
   - Events → Login events for authentication logs
   - Sessions → Active sessions to see logged-in users

### Log Locations

- **Browser Console**: Client-side authentication errors
- **Keycloak Logs**: `docker logs keycloak`
- **Network Tab**: HTTP request/response details

## 🏭 Production Deployment

### Security Checklist

- [ ] **HTTPS enabled** for all services
- [ ] **Strong admin passwords** configured
- [ ] **Production database** secured
- [ ] **Token lifetimes** appropriately configured
- [ ] **CORS policies** restrictive but functional
- [ ] **Email verification** enabled
- [ ] **Brute force protection** configured

### Production Configuration

1. **Use Production Keycloak**:
   ```bash
   # Use production-ready Keycloak image
   # Configure with external database
   # Enable clustering if needed
   ```

2. **SSL/TLS Configuration**:
   ```bash
   # Configure reverse proxy (NGINX/Apache)
   # Obtain SSL certificates
   # Configure HTTPS redirects
   ```

3. **Environment Variables**:
   ```bash
   # Set production environment variables
   # Use secrets management for credentials
   # Configure monitoring and logging
   ```

## 📚 Additional Resources

- **[Keycloak Documentation](https://www.keycloak.org/documentation)**
- **[PKCE RFC 7636](https://tools.ietf.org/html/rfc7636)**
- **[OAuth 2.0 Security Best Practices](https://tools.ietf.org/html/draft-ietf-oauth-security-topics)**
- **[Angular Keycloak Library](https://github.com/mauriciovigolo/keycloak-angular)**

## 🆘 Getting Help

If you encounter issues:

1. **Check the troubleshooting section** above
2. **Review Keycloak logs**: `docker logs keycloak`
3. **Verify configuration** matches this guide exactly
4. **Open an issue** on the GitHub repository with:
   - Description of the problem
   - Steps to reproduce
   - Error messages and logs
   - Your configuration (remove sensitive data)

---

**🎉 Congratulations!** You now have a secure, modern authentication system with PKCE-enabled OAuth 2.0!
