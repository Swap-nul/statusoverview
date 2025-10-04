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
