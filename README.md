# TODO App — DevOps Portfolio Project

## Overview
A containerized Node.js TODO application with PostgreSQL backend deployed using Docker Compose. 
Demonstrates core DevOps skills: containerization, database integration, infrastructure orchestration, 
and application deployment.

## Architecture Evolution

### v1.0 (Initial)
- Single container (Node.js app)
- Deployed on AWS EC2 (t3.micro, Ubuntu 24.04 LTS)
- Public IP: 18.189.29.49
- Simple HTTP server on port 80

### v2.0 (Current - PostgreSQL Integration)
- **Local Development**: Docker Compose (2 containers)
  - App: Node.js 18 + Express (port 80)
  - Database: PostgreSQL 15 (port 5432)
- **Production Ready**: Can deploy to AWS EC2 or Kubernetes
- Persistent data with PostgreSQL volumes
- Service health checks and dependencies

## Current Architecture
Docker Compose
├── todo-app (Node.js 18-Alpine)
│   ├── Port: 80
│   ├── Dependencies: express, pg
│   └── Connected to: PostgreSQL
└── todo-db (PostgreSQL 15-Alpine)
├── Port: 5432
├── Database: todos
└── Persistent volume: postgres_data

## Quick Start (Local)

### Prerequisites
- Docker & Docker Compose (v2.0+)
- 2GB free disk space

### Run
```bash
git clone https://github.com/hhaguero/todo-devops.git
cd todo-devops
docker compose up -d
```

### Verify
```bash
# Health check
curl http://localhost/

# Get all TODOs
curl http://localhost/todos

# Create TODO
curl -X POST http://localhost/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"Learn DevOps"}'
```

**Expected responses:**
```json
{"status":"OK","version":"2.0","feature":"PostgreSQL"}
{"todos":[{"id":1,"title":"Learn DevOps","completed":false,"created_at":"2026-07-08T..."}]}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/todos` | List all TODOs |
| POST | `/todos` | Create new TODO (requires `title` in body) |

## Docker Compose Services

### `db` (PostgreSQL)
- Image: `postgres:15-alpine`
- Environment: `POSTGRES_USER=postgres`, `POSTGRES_PASSWORD=postgres`, `POSTGRES_DB=todos`
- Port: `5432`
- Volume: `postgres_data` (persistent storage)
- Health check: `pg_isready` (10s interval)

### `app` (Node.js)
- Build: From local `Dockerfile`
- Environment: Database credentials (auto-connected via `depends_on`)
- Port: `80`
- Command: `npm install && npm start`
- Depends on: `db` service (waits for healthy status)

## File Structure
todo-devops/
├── README.md
├── package.json (dependencies: express, pg)
├── server.js (Express + PostgreSQL logic)
├── Dockerfile (Node.js 18-Alpine)
├── docker-compose.yml (orchestration)
└── .gitignore (Node.js)

## Learning Outcomes
- Docker image building and containerization
- Docker Compose for multi-container orchestration
- PostgreSQL connection pooling in Node.js
- Environment-based configuration
- Database schema initialization
- REST API design
- Health checks and service dependencies

## Development

### View logs
```bash
docker compose logs -f app
docker compose logs -f db
```

### Stop services
```bash
docker compose down
```

### Reset database
```bash
docker compose down -v  # removes volumes
docker compose up -d
```

## Deployment to AWS EC2

```bash
# SSH into EC2 instance
ssh -i ~/.ssh/aws-devops-key ubuntu@18.189.29.49

# Clone repo
git clone https://github.com/hhaguero/todo-devops.git
cd todo-devops

# Start services
docker compose up -d

# Access app
curl http://18.189.29.49/
```

## Next Steps (Roadmap)
- [ ] Automated deployment script (Bash)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Database migrations (Flyway)
- [ ] Monitoring (Prometheus + Grafana)
- [ ] Deploy to AWS ECS or Kubernetes
- [ ] Add authentication & authorization
- [ ] Integration tests

## Author
DevOps learner — 18-month learning plan
- **Phase 1** (Completed): Linux fundamentals
- **Phase 2** (In Progress): Docker containerization + PostgreSQL integration
- **Phase 3**: AWS + Terraform + Certifications
- **Phase 4**: Kubernetes + CI/CD + Monitoring
- **Phase 5**: Portfolio projects + Job search

---
**Last updated**: July 8, 2026
**Status**: PostgreSQL integration complete ✓
