## 1. Pre-Deployment Checklist
### Guía de Preguntas para Desarrolladores

**Objetivo:** Recopilar información técnica y de negocio ANTES de empezar a construir infraestructura.

**Quién**: DevOps (tú) hace estas preguntas a los desarrolladores.
**Cuándo**: En reunión de kickoff (antes de todo).
**Documento**: Guardar respuestas en Obsidian/Bitwarden.

---

### 1.1 Sobre la Aplicación

**Preguntas:**

1. **"¿Qué lenguaje y framework usan?"**
   - Ejemplos: Node.js + Express, Python + Flask, Java + Spring
   - ¿Por qué?
   - DevOps necesita saber: Dockerfile, dependencias, versión recomendada
   - **Guardar**: Lenguaje, versión, framework

2. **"¿Cuál es el punto de entrada? (main file)"**
   - Ejemplos: server.js, app.py, Application.java
   - ¿Cómo se inicia? (npm start, python app.py, java -jar)
   - **Guardar**: Comando exacto de inicio

3. **"¿Qué puerto usa la app?"**
   - Ejemplo: 8080, 3000, 5000
   - ¿Es configurable?
   - **Guardar**: Puerto interno (lo que expone)

4. **"¿Cuánta RAM consume en reposo (sin requests)?"**
   - Ejemplo: Node.js ~80MB, Java ~200MB
   - ¿Cómo lo midieron? (docker stats)
   - **Guardar**: RAM mínima

5. **"¿Cuánta RAM consume bajo carga (100 usuarios simultáneos)?"**
   - Esto es crítico para Capacity Planning
   - Recomendación: Hacer load test local
   - **Guardar**: RAM máxima

6. **"¿Cuántas conexiones concurrentes espera?"**
   - Ejemplo: 10 usuarios simultáneos, 1000, 10,000
   - ¿En pico o promedio?
   - **Guardar**: Conexiones esperadas

7. **"¿Necesita variables de entorno?"**
   - Ejemplos: DB_HOST, API_KEY, NODE_ENV
   - ¿Sensibles? (contraseñas, tokens)
   - **Guardar**: Lista completa

8. **"¿Tiene health check?"**
   - Ejemplo: GET /health → {status: "OK"}
   - Si no, ¿qué endpoint es estable?
   - **Guardar**: Endpoint para verificar salud

9. **"¿Expone métricas?"**
   - ¿Tiene prom-client implementado?
   - Endpoint: /metrics
   - Si no: ¿se puede agregar?
   - **Guardar**: Sí/No, endpoint

10. **"¿Tiempo de startup (desde comando hasta responde HTTP)?"**
    - Ejemplo: 2 segundos, 30 segundos
    - Afecta health checks y readiness
    - **Guardar**: Tiempo en segundos

---

### 1.2 Sobre la Base de Datos

**Preguntas:**

1. **"¿Qué BD necesita?"**
   - PostgreSQL, MySQL, MongoDB, Redis, DynamoDB
   - ¿Versión específica?
   - **Guardar**: BD, versión

2. **"¿Cuál es el esquema? (DDL - Create Table)"**
   - Necesito ver tabla de usuarios, productos, etc.
   - ¿Cuántas tablas?
   - **Guardar**: Script SQL o documentación

3. **"¿Tamaño actual de la BD?"**
   - Ejemplo: 10 MB, 100 MB, 1 GB
   - ¿Está vacía o con datos de prueba?
   - **Guardar**: Tamaño MB/GB

4. **"¿Cuánto crece la BD mensualmente?"**
   - Ejemplo: 1 MB/mes, 10 MB/mes
   - Basado en: registros por día × tamaño promedio
   - **Guardar**: MB/mes

5. **"¿Operaciones de escritura/lectura por segundo?"**
   - Ejemplo: 100 reads/sec, 10 writes/sec
   - En pico: ×10?
   - **Guardar**: Lecturas/seg, escrituras/seg

6. **"¿Necesita backups?"**
   - Cada cuánto: diario, horario
   - ¿Cuánto tiempo guardar?
   - ¿RTO/RPO?" (Objective Time Recovery / Objective Point Recovery)
   - **Guardar**: Frecuencia, retención

7. **"¿Necesita replicación?"**
   - ¿BD de respaldo?
   - ¿Read replicas?
   - **Guardar**: Sí/No, tipo

---

### 1.3 Sobre Integraciones Externas

**Preguntas:**

1. **"¿Llama a APIs externas?"**
   - Ejemplos: Stripe, SendGrid, Twilio, OpenAI
   - ¿Cuántas llamadas por segundo?
   - ¿Timeouts?
   - **Guardar**: Lista de APIs, frequency

2. **"¿Necesita Redis/Cache?"**
   - ¿Para sesiones? ¿Para caché?
   - ¿Tamaño esperado?
   - **Guardar**: Sí/No, tamaño

3. **"¿Dependencias que deben estar en el mismo VPC?"**
   - Ejemplo: Message queue (RabbitMQ, Kafka)
   - ¿Latencia crítica?
   - **Guardar**: Lista

