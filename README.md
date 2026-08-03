# TODO App — DevOps Portfolio Project

**Status**: ✅ Proyecto 4 (Node Exporter) completado
**Last updated**: Agosto 3, 2026

---

## Overview

Laboratorio DevOps progresivo en AWS EC2. Evolución desde una app simple hasta infraestructura con monitoreo, alertas y observabilidad completa.

**IP Pública EC2**: `18.189.29.49`
**OS**: Ubuntu 24.04 LTS
**Instance**: t3.micro (1GB RAM)

---

## Proyecto 1: Initial Deploy (Julio 8, 2026)

### Objetivo
Desplegar aplicación Node.js en Docker en AWS EC2.

### Stack
- App: Node.js 18 + Express
- Container: Docker
- Infrastructure: AWS EC2 (t3.micro)

### Logros
✅ App corriendo en Docker
✅ HTTP server en puerto 80
✅ Acceso desde Internet (IP pública)
✅ Health check: `curl http://18.189.29.49/`

### Arquitectura
```
Internet → AWS EC2 → Docker → Node.js App (puerto 80)
```

### Comandos
```bash
# SSH a EC2
ssh -i ~/.ssh/aws-devops-key ubuntu@18.189.29.49

# Ver contenedor
docker ps

# Logs
docker logs <container_id>
```

---

## Proyecto 2: PostgreSQL + Docker Compose (Julio 8-22, 2026)

### Objetivo
Agregar persistencia de datos con PostgreSQL. Usar Docker Compose para orquestación.

### Stack
- App: Node.js 18 + Express
- DB: PostgreSQL 15
- Orchestration: Docker Compose
- Infrastructure: AWS EC2 + Local development

### Componentes

#### Docker Compose (local + prod)
```yaml
services:
  app:
    build: .
    ports:
      - "80:80"
    environment:
      - DB_HOST=db
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - DB_NAME=todos
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=todos
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

#### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/todos` | List all TODOs |
| POST | `/todos` | Create TODO |

#### Deployment a AWS
```bash
# SSH a EC2
ssh -i ~/.ssh/aws-devops-key ubuntu@18.189.29.49

# Clone + start
git clone https://github.com/hhaguero/todo-devops.git
cd todo-devops
docker compose up -d

# Verify
curl http://18.189.29.49/todos
```

### Logros
✅ PostgreSQL 15 funcionando
✅ Docker Compose orquestando 2 contenedores
✅ Datos persistentes (volúmenes)
✅ Health checks entre servicios
✅ Deployment automático desde GitHub

### Problemas Solucionados
- Conexión app ↔ BD → usar `depends_on` con health checks
- Datos perdidos en reinicio → volúmenes persistentes
- Credenciales hardcodeadas → variables de entorno

---

## Proyecto 3: Monitoreo (Prometheus + Grafana + AlertManager)

**Fecha**: Julio 23-30, 2026
**Status**: ✅ Completado

### Objetivo

Implementar observabilidad completa:
- Recolectar métricas de la app
- Visualizar en dashboards
- Alertas automáticas cuando algo falla
- Notificaciones a Slack en tiempo real

### Stack
- **Metrics Library**: prom-client (v15.1.3)
- **Time Series DB**: Prometheus 2.53.0 (puerto 9090)
- **Visualization**: Grafana 10.4.1 (puerto 3000)
- **Alerting**: AlertManager 0.26.0 (puerto 9093)
- **Notifications**: Slack webhooks
- **Process Manager**: systemd (todas las apps)

### Arquitectura Completa

```
                 Internet
                      │
           AWS EC2 (18.189.29.49)
                      │
      ┌───────────────┼───────────────┐
      │               │               │
   Docker          Prometheus    AlertManager
      │               │               │
   Todo App      (9090)            (9093)
   (80)          Scrapeea          Envía
      │          cada 15s           alertas
      └───────────────┴───────────────┘
                      │
                   Grafana
                   (3000)
                      │
            Dashboards + Queries
                      │
                   Slack
                   (#alerts)
```

