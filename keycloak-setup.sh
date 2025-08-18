#!/bin/bash

# Keycloak Auto-Setup Script for Status Overview
# This script helps automate the initial Keycloak setup

set -e

KEYCLOAK_URL="http://localhost:8081"
ADMIN_USER="admin"
ADMIN_PASS="admin"
REALM_NAME="statusoverview"
CLIENT_ID="statusoverview-app"

echo "🚀 Starting Keycloak Auto-Setup for Status Overview..."

# Function to wait for Keycloak to be ready
wait_for_keycloak() {
    echo "⏳ Waiting for Keycloak to be ready..."
    while ! curl -s "$KEYCLOAK_URL" > /dev/null; do
        echo "   Waiting for Keycloak server..."
        sleep 5
    done
    echo "✅ Keycloak is ready!"
}

# Function to get admin token
get_admin_token() {
    echo "🔑 Getting admin access token..."
    TOKEN=$(curl -s -X POST "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "username=$ADMIN_USER" \
        -d "password=$ADMIN_PASS" \
        -d "grant_type=password" \
        -d "client_id=admin-cli" | jq -r '.access_token')
    
    if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
        echo "❌ Failed to get admin token. Please check Keycloak credentials."
        exit 1
    fi
    echo "✅ Admin token obtained!"
}

# Function to create realm
create_realm() {
    echo "🏗️  Creating realm: $REALM_NAME..."
    
    REALM_EXISTS=$(curl -s -H "Authorization: Bearer $TOKEN" \
        "$KEYCLOAK_URL/admin/realms/$REALM_NAME" | jq -r '.realm // "not_found"')
    
    if [ "$REALM_EXISTS" != "not_found" ]; then
        echo "ℹ️  Realm $REALM_NAME already exists, skipping creation."
        return
    fi
    
    curl -s -X POST "$KEYCLOAK_URL/admin/realms" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "realm": "'$REALM_NAME'",
            "enabled": true,
            "displayName": "Status Overview",
            "registrationAllowed": false,
            "loginWithEmailAllowed": true,
            "duplicateEmailsAllowed": false,
            "resetPasswordAllowed": true,
            "editUsernameAllowed": false,
            "bruteForceProtected": true
        }'
    
    echo "✅ Realm created successfully!"
}

# Function to create client
create_client() {
    echo "🔧 Creating client: $CLIENT_ID..."
    
    # Check if client already exists
    CLIENT_EXISTS=$(curl -s -H "Authorization: Bearer $TOKEN" \
        "$KEYCLOAK_URL/admin/realms/$REALM_NAME/clients?clientId=$CLIENT_ID" | jq '. | length')
    
    if [ "$CLIENT_EXISTS" -gt 0 ]; then
        echo "ℹ️  Client $CLIENT_ID already exists, skipping creation."
        return
    fi
    
    curl -s -X POST "$KEYCLOAK_URL/admin/realms/$REALM_NAME/clients" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "clientId": "'$CLIENT_ID'",
            "name": "Status Overview App",
            "description": "Angular application for Status Overview",
            "enabled": true,
            "clientAuthenticatorType": "client-secret",
            "publicClient": true,
            "standardFlowEnabled": true,
            "implicitFlowEnabled": false,
            "directAccessGrantsEnabled": false,
            "serviceAccountsEnabled": false,
            "authorizationServicesEnabled": false,
            "rootUrl": "http://localhost:4200",
            "baseUrl": "http://localhost:4200",
            "redirectUris": ["http://localhost:4200/*"],
            "webOrigins": ["http://localhost:4200"],
            "attributes": {
                "pkce.code.challenge.method": "S256"
            }
        }'
    
    echo "✅ Client created successfully!"
}

# Function to create test user
create_test_user() {
    echo "👤 Creating test user..."
    
    # Check if user already exists
    USER_EXISTS=$(curl -s -H "Authorization: Bearer $TOKEN" \
        "$KEYCLOAK_URL/admin/realms/$REALM_NAME/users?username=testuser" | jq '. | length')
    
    if [ "$USER_EXISTS" -gt 0 ]; then
        echo "ℹ️  Test user already exists, skipping creation."
        return
    fi
    
    # Create user
    curl -s -X POST "$KEYCLOAK_URL/admin/realms/$REALM_NAME/users" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "username": "testuser",
            "email": "testuser@example.com",
            "firstName": "Test",
            "lastName": "User",
            "enabled": true,
            "emailVerified": true,
            "credentials": [{
                "type": "password",
                "value": "testpass123",
                "temporary": false
            }]
        }'
    
    echo "✅ Test user created successfully!"
    echo "   Username: testuser"
    echo "   Password: testpass123"
}

# Function to create roles
create_roles() {
    echo "🎭 Creating roles..."
    
    ROLES=("admin" "user" "viewer")
    
    for role in "${ROLES[@]}"; do
        # Check if role exists
        ROLE_EXISTS=$(curl -s -H "Authorization: Bearer $TOKEN" \
            "$KEYCLOAK_URL/admin/realms/$REALM_NAME/roles/$role" | jq -r '.name // "not_found"')
        
        if [ "$ROLE_EXISTS" != "not_found" ]; then
            echo "ℹ️  Role $role already exists, skipping."
            continue
        fi
        
        curl -s -X POST "$KEYCLOAK_URL/admin/realms/$REALM_NAME/roles" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d '{
                "name": "'$role'",
                "description": "Role for '$role' level access"
            }'
        
        echo "✅ Role $role created!"
    done
}

# Main execution
main() {
    echo "📋 Keycloak Setup Configuration:"
    echo "   Keycloak URL: $KEYCLOAK_URL"
    echo "   Realm: $REALM_NAME"
    echo "   Client ID: $CLIENT_ID"
    echo ""
    
    wait_for_keycloak
    get_admin_token
    create_realm
    create_client
    create_test_user
    create_roles
    
    echo ""
    echo "🎉 Keycloak setup completed successfully!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Start your Angular app: pnpm start"
    echo "2. Navigate to: http://localhost:4200"
    echo "3. Click 'Sign In with Keycloak'"
    echo "4. Use credentials: testuser / testpass123"
    echo ""
    echo "🔗 Keycloak Admin Console: $KEYCLOAK_URL"
    echo "   Admin credentials: $ADMIN_USER / $ADMIN_PASS"
}

# Check if required tools are installed
if ! command -v curl &> /dev/null; then
    echo "❌ curl is required but not installed."
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo "❌ jq is required but not installed."
    echo "Please install jq: https://stedolan.github.io/jq/download/"
    exit 1
fi

# Run main function
main