---

### 1.4 Sobre el Negocio / Requisitos

**Preguntas:**

1. **"¿Cuántos usuarios activos esperados?"**
   - Día 1: 100 usuarios
   - Mes 1: 1,000 usuarios
   - Año 1: 100,000 usuarios
   - **Guardar**: Proyección

2. **"¿Cuál es el SLA?" (Service Level Agreement)**
   - Ejemplo: 99.9% uptime = máximo 43 min downtime/mes
   - 99% uptime = máximo 7 horas downtime/mes
   - ¿Qué es aceptable?
   - **Guardar**: % uptime requerido

3. **"¿Cuál es el presupuesto para infraestructura?"**
   - Ejemplos: $100/mes, $1000/mes
   - Esto limita: instancia size, backups, redundancy
   - **Guardar**: Budget USD/mes

4. **"¿Cuándo necesita estar en producción?"**
   - Fase 1 (MVP): 2 semanas
   - Fase 2 (Scalable): 2 meses
   - **Guardar**: Timeline

5. **"¿Necesita HIPAA/PCI/GDPR compliance?"**
   - Regula: Encriptación, backups, audits
   - Afecta: Infraestructura, costos
   - **Guardar**: Sí/No, regulaciones

6. **"¿Es multi-tenant o single-tenant?"**
   - Afecta: Aislamiento, escalado, facturación
   - **Guardar**: Tipo

---

### 1.5 Sobre Operaciones

**Preguntas:**

1. **"¿Quién deploya cambios?"**
   - ¿Devs hacen git push?
   - ¿DevOps aprueba?
   - ¿Automatizado (CI/CD)?
   - **Guardar**: Proceso

2. **"¿Cuántas veces por día se deploya?"**
   - Ej: 1x/día, 5x/día, 50x/día (Continuous Deployment)
   - Afecta: Necesidad de CI/CD, rollback strategy
   - **Guardar**: Frequency

3. **"¿Cómo se manejan los errores?"**
   - ¿Alertas a Slack?
   - ¿PagerDuty?
   - ¿Email?
   - ¿Quién responde (on-call)?
   - **Guardar**: Notificación, on-call

4. **"¿Necesita logging?"**
   - ¿Centralizado? (ELK, Splunk, CloudWatch)
   - ¿Retención?
   - **Guardar**: Sí/No, tipo

5. **"¿Necesita trazabilidad (audit logs)?"**
   - Quién hizo qué, cuándo
   - Requerido por compliance
   - **Guardar**: Sí/No

---

### 1.6 Sobre Seguridad

**Preguntas:**

1. **"¿Necesita HTTPS?"**
   - Sí/No
   - ¿Certificado propio o Let's Encrypt?
   - **Guardar**: Sí/No, tipo

2. **"¿Qué datos sensibles maneja?"**
   - Contraseñas, números de tarjeta, SSN
   - Afecta: Encriptación, almacenamiento
   - **Guardar**: Lista

3. **"¿Necesita autenticación?"**
   - OAuth, JWT, Basic Auth
   - ¿Multi-factor?
   - **Guardar**: Tipo

4. **"¿Necesita autorización?"**
   - Roles (admin, user, guest)
   - Permisos granulares
   - **Guardar**: Nivel de granularidad

5. **"¿Firewall requerido?"**
   - ¿IP whitelist?
   - ¿DDoS protection?
   - **Guardar**: Requisitos

---

### 1.7 Checklist de Salida

Antes de pasar a Capacity Planning:

- [ ] Lenguaje/Framework definido
- [ ] RAM estimada (idle + carga)
- [ ] BD seleccionada
- [ ] Conexiones concurrentes esperadas
- [ ] Usuarios proyectados (6-12 meses)
- [ ] SLA definido
- [ ] Presupuesto aprobado
- [ ] Timeline confirmado
- [ ] Requisitos de compliance
- [ ] Alertas/on-call definidos

---

### 1.8 Documento de Salida (Guardar)

Crear en Obsidian:

## Proyecto: [Nombre]

### Aplicación

- Lenguaje: [Node.js 18]
- Framework: [Express]
- Puerto: [80]
- RAM idle: [80 MB]
- RAM carga: [350 MB]
- Health check: [GET /health]
- Métricas: [Sí, /metrics]

### BD

- Tipo: [PostgreSQL 15]
- Tamaño actual: [10 MB]
- Crecimiento: [2 MB/mes]
- Backups: [Diario]

### Negocio

- Usuarios esperados (Y1): [10,000]
- SLA: [99.9%]
- Presupuesto: [$500/mes]
- Timeline: [6 semanas]

### Integraciones

- APIs externas: [Stripe, SendGrid]
- Redis: [No]

### Operaciones

- Deploy frequency: [1x/día]
- On-call: [Devs turno]
- Alertas: [Slack #alerts]

### Seguridad

- HTTPS: [Sí, Let's Encrypt]
- Auth: [JWT]
- Sensibles: [Contraseñas, tokens]
- Compliance: [GDPR]