### Fase 1: Instrumentación (prom-client)

Agregamos métricas a nivel de código:

```javascript
const prom = require('prom-client');

// HTTP Requests
const httpRequestDuration = new prom.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 5, 15, 50, 100, 500]
});

const httpRequestsTotal = new prom.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Database Queries
const dbQueryDuration = new prom.Histogram({
  name: 'db_query_duration_ms',
  help: 'Duration of database queries in ms',
  labelNames: ['operation'],
  buckets: [0.1, 5, 15, 50, 100]
});

const dbQueriesTotal = new prom.Counter({
  name: 'db_queries_total',
  help: 'Total database queries',
  labelNames: ['operation']
});
```

**Endpoint**: `GET /metrics` expone métricas en formato Prometheus

```
# HELP http_request_duration_ms Duration of HTTP requests in ms
# TYPE http_request_duration_ms histogram
http_request_duration_ms_bucket{le="0.1",method="GET",route="/",status_code="200"} 1
http_request_duration_ms_bucket{le="5",method="GET",route="/",status_code="200"} 10
...
```

### Fase 2: Prometheus (Recolector)

**Qué hace:**
1. Descarga (`scrape`) métricas cada 15 segundos
2. Las almacena en su propia BD (TSDB)
3. Las expone para Grafana

**Config**: `/opt/prometheus/prometheus-2.53.0.linux-amd64/prometheus.yml`

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'todo-app'
    static_configs:
      - targets: ['localhost:80']
    metrics_path: '/metrics'

rule_files:
  - alerts.yml

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['localhost:9093']
```

**Como servicio systemd**: `/etc/systemd/system/prometheus.service`

```ini
[Unit]
Description=Prometheus
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/prometheus/prometheus-2.53.0.linux-amd64
ExecStart=/opt/prometheus/prometheus-2.53.0.linux-amd64/prometheus \
  --config.file=/opt/prometheus/prometheus-2.53.0.linux-amd64/prometheus.yml \
  --storage.tsdb.retention.time=24h
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Ventajas:**
- ✅ Arranca automáticamente en reinicio EC2
- ✅ Reinicia si falla
- ✅ Logs integrados con `journalctl`
- ✅ Retention 24h evita OOM

**Comandos:**
```bash
sudo systemctl status prometheus
sudo systemctl restart prometheus
sudo journalctl -u prometheus -f
```

### Fase 3: Grafana (Visualización)

**Qué hace:**
- Consulta Prometheus
- Dibuja gráficos bonitos
- Crea dashboards interactivos

**Como servicio systemd**: `/etc/systemd/system/grafana.service`

```ini
[Unit]
Description=Grafana
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/grafana-v10.4.1
ExecStart=/opt/grafana-v10.4.1/bin/grafana-server web
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Acceso:**
```
URL: http://18.189.29.49:3000
Username: admin
Password: admin
```

**Data Source:**
- Tipo: Prometheus
- URL: http://localhost:9090

### Fase 4: Dashboards

#### Panel 1: Request Rate
```
Métrica: rate(http_requests_total[1m])
Muestra: Requests por segundo
Umbral alerta: < 1 = poco tráfico, > 100 = mucho tráfico
```

#### Panel 2: Latency p95
```
Métrica: histogram_quantile(0.95, rate(http_request_duration_ms_bucket[5m]))
Muestra: 95% de requests es más rápido que X ms
Ejemplo: p95 = 150ms → 95% de requests < 150ms, 5% > 150ms
Umbral alerta: > 1000ms = app lenta
```

#### Panel 3: Error Rate
```
Métrica: rate(http_requests_total{status_code="500"}[1m]) / rate(http_requests_total[1m]) * 100
Muestra: % de errores 5xx
Ejemplo: 5% = de cada 100 requests, 5 fallan
Umbral alerta: > 5% = algo está mal
```

#### Panel 4: DB Latency p95
```
Métrica: histogram_quantile(0.95, rate(db_query_duration_ms_bucket[5m]))
Muestra: 95% de queries a BD es más rápido que X ms
Umbral alerta: > 500ms = BD lenta
```

### Fase 5: Alertas (AlertManager)

**Archivo de reglas**: `/opt/prometheus/prometheus-2.53.0.linux-amd64/alerts.yml`

```yaml
groups:
  - name: todo-app
    interval: 30s
    rules:
      # Alerta 1: Error rate alto
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.05
        for: 1m
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }}"

      # Alerta 2: Latencia alta
      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_ms_bucket[5m])) > 1000
        for: 2m
        annotations:
          summary: "High latency detected"
          description: "p95 latency is {{ $value }}ms"

      # Alerta 3: Servicio caído
      - alert: ServiceDown
        expr: up{job="todo-app"} == 0
        for: 1m
        annotations:
          summary: "Service is down"
          description: "todo-app is not responding"
