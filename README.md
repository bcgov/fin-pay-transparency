[![Lifecycle:Maturing](https://img.shields.io/badge/Lifecycle-Maturing-007EC6)](https://github.com/bcgov/fin-pay-transparency)

| Service in Monorepo | SonarCloud                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| frontend          | [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=fin-pay-transparency_frontend&metric=alert_status)](https://sonarcloud.io/project/overview?id=fin-pay-transparency_frontend) [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=fin-pay-transparency_frontend&metric=coverage)](https://sonarcloud.io/summary/new_code?id=fin-pay-transparency_frontend)                                 |
| backend           | [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=fin-pay-transparency_backend&metric=alert_status)](https://sonarcloud.io/project/overview?id=fin-pay-transparency_backend) [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=fin-pay-transparency_backend&metric=coverage)](https://sonarcloud.io/summary/new_code?id=fin-pay-transparency_backend)                                     |
| doc-gen-service   | [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=fin-pay-transparency_doc-gen-service&metric=alert_status)](https://sonarcloud.io/project/overview?id=fin-pay-transparency_doc-gen-service) [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=fin-pay-transparency_doc-gen-service&metric=coverage)](https://sonarcloud.io/summary/new_code?id=fin-pay-transparency_doc-gen-service)     |
| backend-external  | [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=fin-pay-transparency_backend-external&metric=alert_status)](https://sonarcloud.io/project/overview?id=fin-pay-transparency_backend-external) [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=fin-pay-transparency_backend-external&metric=coverage)](https://sonarcloud.io/summary/new_code?id=fin-pay-transparency_backend-external) |

# Pay Transparency Reporting Tool

Pay Transparency Reporting Tool is a webapp that employers use to generate a pdf report. The [Gender equity - Pay transparency](http://https://www2.gov.bc.ca/gov/content/gender-equity/pay-transparency-in-bc "Gender equity - Pay transparency") website has more information and a link to the tool.

## Key Technologies Used

- OpenShift and helm charts
- PostgreSQL and Prisma
- node.js
- Vue and Vuetify
- Vite
- jest, vitest, and playwright
- ESLint and Prettier
- SonarCloud

## GitHub Actions

### Automatic actions

- Pull requests automatically create a temporary instance on OpenShift and are automatically removed when merged to main
- Unit tests, integration tests, and end-to-end test are automatically performed.
- SonarCloud scans

### Manual actions

- Deploy to Test environment
- Deploy to Prod environment

## Local Environment Setup

### Prerequisites

1. BC Gov VPN
1. Keycloak and BCeID authorization
1. Podman (or equivalent for running docker containers)
1. Node.js
1. Ports need to be available for the application to work locally
   - 8081 frontend
   - 3000 backend
   - 3001 doc-gen-service
   - 3002 backend-external
   - 5432 postgres

### Repo setup

1. Clone repo

1. Create .env for backend

1. (Optional) A VSCode workspace is provided in .vscode/fin-pay-transparency.code-workspace which can easily install npm packages and launch all services.

1. Install npm packages for each project in repo

   `npm -C backend install`

   `npm -C backend-external install`

   `npm -C doc-gen-service install`

   `npm -C frontend install`

1. Build and start the database container

   `podman-compose up --build -d database`

1. Run the database migrations to create/update the database for this project

   `podman-compose up -d database-migrations`

### Start servers

- The backend requires the doc-gen-service and the database docker container to be running.
- The backend-external requires the backend service to be running.
- The frontend requires the backend to be running in order to login.

`npm -C backend run dev`

`npm -C backend-external run dev`

`npm -C doc-gen-service run dev`

`npm -C frontend run serve`

### Tests

#### Unit

All projects have unit tests and can be run with

`npm run test`

#### Integration

Only backend-external has integration tests. Requires that backend-external and backend services be running.

`npm run test:integration`

#### End-to-end

The frontend end-to-end test is performed by playwright.

First install playwright tools:

`npx playwright install --with-deps`

Then run the tests:

`npm run e2e`
