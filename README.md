# TODO App — DevOps Portfolio Project

## Overview
A containerized Node.js TODO application deployed on AWS EC2 with Docker. 
Demonstrates core DevOps skills: containerization, infrastructure setup, 
documentation, and application deployment.

## Architecture
- **Compute**: AWS EC2 (t3.micro, Ubuntu 24.04 LTS)
- **Container Runtime**: Docker
- **Application**: Node.js Express-based HTTP server
- **Port**: 80 (HTTP)
- **Public IP**: 18.189.29.49

## Deployment

### Prerequisites
- Docker (v24.0+)
- Node.js 18+ (for local development)
- AWS EC2 instance (or any Linux server with Docker)

### Local Build & Run
```bash
# Build image
docker build -t todo-app:latest .

# Run container
docker run -d -p 80:80 --name todo-app todo-app:latest

# Verify
curl http://localhost:80/
```

### Production Deployment (on EC2)
```bash
ssh -i ~/.ssh/aws-devops-key ubuntu@18.189.29.49
cd /home/ubuntu/todo-app
docker build -t todo-app:latest .
docker run -d -p 80:80 --restart=always --name todo-app todo-app:latest
```

**Access**: http://18.189.29.49/

## API Endpoints
- `GET /` — Returns JSON with app status
- Response: `{"status":"OK","version":"1.0"}`

## AWS Infrastructure
- **Security Group**: SSH (22), HTTP (80), HTTPS (443) inbound
- **Key Pair**: `aws-devops-key` (imported from local)
- **Free Tier**: t3.micro eligible, no charges

## Next Steps (Learning Roadmap)
- [ ] Add PostgreSQL database and connection pooling
- [ ] Implement CI/CD pipeline (GitHub Actions)
- [ ] Add Prometheus monitoring
- [ ] Migrate to Kubernetes (Minikube → AWS EKS)
- [ ] Infrastructure as Code (Terraform)

## Learning Documentation
Detailed runbooks on Linux, Docker, AWS, and deployment procedures stored in personal Obsidian vault.

## Author
DevOps learner — 18-month learning plan
- Phase 1 (Completed): Linux fundamentals
- Phase 2 (In Progress): Docker & first projects
- Phase 3: AWS + Terraform + Certifications

---
**Last updated**: July 6, 2026
