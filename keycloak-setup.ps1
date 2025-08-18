# Keycloak Auto-Setup Script for Status Overview (PowerShell)
param(
    [string]$KeycloakUrl = "http://localhost:8081",
    [string]$AdminUser = "admin",
    [string]$AdminPass = "admin",
    [string]$RealmName = "statusoverview",
    [string]$ClientId = "statusoverview-app"
)

$ErrorActionPreference = "Stop"

Write-Host "Starting Keycloak Auto-Setup for Status Overview..." -ForegroundColor Green

function Wait-ForKeycloak {
    Write-Host "Waiting for Keycloak to be ready..." -ForegroundColor Yellow
    do {
        try {
            $null = Invoke-WebRequest -Uri $KeycloakUrl -Method GET -TimeoutSec 5
            break
        }
        catch {
            Write-Host "   Waiting for Keycloak server..." -ForegroundColor Gray
            Start-Sleep -Seconds 5
        }
    } while ($true)
    Write-Host "Keycloak is ready!" -ForegroundColor Green
}

function Get-AdminToken {
    Write-Host "Getting admin access token..." -ForegroundColor Yellow
    
    $body = @{
        username = $AdminUser
        password = $AdminPass
        grant_type = "password"
        client_id = "admin-cli"
    }
    
    try {
        $tokenUrl = "$KeycloakUrl/realms/master/protocol/openid-connect/token"
        $response = Invoke-RestMethod -Uri $tokenUrl -Method POST -Body $body -ContentType "application/x-www-form-urlencoded"
        $script:Token = $response.access_token
        Write-Host "Admin token obtained!" -ForegroundColor Green
    }
    catch {
        Write-Host "Failed to get admin token. Please check Keycloak credentials." -ForegroundColor Red
        throw
    }
}

function New-Realm {
    Write-Host "Creating realm: $RealmName..." -ForegroundColor Yellow
    
    $headers = @{ Authorization = "Bearer $script:Token" }
    
    try {
        $realmUrl = "$KeycloakUrl/admin/realms/$RealmName"
        $null = Invoke-RestMethod -Uri $realmUrl -Headers $headers -Method GET
        Write-Host "Realm $RealmName already exists, skipping creation." -ForegroundColor Cyan
        return
    }
    catch {
        # Realm doesn't exist, create it
    }
    
    $realmData = @{
        realm = $RealmName
        enabled = $true
        displayName = "Status Overview"
        registrationAllowed = $false
        loginWithEmailAllowed = $true
        duplicateEmailsAllowed = $false
        resetPasswordAllowed = $true
        editUsernameAllowed = $false
        bruteForceProtected = $true
    }
    
    $jsonData = $realmData | ConvertTo-Json
    $createRealmUrl = "$KeycloakUrl/admin/realms"
    $null = Invoke-RestMethod -Uri $createRealmUrl -Headers $headers -Method POST -Body $jsonData -ContentType "application/json"
    Write-Host "Realm created successfully!" -ForegroundColor Green
}

function New-Client {
    Write-Host "Creating client: $ClientId..." -ForegroundColor Yellow
    
    $headers = @{ Authorization = "Bearer $script:Token" }
    
    try {
        $clientsUrl = "$KeycloakUrl/admin/realms/$RealmName/clients?clientId=$ClientId"
        $existing = Invoke-RestMethod -Uri $clientsUrl -Headers $headers -Method GET
        if ($existing.Count -gt 0) {
            Write-Host "Client $ClientId already exists, skipping creation." -ForegroundColor Cyan
            return
        }
    }
    catch {
        # Client doesn't exist, create it
    }
    
    $clientData = @{
        clientId = $ClientId
        name = "Status Overview App"
        description = "Angular application for Status Overview"
        enabled = $true
        clientAuthenticatorType = "client-secret"
        publicClient = $true
        standardFlowEnabled = $true
        implicitFlowEnabled = $false
        directAccessGrantsEnabled = $false
        serviceAccountsEnabled = $false
        authorizationServicesEnabled = $false
        rootUrl = "http://localhost:4200"
        baseUrl = "http://localhost:4200"
        redirectUris = @("http://localhost:4200/*")
        webOrigins = @("http://localhost:4200")
        attributes = @{
            "pkce.code.challenge.method" = "S256"
            "access.token.signed.response.alg" = "HS256"
            "id.token.signed.response.alg" = "HS256"
        }
    }
    
    $jsonData = $clientData | ConvertTo-Json -Depth 10
    $createClientUrl = "$KeycloakUrl/admin/realms/$RealmName/clients"
    $null = Invoke-RestMethod -Uri $createClientUrl -Headers $headers -Method POST -Body $jsonData -ContentType "application/json"
    Write-Host "Client created successfully!" -ForegroundColor Green
}

