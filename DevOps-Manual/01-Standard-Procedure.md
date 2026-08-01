# Manual Estándar DevOps - Procedimiento Completo

**Versión**: 1.0
**Última actualización**: Julio 30, 2026
**Objetivo**: Estandarizar el procedimiento de levantar infraestructura y desplegar aplicaciones

---

## Tabla de Contenidos

1. [Pre-Deployment Checklist](#1-pre-deployment-checklist)
2. [Capacity Planning](#2-capacity-planning)
3. [Infrastructure Setup](#3-infrastructure-setup)
4. [Application Deployment](#4-application-deployment)
5. [Monitoring Setup](#5-monitoring-setup)
6. [Troubleshooting](#6-troubleshooting)
7. [Glosario DevOps (Inglés/Español)](#7-glosario-devops)
8. [Template - Proyecto Nuevo](#8-template---proyecto-nuevo)

---

## 1. Pre-Deployment Checklist (CHARLA - Preguntas para devs)

Antes de levantar cualquier infraestructura, verificar:

### 1.1 Planificación

- [ ] **Objetivo claro**: ¿Qué se va a desplegar? (app, BD, monitoring)
- [ ] **Público objetivo**: ¿Cuántos usuarios/requests esperados?
- [ ] **Presupuesto**: ¿Cuánto se puede gastar en infraestructura?
- [ ] **Timeline**: ¿Fecha de lanzamiento?
- [ ] **Escalabilidad**: ¿Se espera crecimiento? ¿En qué plazo?

### 1.2 Requerimientos Técnicos

- [ ] **Lenguaje/Framework**: ¿Node.js, Python, Java?
- [ ] **Base de datos**: ¿PostgreSQL, MySQL, MongoDB?
- [ ] **Dependencias**: ¿Qué librerías externas necesita?
- [ ] **Puertos**: ¿Cuáles necesita abrir?
- [ ] **Memoria estimada**: ¿Cuánta RAM necesita?
- [ ] **Disco estimado**: ¿Cuánto espacio ocupa?

### 1.3 Seguridad

- [ ] **Credenciales**: ¿Dónde guardar (Bitwarden, AWS Secrets)?
- [ ] **SSH Keys**: ¿Generadas y guardadas?
- [ ] **Firewall**: ¿Security Group configurado?
- [ ] **HTTPS**: ¿Necesita certificado SSL?
- [ ] **Backups**: ¿Plan de recuperación?

### 1.4 Documentación

- [ ] **README**: ¿Cómo levantar la app?
- [ ] **Architecture diagram**: ¿Dibujo de la infraestructura?
- [ ] **Decisiones**: ¿Por qué elegiste X en lugar de Y?
- [ ] **Procedimiento**: ¿Paso a paso documentado?

---

## 2. Capacity Planning

Calcular recursos ANTES de elegir infraestructura.

### 2.1 Estimación de Recursos

**Componente por componente:**

```

Aplicación (Node.js idle): 80-150 MB Base de datos (vacía): 100-200 MB Prometheus (recolector): 150-300 MB (según retention) Grafana (visualización): 80-150 MB AlertManager (alertas): 50-100 MB Sistema Operativo (Ubuntu): 300-500 MB Margen de seguridad (20%): Variable

TOTAL = Suma de todos + margen

```

### 2.2 Fórmula de Carga Concurrente

**Cuando múltiples usuarios usan la app al mismo tiempo:**

```

Memoria máxima = (Memoria idle) + (Conexiones concurrentes × Memoria por conexión)

Ejemplo: App idle: 100 MB Conexiones concurrentes: 50 usuarios Memoria por conexión: 5 MB Máximo esperado: 100 + (50 × 5) = 350 MB

```

### 2.3 Crecimiento de Datos

**La BD crece con el tiempo:**

```

Tamaño actual: 10 MB Crecimiento mensual: 2 MB Plazo planificación: 12 meses

Tamaño en 12 meses: 10 + (12 × 2) = 34 MB Agregar 50% de buffer: 34 × 1.5 = 51 MB

```

### 2.4 Oversizing (Sobre-dimensionamiento)

**Regla práctica:**

```

Capacidad elegida = (Pico máximo estimado) × 1.5 a 2.0

Ejemplo: Pico máximo: 500 MB Sobre-dimensionamiento: 500 × 1.5 = 750 MB Elegir instancia con: 1 GB o más

```

### 2.5 Tabla de Referencia (Instancias AWS)

| Instancia | RAM | Uso |
|-----------|-----|-----|
| t3.micro | 1 GB | Testing, desarrollo |
| t3.small | 2 GB | Apps pequeñas |
| t3.medium | 4 GB | Apps medianas |
| t3.large | 8 GB | Apps grandes |

**Regla:** Usa una categoría mayor a la calculada.

### 2.6 Retention Policies (Políticas de Retención)

**Limitar datos almacenados:**

```

Prometheus (métricas):

- Retención 24h: ~200-300 MB
- Retención 7 días: ~1-2 GB
- Retención 30 días: ~4-8 GB

Logs (aplicación):

- Retención 7 días: ~500 MB - 1 GB
- Retención 30 días: ~2-5 GB

Base de datos:

- Configurar limpieza de datos históricos
- Archiving de logs antiguos

```

**Configuración en Prometheus:**
```

--storage.tsdb.retention.time=24h

```

### 2.7 Checklist Capacity Planning

- [ ] Estimación de recursos por componente
- [ ] Suma total vs capacidad disponible
- [ ] Proyección de crecimiento (6-12 meses)
- [ ] Oversizing aplicado (1.5-2x)
- [ ] Retention policies definidas
- [ ] Load testing planificado
- [ ] Alertas de capacidad configuradas

---

## 3. Infrastructure Setup

Preparar el servidor antes de desplegar app.

### 3.1 Elegir Proveedor Cloud

**Opciones:**
- AWS EC2 (recomendado para empezar)
- Google Cloud (similar)
- Azure (similar)
- Linode (más barato)
- DigitalOcean (más simple)

### 3.2 Crear Instancia

**AWS EC2 (ejemplo):**

```

1. EC2 Dashboard → Instances → Launch Instance
2. AMI: Ubuntu 24.04 LTS
3. Instance type: t3.small (mínimo para prod)
4. Storage: 30-50 GB (SSD)
5. Security Group: abrir puertos necesarios
6. Key pair: guardar .pem file
7. Launch → copiar IP pública

````

### 3.3 Acceso Inicial

**SSH a la instancia:**

```bash
ssh -i /path/to/key.pem ubuntu@<IP_PUBLICA>
````

**Primeras actualizaciones:**

```bash
sudo apt update
sudo apt upgrade -y
```

### 3.4 Instalar Docker

```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Agregar usuario a grupo docker
sudo usermod -aG docker $USER
newgrp docker

# Verificar
docker --version
```

### 3.5 Instalar Docker Compose

```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose --version
```

### 3.6 Configurar Security Group (Firewall)

**AWS Console → Security Groups:**

```
Abrir puertos necesarios:
- Puerto 22:   SSH (para acceso remoto)
- Puerto 80:   HTTP (aplicación)
- Puerto 443:  HTTPS (si usa SSL)
- Puerto 5432: PostgreSQL (si necesario)
- Puerto 9090: Prometheus (monitoreo)
- Puerto 3000: Grafana (dashboards)
```

### 3.7 Credenciales y Secrets

**Generar SSH keys (local):**

```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/devops-key
```

**Guardar en Bitwarden:**

- SSH private key
- SSH public key
- AWS access keys
- Database passwords
- API tokens

### 3.8 Checklist Infrastructure

- [ ] Instancia creada y corriendo
- [ ] SSH accesible
- [ ] OS actualizado (apt update/upgrade)
- [ ] Docker instalado
- [ ] Docker Compose instalado
- [ ] Security Group configurado
- [ ] SSH keys generadas y guardadas
- [ ] Credenciales en Bitwarden
- [ ] IP pública anotada
- [ ] Backup plan definido

---

## 4. Application Deployment

Desplegar la aplicación en el servidor.

### 4.1 Preparar Código

**En repositorio local:**

```
Estructura mínima:
├── Dockerfile          (cómo construir imagen)
├── docker-compose.yml  (orquestación)
├── .env.example        (variables de entorno)
├── .gitignore          (qué NO subir a GitHub)
├── README.md           (instrucciones)
├── package.json        (dependencias Node.js)
└── server.js           (código)
```

### 4.2 Dockerfile

**Ejemplo genérico:**

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 80

CMD ["npm", "start"]
```

### 4.3 Docker Compose

**Orquestación (app + BD):**

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "80:80"
    environment:
      - DB_HOST=db
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - DB_NAME=app_db
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=app_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  postgres_data:
```

### 4.4 Variables de Entorno

**Archivo `.env` (NO subir a GitHub):**

```
DB_HOST=db
DB_USER=postgres
DB_PASSWORD=SECURE_PASSWORD
DB_NAME=app_db
NODE_ENV=production
APP_PORT=80
```

### 4.5 Deploy a Servidor

**En servidor remoto:**

```bash
# SSH
ssh -i ~/.ssh/key.pem ubuntu@<IP>

# Clonar repositorio
git clone https://github.com/user/repo.git
cd repo

# Crear .env (con valores reales, NO del .env.example)
nano .env

# Levantar servicios
docker-compose up -d

# Verificar
docker-compose ps
docker logs <container_name>
```

### 4.6 Verificar Deployment

```bash
# Health check
curl http://localhost/

# Ver contenedores
docker ps

# Ver logs
docker logs -f <container_name>

# Ver uso de recursos
docker stats
```

### 4.7 CI/CD (Automatizar Deployment)

**GitHub Actions (deploy automático):**

```yaml
name: Deploy to EC2

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Build Docker image
        run: docker build -t repo/app:latest .

      - name: Push to Docker Hub
        run: docker push repo/app:latest

      - name: Deploy to EC2
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ${{ secrets.EC2_USER }}
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd app
            docker-compose pull
            docker-compose up -d
```

### 4.8 Checklist Application Deployment

- [ ] Código en GitHub (público o privado)
- [ ] Dockerfile creado y testeado
- [ ] docker-compose.yml creado
- [ ] .env.example documentado
- [ ] README con instrucciones
- [ ] Deploy manual funcionando
- [ ] CI/CD pipeline configurado
- [ ] Health checks definidos
- [ ] Logs accesibles
- [ ] Rollback plan definido

---

## 5. Monitoring Setup

Observabilidad desde el inicio.

### 5.1 ¿Por qué Monitoring?

**Sin monitoreo:**

- No sabes si la app funciona
- No sabes cuándo falla
- No sabes por qué es lenta
- Debugging en la oscuridad

**Con monitoreo:**

- Ves todo en tiempo real
- Alertas automáticas
- Debugging guiado por datos
- Decisiones informadas

### 5.2 Stack Monitoring Estándar

```
Aplicación
  ↓ (expone métricas)
Prometheus (recolecta)
  ↓
Grafana (visualiza)
  ↓
AlertManager (alerta)
  ↓
Slack/Email (notifica)
```

### 5.3 Instrumentación (Agregar Métricas)

**En aplicación (Node.js + prom-client):**

```javascript
const prom = require('prom-client');

// HTTP Requests
const httpDuration = new prom.Histogram({
  name: 'http_request_duration_ms',
  help: 'HTTP request latency',
  labelNames: ['method', 'route', 'status_code']
});

const httpTotal = new prom.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Endpoint /metrics
app.get('/metrics', (req, res) => {
  res.set('Content-Type', prom.register.contentType);
  res.end(prom.register.metrics());
});
```

### 5.4 Prometheus (Recolector)

**Instalar:**

```bash
cd /opt
wget https://github.com/prometheus/prometheus/releases/download/v2.53.0/prometheus-2.53.0.linux-amd64.tar.gz
tar xzf prometheus-2.53.0.linux-amd64.tar.gz
```

**Configurar (`prometheus.yml`):**

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'app'
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

**Como servicio systemd:**

```ini
[Unit]
Description=Prometheus
After=network.target

[Service]
Type=simple
User=ubuntu
ExecStart=/opt/prometheus/prometheus --config.file=/opt/prometheus/prometheus.yml --storage.tsdb.retention.time=24h
Restart=always

[Install]
WantedBy=multi-user.target
```

### 5.5 Grafana (Visualización)

**Instalar:**

```bash
cd /opt
wget https://dl.grafana.com/oss/release/grafana-10.4.1.linux-amd64.tar.gz
tar xzf grafana-10.4.1.linux-amd64.tar.gz
```

**Como servicio systemd:**

```ini
[Unit]
Description=Grafana
After=network.target

[Service]
Type=simple
User=ubuntu
ExecStart=/opt/grafana-v10.4.1/bin/grafana-server web
Restart=always

[Install]
WantedBy=multi-user.target
```

**Acceso:** `http://<IP>:3000` (admin/admin)

### 5.6 AlertManager (Alertas)

**Instalar:**

```bash
cd /opt
wget https://github.com/prometheus/alertmanager/releases/download/v0.26.0/alertmanager-0.26.0.linux-amd64.tar.gz
tar xzf alertmanager-0.26.0.linux-amd64.tar.gz
```

**Configurar (`alertmanager.yml`):**

```yaml
global:
  resolve_timeout: 5m

route:
  receiver: 'slack'

receivers:
  - name: 'slack'
    slack_configs:
      - api_url: 'https://hooks.slack.com/...'
        channel: '#alerts'
        title: 'Alert: {{ .GroupLabels.alertname }}'
```

### 5.7 Reglas de Alerta

**Archivo `alerts.yml`:**

```yaml
groups:
  - name: app_alerts
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.05
        for: 1m
        annotations:
          summary: "Error rate > 5%"

      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_ms_bucket[5m])) > 1000
        for: 2m
        annotations:
          summary: "Latency p95 > 1s"

      - alert: ServiceDown
        expr: up{job="app"} == 0
        for: 1m
        annotations:
          summary: "App is down"

      - alert: HighMemory
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.80
        for: 5m
        annotations:
          summary: "Memory usage > 80%"

      - alert: HighCPU
        expr: 100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        annotations:
          summary: "CPU usage > 80%"

      - alert: DiskUsage
        expr: (node_filesystem_avail_bytes{fstype!~"tmpfs"} / node_filesystem_size_bytes) < 0.20
        for: 5m
        annotations:
          summary: "Disk usage > 80%"
```

### 5.8 Dashboards en Grafana

**Paneles mínimos:**

1. **Request Rate**: `rate(http_requests_total[1m])` → requests/sec
2. **Latency p95**: `histogram_quantile(0.95, ...)` → ms
3. **Error Rate**: `rate(http_requests_total{status_code=~"5.."}[1m]) / rate(...) * 100` → %
4. **Memory Usage**: `(node_memory_MemTotal - node_memory_MemAvailable) / node_memory_MemTotal * 100` → %
5. **CPU Usage**: `100 - avg(irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100` → %
6. **Disk Usage**: `(node_filesystem_size - node_filesystem_avail) / node_filesystem_size * 100` → %

### 5.9 Checklist Monitoring

- [ ] Aplicación instrumentada (prom-client)
- [ ] /metrics endpoint funcionando
- [ ] Prometheus instalado y corriendo
- [ ] Grafana instalado y corriendo
- [ ] Data Source Prometheus en Grafana
- [ ] AlertManager instalado
- [ ] Slack webhook configurado
- [ ] Reglas de alerta creadas
- [ ] Dashboards creados
- [ ] Alertas testeadas (disparadas manualmente)

---

## 6. Troubleshooting

Problemas comunes y soluciones.

### 6.1 OOM Kill (Memoria llena)

**Síntoma:**

```
Prometheus/Grafana muere sin razón
systemd dice: "OOM killer"
```

**Causa:**

- Instancia muy pequeña
- Datos acumulándose (sin retention)
- Memory leak en app

**Solución:**

```bash
# 1. Ver uso de memoria
docker stats
free -h

# 2. Configurar retention (Prometheus)
--storage.tsdb.retention.time=24h

# 3. Limitar memoria por servicio
docker run -m 256m ...

# 4. Upgrade de instancia
# AWS: cambiar de t3.micro a t3.small
```

### 6.2 Prometheus/Grafana No Levanta

**Síntoma:**

```
sudo systemctl status prometheus
● prometheus.service - Prometheus
    Active: failed
```

**Causa:**

- Archivo config corrupto
- Permisos insuficientes
- Puertos en uso

**Solución:**

```bash
# 1. Ver logs
sudo journalctl -u prometheus -n 50

# 2. Verificar config
/opt/prometheus/prometheus --config.file=prometheus.yml

# 3. Verificar permisos
sudo chown -R ubuntu:ubuntu /opt/prometheus

# 4. Verificar puertos
lsof -i :9090
```

### 6.3 Prometheus No Scrapeea

**Síntoma:**

```
curl http://localhost:9090/api/v1/targets
"health": "down"
```

**Causa:**

- App no expone /metrics
- Firewall bloqueando
- Localhost no resuelve

**Solución:**

```bash
# 1. Verificar /metrics existe
curl http://localhost/metrics

# 2. Verificar conectividad
curl http://localhost:80/metrics

# 3. Revisar config prometheus.yml
# Asegurarse: targets: ['localhost:80']
```

### 6.4 Alertas No Disparan

**Síntoma:**

```
Prometheus ve la métrica, pero no alerta
```

**Causa:**

- Regla de alerta mal escrita
- `for:` tiempo aún no cumplido
- Métrica no existe

**Solución:**

```bash
# 1. Verificar alertas cargadas
curl http://localhost:9090/api/v1/rules

# 2. Probar expresión PromQL
# Ir a Prometheus UI → Graph
# Copiar la expresión de la alerta

# 3. Verificar `for:` time
# Si for: 5m, esperar 5 min con métrica en rojo
```

### 6.5 Grafana Muy Lento

**Síntoma:**

```
Grafana tarda 30s en cargar un dashboard
```

**Causa:**

- EC2 sin recursos
- Query muy compleja
- Rango de tiempo muy grande (1 año)

**Solución:**

```bash
# 1. Ver recursos
docker stats

# 2. Reducir rango de tiempo en Grafana
# Dashboard → cambiar a últimas 24h

# 3. Optimizar queries
# Usar rate() en lugar de sumas directas

# 4. Upgrade de instancia
```

### 6.6 SSH No Conecta

**Síntoma:**

```
ssh: connect to host 18.189.29.49: Operation timed out
```

**Causa:**

- Security Group no abre puerto 22
- Instancia apagada
- Network issue

**Solución:**

```bash
# 1. Verificar Security Group
# AWS Console → EC2 → Security Groups
# Puerto 22 debe estar abierto

# 2. Verificar instancia
# AWS Console → Instances
# Status debe ser "running"

# 3. Esperar 2-3 min después de lanzar
```

### 6.7 Docker Compose No Levanta

**Síntoma:**

```
docker-compose up
ERROR: Permission denied while trying to connect to Docker daemon
```

**Causa:**

- Usuario no en grupo docker

**Solución:**

```bash
# Agregar usuario a grupo
sudo usermod -aG docker $USER
newgrp docker

# O usar sudo
sudo docker-compose up
```

### 6.8 Base de Datos No Conecta

**Síntoma:**

```
connect ECONNREFUSED 127.0.0.1:5432
```

**Causa:**

- PostgreSQL no corriendo
- Variables de entorno incorrectas
- Host incorrecto (usar `db`, no `localhost`)

**Solución:**

```bash
# 1. Verificar BD corriendo
docker-compose ps

# 2. Ver logs
docker-compose logs db

# 3. Verificar variables en .env
# DB_HOST debe ser: db (nombre del servicio, no IP)

# 4. Verificar health check
curl http://localhost:5432 # No debe responder HTTP
```

---

## 7. Glosario DevOps

Términos técnicos inglés/español.

|Inglés|Español|Explicación|
|---|---|---|
|**Deployment**|Despliegue|Proceso de poner la app en producción|
|**Infrastructure**|Infraestructura|Servidores, redes, BD, etc.|
|**Containerization**|Contenedorización|Empaquetar app en Docker|
|**Orchestration**|Orquestación|Coordinar múltiples contenedores|
|**Scaling**|Escalado|Aumentar/disminuir recursos|
|**Load Balancing**|Balanceo de carga|Distribuir tráfico entre servidores|
|**Monitoring**|Monitoreo|Observar métricas y alertas|
|**Observability**|Observabilidad|Entender qué está pasando en el sistema|
|**Metrics**|Métricas|Números que miden algo (requests, latencia)|
|**Logging**|Registros/Logs|Escribir eventos en archivo|
|**Tracing**|Rastreo|Seguir un request a través del sistema|
|**Health Check**|Verificación de salud|Preguntar "¿estás vivo?" periódicamente|
|**Retention Policy**|Política de retención|Cuánto tiempo guardar datos|
|**Backup**|Copia de seguridad|Copiar datos para recuperación|
|**Disaster Recovery**|Recuperación de desastres|Plan B si algo falla|
|**Redundancy**|Redundancia|Tener copias por si una falla|
|**Failover**|Conmutación por error|Cambiar a servidor backup automáticamente|
|**Rollback**|Revertir|Volver a versión anterior|
|**CI/CD**|Integración/Despliegue Continuo|Automatizar build → test → deploy|
|**Pipeline**|Tubería|Secuencia de pasos automáticos|
|**Environment**|Ambiente|dev, staging, production|
|**TSDB**|BD Time Series|Base de datos para series temporales (Prometheus)|
|**Scraping**|Raspado|Descargar datos periódicamente|
|**Prometheus**|Prometheus|Recolector de métricas (pull-based)|
|**Grafana**|Grafana|Visualización de dashboards|
|**AlertManager**|Gestor de Alertas|Enrutar y deduplicar alertas|
|**PromQL**|Lenguaje Prometheus|Sintaxis para queries en Prometheus|
|**Histogram**|Histograma|Métrica que mide distribución (percentiles)|
|**Counter**|Contador|Métrica que suma valores|
|**Gauge**|Medidor|Métrica que puede subir/bajar|
|**Rate**|Tasa|Cambio por unidad de tiempo (ej: requests/sec)|
|**Percentile**|Percentil|p50=mediana, p95=95% más rápido|
|**Throughput**|Rendimiento|Cuántas cosas por unidad de tiempo|
|**Latency**|Latencia|Tiempo que tarda algo|
|**Oversizing**|Sobre-dimensionamiento|Elegir recursos más grandes de lo necesario|
|**Capacity Planning**|Planificación de capacidad|Calcular recursos necesarios|
|**SLA**|Acuerdo de Nivel Servicio|% de tiempo que debe estar disponible|
|**RTO**|Objetivo Tiempo Recuperación|Cuánto tiempo para recuperar después de fallo|
|**RPO**|Objetivo Punto Recuperación|Cuántos datos se pueden perder|
|**Docker**|Docker|Tecnología de contenedores|
|**Image**|Imagen|Plantilla para crear contenedores|
|**Container**|Contenedor|Instancia de una imagen corriendo|
|**Volume**|Volumen|Almacenamiento persistente|
|**Network**|Red|Conectar contenedores entre sí|
|**Docker Compose**|Docker Compose|Orquestar múltiples contenedores|
|**PostgreSQL**|PostgreSQL|Base de datos relacional|
|**AWS EC2**|AWS EC2|Servidor virtual en AWS|
|**Instance Type**|Tipo de instancia|t3.micro, t3.small, etc. (tamaño)|
|**Security Group**|Grupo de seguridad|Firewall (qué puertos abrir)|
|**SSH**|SSH|Acceso remoto seguro a servidor|
|**Key Pair**|Par de claves|Pública/privada para autenticar SSH|
|**Systemd**|Systemd|Gestor de servicios en Linux|
|**Service**|Servicio|Programa que corre en background|
|**Daemon**|Daemon|Programa que corre sin interfaz gráfica|
|**Cron**|Cron|Ejecutar tareas en horarios específicos|
|**Webhook**|Webhook|URL que se llama cuando algo sucede|
|**API**|API|Interfaz para comunicarse con programa|
|**REST**|REST|Estilo de arquitectura para APIs|
|**JSON**|JSON|Formato de datos estructurado|
|**YAML**|YAML|Formato para configuraciones|
|**Git**|Git|Control de versiones|
|**Repository**|Repositorio|Lugar donde guardar código|
|**Commit**|Confirmación|Guardar cambios con mensaje|
|**Push**|Enviar|Subir cambios a repositorio remoto|
|**Pull Request**|Solicitud de Extracción|Proponer cambios para revisión|
|**Merge**|Fusionar|Combinar dos ramas de código|
|**Branch**|Rama|Versión alternativa del código|
|**CI**|Integración Continua|Ejecutar tests automáticamente|
|**CD**|Despliegue Continuo|Desplegar automáticamente si tests pasan|
|**GitHub Actions**|GitHub Actions|CI/CD integrado en GitHub|
|**Workflow**|Flujo de trabajo|Secuencia de pasos en CI/CD|
|**Secret**|Secreto|Variable protegida (contraseña, token)|
|**Environment Variable**|Variable de entorno|Valor que la app lee al iniciar|
|**Port Mapping**|Mapeo de puertos|Conectar puerto interno a externo|
|**Expose**|Exponer|Hacer un puerto accesible|
|**Firewall**|Firewall/Cortafuegos|Controlar tráfico de red|
|**NAT**|Traducción de Direcciones|Mapear IPs internas a externas|
|**Load Balancer**|Balanceador de carga|Distribuir requests entre servidores|
|**Proxy**|Proxy|Intermediario entre cliente y servidor|
|**Reverse Proxy**|Proxy inverso|Proxy que recibe requests del exterior|
|**Cache**|Caché|Almacenar datos frecuentes en memoria|
|**CDN**|Red de Entrega Contenidos|Distribuir contenido globalmente|
|**SSL/TLS**|SSL/TLS|Encriptación para HTTPS|
|**Certificate**|Certificado|Documento para HTTPS|
|**DNS**|DNS|Traducir dominios a IPs|
|**Domain**|Dominio|Nombre amigable (ej: example.com)|

---

## 8. Template - Proyecto Nuevo

Usar como punto de partida para proyectos nuevos.

### 8.1 Planificación (Completar primero)

```
Proyecto: [Nombre]
Objetivo: [Qué se va a hacer]
Público: [Cuántos usuarios/requests estimados]
Plazo: [Fecha de lanzamiento]
Presupuesto: [$ disponible]

Tecnologías:
- Lenguaje: [Node.js/Python/Java]
- Framework: [Express/Flask/Spring]
- BD: [PostgreSQL/MySQL/MongoDB]
- Cloud: [AWS/Google/Azure]
- Monitoring: [Prometheus/Grafana/NewRelic]
```

### 8.2 Capacity Planning (Calcular)

```
Componentes:
- App:        ___ MB
- BD:         ___ MB
- Monitoring: ___ MB
- OS:         ~300 MB
- Total:      ___ MB

Crecimiento esperado (12 meses): ___ MB
Oversizing (×1.5):               ___ MB

Instancia elegida: [t3.micro/small/medium]
```

### 8.3 Checklist Pre-Deployment

- [ ] Objetivo documentado
- [ ] Recursos calculados
- [ ] Presupuesto aprobado
- [ ] Instancia seleccionada
- [ ] Credenciales en Bitwarden
- [ ] SSH keys generadas
- [ ] README iniciado

### 8.4 Infrastructure (Ejecutar)

```bash
# 1. Crear instancia EC2
# 2. SSH access
# 3. apt update && upgrade
# 4. Instalar Docker
# 5. Instalar Docker Compose
# 6. Security Group: abrir puertos
# 7. Guardar IP pública
```

### 8.5 Application (Desplegar)

```bash
# 1. Crear Dockerfile
# 2. Crear docker-compose.yml
# 3. Crear .env (no subir a GitHub)
# 4. Test local: docker-compose up -d
# 5. Push a GitHub
# 6. SSH a servidor
# 7. git clone
# 8. docker-compose up -d
# 9. Verificar: curl http://localhost/
```

### 8.6 Monitoring (Instalar)

```bash
# 1. Instrumentar app (prom-client)
# 2. Agregar endpoint /metrics
# 3. Instalar Prometheus
# 4. Instalar Grafana
# 5. Instalar AlertManager
# 6. Crear reglas (alerts.yml)
# 7. Crear dashboards
# 8. Test: docker stop app → alerta en Slack
```

### 8.7 Documentación (Completar)

````markdown
# [Nombre Proyecto]

## Objetivo
[Qué es]

## Stack
- App: [Lenguaje + Framework]
- BD: [Tipo + Versión]
- Monitoring: [Stack]

## Deployment
```bash
[Pasos exactos para desplegar]
````

## Acceso

- App: http://IP/
- Grafana: http://IP:3000

## Troubleshooting

[Problemas comunes + soluciones]

````

### 8.8 CI/CD (Automatizar)

```yaml
# .github/workflows/deploy.yml
- Build imagen Docker
- Push a Docker Hub
- SSH a EC2
- Pull + restart
````

### 8.9 Checklist Post-Deployment

- [ ] App corriendo
- [ ] BD conectada
- [ ] Prometheus scrapea
- [ ] Grafana muestra datos
- [ ] Alertas funcionan
- [ ] GitHub documentado
- [ ] CI/CD configurado
- [ ] Backups planificados
- [ ] Alertas de capacidad activas

---

## Conclusión

Este manual cubre el procedimiento estándar DevOps:

1. **Planificación** (Pre-Deployment Checklist)
2. **Cálculo** (Capacity Planning)
3. **Infraestructura** (Setup)
4. **Aplicación** (Deployment)
5. **Observabilidad** (Monitoring)
6. **Resolución** (Troubleshooting)
7. **Referencia** (Glosario)
8. **Reutilización** (Template)

Úsalo como base para todos los proyectos futuros.

---

**Última actualización**: Julio 30, 2026 **Versión**: 1.0 **Status**: Completo
