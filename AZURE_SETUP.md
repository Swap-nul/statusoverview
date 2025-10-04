# Azure AD PKCE Authentication Setup Guide

This guide explains how to set up Azure Active Directory (Azure AD) authentication with PKCE (Proof Key for Code Exchange) for the Status Overview Angular application alongside the existing Keycloak authentication.

## 🎯 Overview

The StatusOverview application now supports multiple authentication providers:
- **Keycloak** with PKCE 
- **Azure Active Directory** with PKCE
- **Dual Provider** mode allowing users to choose

This setup provides:
- **Modern OAuth 2.0 with PKCE** for enhanced security
- **Flexible authentication** with provider selection
- **Seamless token management** across different providers
- **Unified user experience** regardless of authentication method

## 📋 Prerequisites

1. **Azure Active Directory tenant** with admin access
2. **Node.js** (v18+) and **pnpm** package manager
3. **Angular application** with existing authentication setup
4. **Azure CLI** (optional, for advanced configuration)

## 🚀 Quick Setup

### 1. Azure AD App Registration

First, create an app registration in Azure AD:

1. **Sign in** to the [Azure Portal](https://portal.azure.com)
2. **Navigate** to Azure Active Directory → App registrations
3. **Click** "New registration"
4. **Configure** the registration:
   - **Name**: `StatusOverview App`
   - **Supported account types**: `Accounts in this organizational directory only`
   - **Redirect URI**: 
     - Type: `Single-page application (SPA)`
     - URI: `http://localhost:4200`
5. **Click** "Register"

### 2. Configure Authentication

In your new app registration:

1. **Go to** Authentication → Single-page application
2. **Add redirect URI**: `http://localhost:4200`
3. **Configure logout URL**: `http://localhost:4200`
4. **Enable** the following:
   - ✅ Access tokens (used for implicit flows)
   - ✅ ID tokens (used for implicit and hybrid flows)
5. **Save** changes

### 3. Configure API Permissions

1. **Go to** API permissions
2. **Add** Microsoft Graph permissions:
   - `User.Read` (Delegated) - Default, should already be present
3. **Grant admin consent** if required by your organization

### 4. Note Important Values

From the app registration overview, copy these values:
- **Application (client) ID**: `12345678-1234-1234-1234-123456789012`
- **Directory (tenant) ID**: `87654321-4321-4321-4321-210987654321`

## ⚙️ Application Configuration

### Update Configuration Files

Update `src/assets/config.json`:

```json
{
  "keycloak": {
    "url": "http://localhost:8081",
    "realm": "statusoverview",
    "clientId": "statusoverview-app"
  },
  "azure": {
    "clientId": "your-azure-app-client-id",
    "authority": "https://login.microsoftonline.com/your-tenant-id",
    "redirectUri": "http://localhost:4200",
    "postLogoutRedirectUri": "http://localhost:4200",
    "scopes": ["user.read"]
  },
  "authProvider": "both"
}
```

### Environment Configuration

Update `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  keycloak: {
    url: 'http://localhost:8081',
    realm: 'statusoverview',
    clientId: 'statusoverview-app'
  },
  azure: {
    clientId: 'your-azure-app-client-id',
    authority: 'https://login.microsoftonline.com/your-tenant-id',
    redirectUri: 'http://localhost:4200',
    postLogoutRedirectUri: 'http://localhost:4200',
    scopes: ['user.read']
  },
  authProvider: 'both' // 'keycloak', 'azure', or 'both'
};
```

### Replace Configuration Values

Replace the placeholder values with your actual Azure AD values:

- `your-azure-app-client-id` → Your Application (client) ID
- `your-tenant-id` → Your Directory (tenant) ID

## 🔧 Authentication Provider Modes

The application supports three authentication modes:

### Single Provider Mode - Keycloak Only
```json
{
  "authProvider": "keycloak"
}
```
- Shows only Keycloak login option
- Traditional behavior

### Single Provider Mode - Azure Only
```json
{
  "authProvider": "azure"
}
```
- Shows only Azure AD login option
- Direct Azure authentication

### Multi-Provider Mode
```json
{
  "authProvider": "both"
}
```
- Shows both Keycloak and Azure login options
- Users can choose their preferred method
- Supports organization-specific requirements

## 🧪 Testing the Setup

### 1. Start the Application

```bash
# Install dependencies if not done already
pnpm install

# Start development server
pnpm start
```

### 2. Test Authentication Flow

1. **Navigate** to `http://localhost:4200`
2. **Login page** should appear showing available providers
3. **Click** "Sign In with Microsoft Azure"
4. **Azure login** popup should appear
5. **Enter** your Azure AD credentials
6. **Grant consent** for permissions if prompted
7. **Success**: You should be redirected to the dashboard

### 3. Verify Token and User Info

Check browser console for:
- Successfully acquired Azure AD token
- User profile information loaded
- No authentication errors

## 🔒 Security Features

### PKCE Implementation
- **Code Challenge Method**: S256 (SHA256)
- **Enhanced security** for public clients
- **Protection** against authorization code interception

### Token Management
- **Automatic token refresh** before expiration
- **Secure token storage** in session storage
- **Silent authentication** for seamless user experience

### Permission Scopes
- **User.Read**: Basic profile information
- **Extensible**: Add additional scopes as needed

## 🛠️ Advanced Configuration

### Adding Additional Scopes

To request additional permissions:

```json
{
  "azure": {
    "scopes": [
      "user.read",
      "user.read.all",
      "directory.read.all"
    ]
  }
}
```

### Multi-Tenant Support

For multi-tenant applications:

```json
{
  "azure": {
    "authority": "https://login.microsoftonline.com/common",
    "clientId": "your-client-id"
  }
}
```

### Custom Redirect Handling

For custom post-login handling:

```typescript
// In your component
async onAzureLoginSuccess(result: AuthenticationResult) {
  // Custom logic after successful Azure login
  console.log('Azure login successful:', result);
  // Redirect to specific route based on user roles
}
```

## 🐛 Troubleshooting

### Common Issues

**CORS Errors**
```
Error: Cross-origin request blocked
```
**Solution**: Verify redirect URIs in Azure AD app registration match exactly

**Token Acquisition Failed**
```
Error: Failed to acquire token silently
```
**Solution**: Check scopes and permissions, ensure admin consent if required

**Popup Blocked**
```
Error: Popup window blocked by browser
```
**Solution**: Allow popups for your domain or use redirect flow

**Invalid Client ID**
```
Error: AADSTS70002: Error validating credentials
```
**Solution**: Verify client ID and tenant ID are correct

### Debug Steps

1. **Check Browser Console**: Look for MSAL-related errors
2. **Verify Configuration**: Ensure all IDs match Azure AD registration
3. **Check Network Tab**: Verify authentication requests are successful
4. **Azure AD Logs**: Check sign-in logs in Azure portal

### Error Codes Reference

- **AADSTS50011**: Redirect URI mismatch
- **AADSTS65001**: User consent required
- **AADSTS70002**: Invalid credentials
- **AADSTS900144**: Request body too large

## 🏭 Production Considerations

### Security Checklist

- [ ] **Use HTTPS** in production
- [ ] **Configure proper CORS** policies
- [ ] **Set appropriate token lifetimes**
- [ ] **Enable conditional access** policies
- [ ] **Monitor sign-in logs** regularly

### Production Configuration

```typescript
// src/environments/environment.prod.ts
export const environment = {
  production: true,
  azure: {
    clientId: 'your-prod-client-id',
    authority: 'https://login.microsoftonline.com/your-prod-tenant-id',
    redirectUri: 'https://your-production-domain.com',
    postLogoutRedirectUri: 'https://your-production-domain.com',
    scopes: ['user.read']
  }
};
```

### Multi-Environment Setup

Create separate app registrations for each environment:
- **Development**: `StatusOverview-Dev`
- **Staging**: `StatusOverview-Staging`  
- **Production**: `StatusOverview-Prod`

## 📚 Additional Resources

- **[Azure AD Documentation](https://docs.microsoft.com/en-us/azure/active-directory/)**
- **[MSAL Angular Guide](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular)**
- **[PKCE RFC 7636](https://tools.ietf.org/html/rfc7636)**
- **[Azure AD App Registration](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)**

## 🎉 Multi-Provider Benefits

With both Keycloak and Azure AD configured:

✅ **Flexible Authentication**: Choose the right provider for different users
✅ **Enterprise Integration**: Seamless Azure AD integration for Microsoft environments  
✅ **Migration Path**: Easy transition between authentication systems
✅ **Unified Experience**: Consistent UI regardless of provider
✅ **Enhanced Security**: PKCE support across all providers

---

**🎊 Congratulations!** You now have a comprehensive multi-provider authentication system with both Keycloak and Azure AD support!