```

**Explicación:**
- `expr`: Condición (métrica > umbral)
- `for: 1m`: Espera 1 minuto antes de disparar (evita false positives)
- `annotations`: Mensaje que se envía

**Como servicio systemd**: `/etc/systemd/system/alertmanager.service`

```ini
[Unit]
Description=AlertManager
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/alertmanager-0.26.0.linux-amd64
ExecStart=/opt/alertmanager-0.26.0.linux-amd64/alertmanager --config.file=alertmanager.yml
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Fase 6: Notificaciones (Slack)

**Config**: `/opt/alertmanager-0.26.0.linux-amd64/alertmanager.yml`

```yaml
global:
  resolve_timeout: 5m

route:
  receiver: 'slack'

receivers:
  - name: 'slack'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/T0BLKF4FWTZ/B0BM0TU4FL2/...'
        channel: '#alerts'
        title: 'Alert: {{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
```

**Webhook en Slack:**
1. Ve a https://api.slack.com/messaging/webhooks
2. Create app → From scratch
3. Incoming Webhooks → Toggle ON
4. Add New Webhook → Select #alerts channel
5. Copia URL (guardada en Bitwarden)

### Acceso

| Servicio | URL | Credenciales |
|----------|-----|--------------|
| App | http://18.189.29.49 | - |
| Prometheus | http://18.189.29.49:9090 | - |
| Grafana | http://18.189.29.49:3000 | admin/admin |
| AlertManager | localhost:9093 (interno) | - |

### AWS Security Group

```
Puerto 80:   HTTP (app) ✓
Puerto 9090: Prometheus ✓
Puerto 3000: Grafana ✓
Puerto 5432: PostgreSQL ✓
Puerto 9093: AlertManager (solo interno)
```

### Comandos Útiles

```bash
# Estado de servicios
sudo systemctl status prometheus
sudo systemctl status grafana
sudo systemctl status alertmanager

# Reiniciar
sudo systemctl restart prometheus
sudo systemctl restart grafana
sudo systemctl restart alertmanager

# Logs en tiempo real
sudo journalctl -u prometheus -f
sudo journalctl -u grafana -f
sudo journalctl -u alertmanager -f

# Verificar métricas
curl http://localhost/metrics | grep http_requests_total
curl http://localhost:9090/api/v1/targets
curl http://localhost:9090/api/v1/rules
curl http://localhost:9093/api/v1/alerts

# Test de alertas (dispara ServiceDown)
docker stop 7448e84e8912
# Espera 1-2 min → alerta en Slack #alerts
docker start 7448e84e8912
# Espera 1-2 min → "resolved" en Slack
```

### Problemas Solucionados

