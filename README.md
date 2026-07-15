# Workforce Workflow API

A simple workflow management API with users, templates, items, and transition rules.

## Features

- Create and list users
- Create, update, and delete templates
- Assign users to templates
- Create workflow items
- Transition items through configured stages
- Persist workflow state in PostgreSQL

## Requirements

- Node.js 20+
- Docker Desktop (optional, for running PostgreSQL and the app in containers)
- PostgreSQL (optional if you want to run the app outside Docker)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the database

The app uses the DATABASE_URL environment variable.

For Docker-based PostgreSQL, the compose file uses:

```bash
DATABASE_URL=postgres://postgres:postgres@db:5432/workforce
```

If you want to run locally instead, set:

```bash
set DATABASE_URL=postgres://postgres:postgres@localhost:5432/workforce
```

### 3. Start the app

#### With Docker

```bash
docker compose up --build
```

The API will be available at:

- http://localhost:3000/health

#### Without Docker

```bash
npm run build
node dist/index.js
```

## API endpoints

### Health

```bash
GET /health
```

### Users

```bash
POST /users
GET /users
GET /users/admin
GET /users/reviewer
GET /users/employee
```

### Templates

```bash
GET /templates
POST /templates
PUT /templates/:id
DELETE /templates/:id
POST /templates/:id/assign-users
```

### Workflow items

```bash
POST /items
GET /items
POST /items/:id/transition
```

## Testing

Run the automated tests:

```bash
npm test
```

## Database inspection

If you are using the Docker Postgres setup, you can inspect the database with:

```bash
docker compose exec db psql -U postgres -d workforce
```

Then run:

```sql
SELECT * FROM workflow_state;
```

## Notes

- The app currently persists workflow state in a single PostgreSQL row in the workflow_state table.
- If you change the database credentials, update DATABASE_URL accordingly.