function New-TestUser {
    Write-Host "Creating test user..." -ForegroundColor Yellow
    
    $headers = @{ Authorization = "Bearer $script:Token" }
    
    try {
        $usersUrl = "$KeycloakUrl/admin/realms/$RealmName/users?username=testuser"
        $existing = Invoke-RestMethod -Uri $usersUrl -Headers $headers -Method GET
        if ($existing.Count -gt 0) {
            Write-Host "Test user already exists, skipping creation." -ForegroundColor Cyan
            return
        }
    }
    catch {
        # User doesn't exist, create it
    }
    
    $userData = @{
        username = "testuser"
        email = "testuser@example.com"
        firstName = "Test"
        lastName = "User"
        enabled = $true
        emailVerified = $true
        credentials = @(
            @{
                type = "password"
                value = "testpass123"
                temporary = $false
            }
        )
    }
    
    $jsonData = $userData | ConvertTo-Json -Depth 10
    $createUserUrl = "$KeycloakUrl/admin/realms/$RealmName/users"
    $null = Invoke-RestMethod -Uri $createUserUrl -Headers $headers -Method POST -Body $jsonData -ContentType "application/json"
    Write-Host "Test user created successfully!" -ForegroundColor Green
    Write-Host "   Username: testuser" -ForegroundColor Gray
    Write-Host "   Password: testpass123" -ForegroundColor Gray
}

function New-Roles {
    Write-Host "Creating roles..." -ForegroundColor Yellow
    
    $headers = @{ Authorization = "Bearer $script:Token" }
    $roles = @("admin", "user", "viewer")
    
    foreach ($role in $roles) {
        try {
            $roleUrl = "$KeycloakUrl/admin/realms/$RealmName/roles/$role"
            $null = Invoke-RestMethod -Uri $roleUrl -Headers $headers -Method GET
            Write-Host "Role $role already exists, skipping." -ForegroundColor Cyan
            continue
        }
        catch {
            # Role doesn't exist, create it
        }
        
        $roleData = @{
            name = $role
            description = "Role for $role level access"
        }
        
        $jsonData = $roleData | ConvertTo-Json
        $createRoleUrl = "$KeycloakUrl/admin/realms/$RealmName/roles"
        $null = Invoke-RestMethod -Uri $createRoleUrl -Headers $headers -Method POST -Body $jsonData -ContentType "application/json"
        Write-Host "Role $role created!" -ForegroundColor Green
    }
}

function Main {
    Write-Host "Keycloak Setup Configuration:" -ForegroundColor Cyan
    Write-Host "   Keycloak URL: $KeycloakUrl" -ForegroundColor Gray
    Write-Host "   Realm: $RealmName" -ForegroundColor Gray
    Write-Host "   Client ID: $ClientId" -ForegroundColor Gray
    Write-Host ""
    
    Wait-ForKeycloak
    Get-AdminToken
    New-Realm
    New-Client
    New-TestUser
    New-Roles
    
    Write-Host ""
    Write-Host "Keycloak setup completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Start your Angular app: pnpm start" -ForegroundColor Gray
    Write-Host "2. Navigate to: http://localhost:4200" -ForegroundColor Gray
    Write-Host "3. Click 'Sign In with Keycloak'" -ForegroundColor Gray
    Write-Host "4. Use credentials: testuser / testpass123" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Keycloak Admin Console: $KeycloakUrl" -ForegroundColor Cyan
    Write-Host "Admin credentials: $AdminUser / $AdminPass" -ForegroundColor Gray
}

# Run main function
Main