| Problema | Causa | Solución |
|----------|-------|----------|
| Prometheus muere en reinicio | Levantado con `nohup` | Crear systemd service |
| OOM Kill (220MB) | EC2 pequeña + muchos datos | `--storage.tsdb.retention.time=24h` |
| Permisos en data/ | Usuario incorrecto | `sudo chown -R ubuntu:ubuntu /opt/prometheus` |
| Alertas no visibles en UI | UI lenta en EC2 pequeña | Verificar con `curl` (API es verdad) |
| AlertManager no notifica | Webhook inválido/canal inexistente | Crear #alerts + verificar URL |
| Grafana tarda en cargar | Recursos limitados | Aceptar latencia o upgradear instancia |

### Conceptos Aprendidos

**Instrumentación**
- Agregar código que mida cosas (requests, queries)
- Usar librerías como `prom-client`

**Scraping (Pull Model)**
- Prometheus descarga datos periódicamente
- No es push (app no envía)
- Ventaja: Prometheus escala fácilmente

**Time Series Database**
- BD optimizada para datos con timestamp
- Compresión automática
- Queries rápidas sobre períodos

**Histogramas vs Contadores**
- Contador: Suma ("¿cuántas?")
- Histograma: Distribución ("¿cuántas en cada rango?")
- Histogramas permiten calcular percentiles

**Percentiles**
- p50 (mediana): 50% más rápido
- p95 (importante): 95% más rápido (user experience)
- p99: 99% más rápido (casos extremos)

**Alerting**
- Condition: `expr > threshold`
- Duration: `for: 1m` evita false positives
- Receiver: Dónde notificar (Slack, email, etc.)
- Deduplication: AlertManager agrupa alertas similares

---

## Proyecto 4: Node Exporter (Métricas del Servidor)

**Fecha**: Agosto 3, 2026
**Status**: ✅ Completado

### Objetivo

Monitorear el **servidor EC2** en sí (CPU, RAM, Disco, Red), no solo la app.

**Problema resuelto:** En P3 tuvimos OOM kills porque no sabíamos cuánta RAM quedaba libre.

### Stack

- **Node Exporter**: v1.8.0 (agente que expone métricas del SO)
- **Prometheus**: Scratchea node en puerto 9100
- **Grafana**: Dashboard "System Metrics" con 4 paneles
- **Alertas**: HighCPU, HighMemory, LowDisk → Slack

### Arquitectura

```
EC2 Ubuntu
├── App (Node.js) → /metrics → http_requests_total, latency
├── Node Exporter → /metrics → node_cpu_seconds_total, node_memory_*
└── PostgreSQL

        ↓

Prometheus (scratchea ambos cada 15s)

        ↓

Grafana (2 dashboards)
├── App Metrics (Request Rate, Latency, Error Rate)
└── System Metrics (CPU, Memory, Disk, Network)

        ↓

AlertManager

        ↓

Slack #alerts
```

### Instalación

#### 1. Descargar Node Exporter
```bash
cd /opt
sudo wget https://github.com/prometheus/node_exporter/releases/download/v1.8.0/node_exporter-1.8.0.linux-amd64.tar.gz
sudo tar xzf node_exporter-1.8.0.linux-amd64.tar.gz
sudo mv node_exporter-1.8.0.linux-amd64 node_exporter
sudo chown -R ubuntu:ubuntu /opt/node_exporter
```

#### 2. Crear systemd service
```bash
sudo nano /etc/systemd/system/node_exporter.service
```

```ini
[Unit]
Description=Prometheus Node Exporter
Documentation=https://github.com/prometheus/node_exporter
After=network.target

[Service]
Type=simple
User=ubuntu
ExecStart=/opt/node_exporter/node_exporter
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable node_exporter
sudo systemctl start node_exporter
```

#### 3. Verificar
```bash
curl http://localhost:9100/metrics | head -20
# Debería mostrar: node_cpu_seconds_total, node_memory_*, etc.
```

### Configuración Prometheus

