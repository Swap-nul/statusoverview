
---

# StatusOverview

<p align="center">
  <img src="https://Swap-nul.github.io/statusoverview/screenshots/StatusOverviewBanner.png" alt="StatusOverview" width="838">
</p>

[![Build](https://github.com/Swap-nul/statusoverview/actions/workflows/Build.yml/badge.svg)](https://github.com/Swap-nul/statusoverview/actions/workflows/Build.yml)

**StatusOverview** is a tool designed to display version information, deployments, environments, and endpoints for multiple applications, typically microservices. It helps developers maintain an eagle-eye view across all environments, ensuring seamless operations and quick insights into the application landscape.

---

## Screenshots:

<p align="center">
  <img src="https://Swap-nul.github.io/statusoverview/screenshots/StatusOverviewDashboard.png" alt="StatusOverview Dashboard" width="838">
</p>

---

## Pros:
 - Get to know if the latest version is deployed or not, Yellow badge over the verion tag showcases if new verison is available or not.
 - Drill down who did the last deployment with the commit id and commit message ![DrillDownPopUp](https://Swap-nul.github.io/statusoverview/screenshots/drilldown.png "Drill Down Popup")
 - DarkMode

## Quick Start Guide

Download the Git repository and navigate to the root folder.

Execute the following commands in your terminal or command prompt:
```bash
git clone https://github.com/Swap-nul/statusoverview.git

cd statusoverview
```

---

### Database Setup

Run the following command in the root folder to start the PostgreSQL database container along with the PostgREST container. Modify the configuration as needed for your environment:

```bash
docker compose up
```

- The **PostgreSQL** database will serve as the backend for storing app, deployment, and environment metadata.
- **PostgREST** provides an API layer to interact with the database.

> Ensure Docker is installed and running on your machine before executing the command.

- Execute the ```Database/Database_Schema.sql``` to init the database tables and views
- To create a ***dummy data***, execute  ```Database/Dummy_Data_Insert_Scripts.sql```.

---

### CI/CD Pipelines Setup to Populate Data in the Database

To keep your data updated, you can configure CI/CD pipelines to automate data population:
1. Set up a pipeline to push application version and deployment details to the database whenever a new build or deployment occurs.
2. Use the provided database APIs to push deployment metadata for your microservices.
3. Customize the pipeline YAML files available in the repository for integration with your existing CI/CD tools, such as GitHub Actions, Jenkins, or GitLab CI.

---

### Frontend App Setup

To set up and run the frontend:
1. Navigate to the root folder, Install the required dependencies:
   ```bash
   pnpm install
   ```
2. Start the development server:
   ```bash
   pnpm start
   ```

The frontend app will now be accessible at `http://localhost:4200` by default.

---

### Configuring the Project as Per Your Needs

The project is highly configurable. To customize:
1. Modify the `docker-compose.yml` file to suit your infrastructure needs.
2. Update configurations in `statusoverview` services for API endpoints, environment names, and specific project requirements.
3. As per your project requirements you need to configure 4 files files:
````
src/assests/config.json

src/app/models/ELEMENT_DATA.ts

src/app/models/dataModel/EnvAppInfoData.ts

src/app/models/dataModel/RepoData.ts
````

* Modify the `src/assests/config.json` file to setup your endpoints informations like kibana, argocd and database.
* Modify the `src/app/models/ELEMENT_DATA.ts` file to configure the project and apps names.
* Modify the `src/app/models/dataModel/EnvAppInfoData.ts` file to configure apps according to your environments.
* Modify the `src/app/models/dataModel/RepoData.ts` file to configure the repository endpoints for your apps.

---

### Running the Project Locally

Once the database and frontend app are set up, run both components:
1. Start the backend (database and PostgREST):
   ```bash
   docker compose up
   ```
2. Start the frontend app:
   ```bash
   pnpm start
   ```

Visit the application in your browser at [http://localhost:4200](http://localhost:4200).

---

### Running the Project in Production

To deploy the project in a production environment:
1. Build the frontend application:
   ```bash
   pnpm run build
   ```
   The build artifacts will be stored in the `dist/` directory.
2. Deploy the `dist/` directory to a web server such as NGINX or Apache.
3. Use a managed database service or host PostgreSQL yourself.
4. Set up PostgREST in production mode with appropriate configurations.
5. Update your environment variables to match the production setup.

> For cloud deployments, consider using services like AWS, GCP, or Azure to host the application securely and scalably.

---

Feel free to contribute to the project or raise issues on GitHub if you encounter any problems!