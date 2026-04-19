# StatusOverview

<p align="center">
  <img src="https://Swap-nul.github.io/statusoverview/screenshots/StatusOverviewBanner.png" alt="StatusOverview banner" width="838">
</p>

[![Build](https://github.com/Swap-nul/statusoverview/actions/workflows/Build.yml/badge.svg)](https://github.com/Swap-nul/statusoverview/actions/workflows/Build.yml)

StatusOverview is an Angular dashboard for comparing application status across environments, checking certificate and app registration expiry windows, and tracking planned releases from a shared calendar view.

Demo site: https://statusoverview.swalaka.com/

## Current Highlights

- Project-based dashboard tabs loaded from `src/assets/config.json`
- Environment status table with app filtering, environment filtering, column selection, sorting, and CSV export
- Countdown view for certificate and app registration expiry dates with urgency highlighting
- Global release calendar view available from the header
- Runtime release, environment, repository, and expiry configuration from `src/assets/config.json`
- Keycloak and Azure AD authentication support with provider selection
- Dark mode support across the dashboard and Material overlays
- Optional bulk deployment workflow with Jenkins integration

## What Changed Recently

- Added a dedicated `release-calendar` component for a full dashboard-level release calendar
- Added a header toggle to switch between project tabs and the global release calendar
- Added release schedule data support through the `Releases` section in `src/assets/config.json`
- Added configurable countdown alert thresholds through `countdownAlertThreshold`
- Expanded project configuration to drive tabs and environment-specific expiry data from config
- Kept Jenkins integration in the app, but the Jenkins service is currently commented out in `docker-compose.yml`

## Screenshots

<p align="center">
  <img src="https://Swap-nul.github.io/statusoverview/screenshots/Dashboard.png" alt="StatusOverview dashboard" width="838">
</p>

## Stack

- Frontend: Angular 17, Angular Material, TypeScript
- Auth: Keycloak, Azure AD (MSAL)
- API: PostgREST
- Data: PostgreSQL
- Local orchestration: Docker Compose
- Optional deployment automation: Jenkins

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+
- `pnpm`

### 1. Clone and install

```bash
git clone https://github.com/Swap-nul/statusoverview.git
cd statusoverview
pnpm install
```

### 2. Start the local services

```bash
docker compose up -d
```

By default this starts:

- PostgreSQL on `localhost:3579`
- PostgREST on `localhost:3000`
- Keycloak on `localhost:8081`

Note: Jenkins is not started by default because the `jenkins` service is commented out in [docker-compose.yml](</s:/statusoverview/docker-compose.yml>).

### 3. Initialize the database

```bash
docker exec -i statusoverview-db psql -U postgres -d statusoverview_DB < database/Database_Schema.sql
docker exec -i statusoverview-db psql -U postgres -d statusoverview_DB < database/Dummy_Data_Insert_Scripts.sql
```

### 4. Configure Keycloak

Wait for Keycloak to finish starting, then run:

```powershell
.\keycloak-setup.ps1
```

or:

```bash
chmod +x keycloak-setup.sh
./keycloak-setup.sh
```

This creates the default realm, client, test user, and roles used by the app.

### 5. Start the frontend

```bash
pnpm start
```

The app will be available at `http://localhost:4200`.

## Authentication

The app supports three auth modes through `authProvider` in `src/assets/config.json`:

- `keycloak`
- `azure`
- `both`

When `both` is selected, users can choose a provider from the login screen. Route access to `/dashboard` is protected by `AuthGuard`.

For Azure AD setup details, see [AZURE_SETUP.md](AZURE_SETUP.md).

## Main Views

### Project Tabs

Each project tab renders a status matrix for the environments configured for that project. From the project view, users can:

- Search by app name
- Filter visible environments
- Select or deselect environment columns
- Sort application and environment data
- Open environment detail dialogs
- Download environment-specific CSV exports
- Open the bulk deployment dialog
- Switch to the countdown view

### Countdown View

The countdown view shows certificate and app registration expiry windows per environment. Urgency styling is controlled by `countdownAlertThreshold` in `src/assets/config.json`.

### Global Release Calendar

The header now includes a toggle between:

- `Projects View`
- `Release Calendar`

The release calendar reads from the `Releases` section in `src/assets/config.json` and displays:

- Month navigation
- Year navigation
- Monthly event counts
- Daily release/update entries
- Tooltip notes for release items

## Configuration

Most runtime behavior comes from `src/assets/config.json`.

### Important sections

- `projects`: top-level dashboard tabs
- `environments`: display names for environment columns
- `Repository`: app-to-repository links
- `EnvAppInfoByParent`: environment-specific metadata by project
- `countdownAlertThreshold`: warning window for expiry countdowns
- `Releases`: release calendar entries
- `authProvider`, `keycloak`, `azure`: authentication settings
- `jenkins*`: optional Jenkins integration settings

### Example: countdown threshold

```json
"countdownAlertThreshold": {
  "months": 7,
  "days": 15
}
```

### Example: release calendar data

```json
"Releases": [
  {
    "appName": "Customer portal",
    "Events": [
      {
        "type": "Release",
        "version": "v1.0",
        "releaseDate": "05/15/2026",
        "Note": "KYC"
      }
    ]
  }
]
```

### Example: project and environment setup

```json
"projects": [
  { "name": "alpha", "displayName": "Project-Alpha" },
  { "name": "beta", "displayName": "Project-Beta" }
],
"environments": [
  { "name": "alpha", "displayName": "ALPHA" },
  { "name": "qa", "displayName": "QA" },
  { "name": "prod", "displayName": "PROD" }
]
```

## Optional Jenkins Integration

The UI still includes bulk deployment support, proxy configuration, and Jenkins settings, but Jenkins is not enabled in the current default Docker Compose stack.

To use it locally:

1. Re-enable the `jenkins_home` volume and `jenkins` service in [docker-compose.yml](</s:/statusoverview/docker-compose.yml>).
2. Start Jenkins with Docker Compose.
3. Run the Jenkins setup script:

```powershell
.\jenkins-setup.ps1
```

or:

```bash
chmod +x jenkins-setup.sh
./jenkins-setup.sh
```

4. Confirm the proxy target in [proxy.conf.json](</s:/statusoverview/proxy.conf.json>) still points to `http://localhost:8082`.

Additional docs:

- [JENKINS_SETUP.md](JENKINS_SETUP.md)
- [BULK_DEPLOYMENT_FEATURE.md](BULK_DEPLOYMENT_FEATURE.md)

## Available Scripts

```bash
pnpm start   # Run the Angular dev server
pnpm build   # Build the app
pnpm watch   # Build in watch mode
pnpm test    # Run unit tests
```

## Useful Files

- [src/assets/config.json](</s:/statusoverview/src/assets/config.json>)
- [src/app/components/release-calendar/release-calendar.component.ts](</s:/statusoverview/src/app/components/release-calendar/release-calendar.component.ts>)
- [src/app/components/project/project.component.ts](</s:/statusoverview/src/app/components/project/project.component.ts>)
- [src/app/components/header/header.component.ts](</s:/statusoverview/src/app/components/header/header.component.ts>)
- [src/app/components/nav-tabs/nav-tabs.component.ts](</s:/statusoverview/src/app/components/nav-tabs/nav-tabs.component.ts>)
- [docker-compose.yml](</s:/statusoverview/docker-compose.yml>)

## Troubleshooting

### App loads but data is empty

- Confirm PostgREST is running on `localhost:3000`
- Confirm the database schema and sample data were loaded
- Confirm `database_hostname_port` and `database_baseUrl` in `src/assets/config.json`

### Login does not work

- Confirm Keycloak is running on `localhost:8081`
- Re-run the Keycloak setup script if the realm/client is missing
- Verify `authProvider`, `keycloak`, and `azure` values in `src/assets/config.json`

### Bulk deployment does not work

- Confirm Jenkins is actually enabled and running
- Confirm the proxy target in `proxy.conf.json`
- Confirm the Jenkins job names in `src/assets/config.json`

## Additional Docs

- [AZURE_SETUP.md](AZURE_SETUP.md)
- [KEYCLOAK_SETUP.md](KEYCLOAK_SETUP.md)
- [KEYCLOAK_TROUBLESHOOTING.md](KEYCLOAK_TROUBLESHOOTING.md)
- [JENKINS_SETUP.md](JENKINS_SETUP.md)
- [BULK_DEPLOYMENT_FEATURE.md](BULK_DEPLOYMENT_FEATURE.md)

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