Editar `prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - localhost:9093

scrape_configs:
  - job_name: "todo-app"
    static_configs:
      - targets: ["localhost:80"]
    metrics_path: "/metrics"

  - job_name: "node"
    static_configs:
      - targets: ["localhost:9100"]

rule_files:
  - alerts.yml
```

Reiniciar:
```bash
sudo systemctl restart prometheus
curl http://localhost:9090/api/v1/targets
# Ambos jobs deben estar "up"
```

### Dashboards en Grafana

#### Dashboard 1: System Metrics

**Panel 1: CPU Usage**
```
Query: (1 - avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m]))) * 100
Unit: Percent (0-100)
Threshold: 50% (rojo - t3.micro limitado)
```

**Panel 2: Memory Usage**
```
Query: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100
Unit: Percent (0-100)
Threshold: 80% (rojo)
```

**Panel 3: Disk Usage /**
```
Query: (1 - (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"})) * 100
Unit: Percent (0-100)
Threshold: 80% (rojo)
```

**Panel 4: Network Bytes/sec**
```
Query: rate(node_network_transmit_bytes_total[1m])
Unit: Data/rate Byte/Sec (SI)
Legend: {{ device }}
```

#### Dashboard 2: App Metrics (actualizado)

| Panel | Query | Unit |
|-------|-------|------|
| Request Rate | `rate(http_requests_total[1m])` | Reqps |
| Latency p95 | `histogram_quantile(0.95, rate(http_request_duration_ms_bucket[5m]))` | ms |
| Error Rate | `rate(http_requests_total{status_code="500"}[1m]) / rate(http_requests_total[1m]) * 100` | Percent |

### Alertas Agregadas

```yaml
  - alert: HighCPU
    expr: (100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m]) * 100))) > 50
    for: 2m
    annotations:
      summary: "⚠️ CPU > 50% en {{ $labels.instance }}"
      description: "CPU usage: {{ $value | humanizePercentage }}"

  - alert: HighMemory
    expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) > 0.8
    for: 2m
    annotations:
      summary: "⚠️ Memoria > 80% en {{ $labels.instance }}"
      description: "RAM disponible: {{ $value | humanizePercentage }}"

  - alert: LowDisk
    expr: (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) < 0.2
    for: 2m
    annotations:
      summary: "⚠️ Disco < 20% disponible en {{ $labels.instance }}"
      description: "Espacio: {{ $value | humanizePercentage }}"

  - alert: HighLatencyNoBugs
    expr: histogram_quantile(0.95, rate(http_request_duration_ms_bucket[5m])) > 1000 and rate(http_requests_total{status_code="500"}[5m]) == 0
    for: 2m
    annotations:
      summary: "⚠️ Latencia alta sin errores (BD?)"
      description: "Latency: {{ $value }}ms, Error Rate: 0%"
```

**Explicación:**
- `HighCPU/HighMemory/LowDisk`: Métricas del servidor
- `HighLatencyNoBugs`: Detección indirecta de problemas de BD

### Cambios en la App

Agregamos `prom-client` para exponer `/metrics`:

**package.json:**
```json
{
  "name": "todo-app",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "prom-client": "^15.0.0"
  }
}
```

**server.js:**
```javascript
const express = require('express');
const client = require('prom-client');
const app = express();
const PORT = process.env.PORT || 3000;

// Registrar métricas
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 5, 15, 50, 100, 500, 1000, 2500, 5000],
  registers: [register]
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

// Middleware para medir latencia
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    httpRequestDuration.labels(req.method, req.path, res.statusCode).observe(duration);
    httpRequestTotal.labels(req.method, req.path, res.statusCode).inc();
  });
  next();
});

app.use(express.json());

// Endpoint de métricas
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.get('/', (req, res) => {
  res.json({ message: 'TODO App API running' });
});

app.get('/api/tasks', (req, res) => {
  res.json({ tasks: [{ id: 1, title: 'Sample task', completed: false }] });
});

app.post('/api/tasks', (req, res) => {
  res.json({ id: 2, title: req.body.title, completed: false });
});

app.get('/error', (req, res) => {
  res.status(500).json({ error: 'Test error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Acceso

| Componente | URL |
|-----------|-----|
| Node Exporter | http://18.189.29.49:9100/metrics |
| App Metrics Dashboard | http://18.189.29.49:3000 (admin/admin) |
| System Metrics Dashboard | http://18.189.29.49:3000 (admin/admin) |

### Comandos

```bash
# Verificar Node Exporter
curl http://localhost:9100/metrics | grep node_cpu

# Verificar Prometheus scratchea
curl http://localhost:9090/api/v1/targets

# Verificar app expone /metrics
curl http://localhost/metrics | grep http_requests_total

# Ver alertas
curl http://localhost:9090/api/v1/alerts

# Generar carga para testear
stress-ng --cpu 4 --timeout 120s
```

### Conceptos

**Pull vs Push**
- **Pull** (Prometheus): Prometheus pregunta "¿qué métricas tienes?"
- **Push** (alternativa): App dice "aquí están mis métricas"
- Ventaja Pull: Prometheus controla scraping, fácil escalar

**Node Exporter**
- Agente pequeño (~15MB) que lee SO
- Exporta: CPU, RAM, Disco, Red, Procesos, Uptime
- Compatible con Prometheus
- Se usa en 90% de deployments Prometheus

**Thresholds en P4**
- P3 (App): > 1000ms latency, > 5% error rate
- P4 (Server): > 50% CPU, > 80% RAM, < 20% disco (t3.micro es limitado)

### Problemas Aprendidos

| Problema | Causa | Solución |
|----------|-------|----------|
| OOM kills en P3 | t3.micro sin visibilidad de RAM | Node Exporter → ver RAM en Grafana |
| Threshold 80% no dispara | t3.micro burstable limitado | Bajar a 50% |
| `/metrics` no funciona | app no tiene prom-client | Agregar librería + código |
| Regex `status_code=~"5.."` vacío | Prometheus regex confuso | Usar `status_code="500"` específico |
| Error Rate sin datos | No había errores 500 | Crear endpoint `/error` para test |

### Próximos Pasos

- [ ] cAdvisor (métricas por contenedor Docker)
- [ ] Alertas de Network saturation
- [ ] Custom metrics (business-level: auth attempts, etc.)
- [ ] Migraciones a VictoriaMetrics (escala)
- [ ] Long-term storage (compresión)

---

## GitHub Actions CI/CD

**Workflow**: `.github/workflows/deploy.yml`

Cada `git push` a `main`:
1. ✅ Build imagen Docker
2. ✅ Push a Docker Hub
3. ✅ SSH a EC2
4. ✅ Pull imagen nueva
5. ✅ Restart contenedor

**Secrets configurados:**
- `DOCKER_USERNAME`: Docker Hub user
- `DOCKER_PASSWORD`: Docker Hub PAT token
- `EC2_HOST`: IP pública (18.189.29.49)
- `EC2_USER`: ubuntu
- `EC2_SSH_KEY`: Clave privada SSH

---

## Infrastructure Overview

```
Local Development
├── git + SSH keys
├── Docker + Docker Compose
├── VS Code
└── Bitwarden (credentials)

AWS Production (EC2 t3.micro)
├── Ubuntu 24.04 LTS
├── Docker Engine
├── Services (systemd):
│   ├── Todo App (Node.js) - puerto 80
│   ├── Prometheus - puerto 9090
│   ├── Grafana - puerto 3000
│   ├── AlertManager - puerto 9093
│   └── Node Exporter - puerto 9100
└── PostgreSQL (Docker) - puerto 5432

Internet
├── SSH (puerto 22)
├── HTTP (puerto 80)
├── Prometheus (puerto 9090)
└── Grafana (puerto 3000)

GitHub
├── Repo: hhaguero/todo-devops
├── Actions: CI/CD workflow
└── Secrets: Credentials (auto-injected)

Slack
└── Workspace: Alerts channel (#alerts)
```

---

## Tech Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **App** | Node.js 18 + Express | REST API |
| **Database** | PostgreSQL 15 | Data persistence |
| **Container** | Docker | Reproducible environment |
| **Orchestration** | Docker Compose | Multi-container management |
| **App Metrics** | prom-client | Instrument code |
| **Server Metrics** | Node Exporter | OS-level metrics |
| **Time Series DB** | Prometheus 2.53.0 | Collect + store metrics |
| **Visualization** | Grafana 10.4.1 | Dashboards + queries |
| **Alerting** | AlertManager 0.26.0 | Alert routing |
| **Notifications** | Slack webhooks | Instant notifications |
| **Process Manager** | systemd | Service management |
| **Infrastructure** | AWS EC2 t3.micro | Cloud compute |
| **CI/CD** | GitHub Actions | Automated deployment |
| **Secrets** | Bitwarden | Credential storage |

---

## Learning Outcomes

### Proyecto 1
- Docker basics (build, run, push)
- AWS EC2 (instances, security groups, IPs)
- Port mapping
- Health checks

### Proyecto 2
- Docker Compose (multiple services)
- Database connections
- Environment variables
- Persistent volumes
- Service dependencies
- Health checks
- Git + GitHub

### Proyecto 3
- Metrics instrumentation (prom-client)
- Time series databases
- Prometheus architecture (scraping, retention)
- Grafana (dashboards, queries, visualizations)
- Alerting (conditions, thresholds, receivers)
- Slack integration
- systemd services
- Observability best practices
- Troubleshooting (OOM, permissions, networking)

### Proyecto 4
- Node Exporter installation + systemd
- Server-level metrics (CPU, RAM, Disk, Network)
- Multi-target Prometheus scraping
- Alerting on infrastructure (not just app)
- Capacity planning + resource constraints
- Detecting indirect issues (high latency without errors = BD problem)

---

## Portfolio Value

**Projects show:**
✅ End-to-end infrastructure automation
✅ Container orchestration
✅ Database integration
✅ App-level monitoring
✅ Infrastructure-level monitoring
✅ Alerting + notifications
✅ CI/CD pipelines
✅ AWS cloud skills
✅ Linux/systemd knowledge
✅ Troubleshooting real issues (OOM, permissions, networking)
✅ Best practices (retention, health checks, redundancy)
✅ Observability at scale

---

## Getting Started (for recruiters/viewers)

### Prerequisites
```bash
Docker & Docker Compose
AWS account (or local testing)
2GB free disk space
Git
```

### Run Locally
```bash
git clone https://github.com/hhaguero/todo-devops.git
cd todo-devops
docker compose up -d

# Verify
curl http://localhost/
curl http://localhost/todos
```

### Deploy to AWS
```bash
# SSH to EC2
ssh -i ~/.ssh/aws-devops-key ubuntu@18.189.29.49

# Clone + start
git clone https://github.com/hhaguero/todo-devops.git
cd todo-devops
docker compose up -d

# Access
curl http://18.189.29.49/
```

### View Dashboards
```
Grafana: http://18.189.29.49:3000 (admin/admin)
Prometheus: http://18.189.29.49:9090
Node Exporter: http://18.189.29.49:9100/metrics
```

---

## Author

DevOps learner on a structured 18-month learning plan:
- Phase 1 ✅: Linux fundamentals
- Phase 2 ✅: Docker + PostgreSQL
- Phase 3 ✅: AWS + Monitoring
- Phase 4 ⏳: Kubernetes + Advanced CI/CD
- Phase 5 ⏳: Portfolio projects + Job search

---

**Last updated**: Agosto 3, 2026
**Status**: Proyecto 4 (Node Exporter) ✅ Completado
**Next**: Proyecto 5 (cAdvisor + Docker Compose completo)
```
