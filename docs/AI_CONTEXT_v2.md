# AidMesh — AI Context File
**Versión:** 2.0  
**Última actualización:** Marzo 2026  
**Propósito:** Cargar este archivo al inicio de cualquier sesión con IA para tener contexto completo del proyecto sin re-explicar nada.

---

## ¿Qué es AidMesh?

AidMesh es una **plataforma de coordinación de respuesta crítica** para cualquier evento que supere la capacidad de respuesta normal de una comunidad. No es solo para desastres naturales — cubre emergencias de salud pública, búsqueda y rescate, eventos de seguridad civil y operaciones humanitarias continuas.

**El problema que resuelve:** En una crisis, todos quieren ayudar pero nadie sabe qué ya está siendo atendido, qué recursos existen, ni a quién reportar. Hay duplicación de esfuerzos, rumores, desinformación y caos organizacional. AidMesh impone estructura y trazabilidad donde naturalmente hay caos humano.

**Ventaja competitiva principal:** Sistema de logística inteligente con OpenClaw que analiza inventarios de centros de acopio, tickets activos y recursos disponibles para sugerir automáticamente qué mandar, a dónde y cuándo. Nadie más tiene esto.

**Piloto objetivo:** Baja California Sur — contacto inicial con Protección Civil BCS ya establecido.

---

## Estado actual del proyecto

**Fase:** Desarrollo activo — MVP funcional corriendo localmente.  
**Stack corriendo:** auth-service, api-gateway, alerts-service, maps-service, com-service, dashboard.  
**Equipo:** 1 persona (el founder) + IA como par de desarrollo.  
**Repositorio:** https://github.com/rtorrescodes/AidMesh  
**Entorno local:** Docker Compose en Windows, carpeta C:\CODES\AidMesh  

---

## Concepto central: el Evento

Todo en AidMesh ocurre dentro de un **Evento**.

### Estados del Evento (hardcodeados en core, no modificables por setup)
```
PREPARACIÓN → ACTIVO → DESACTIVADO → CONTENIDO → CERRADO
```

| Estado | Descripción | Quién puede cambiar |
|--------|-------------|---------------------|
| PREPARACIÓN | Borrador, se está configurando | Nivel 3 |
| ACTIVO | Operativo, todos pueden operar | Nivel 3 |
| DESACTIVADO | Solo visible para Nivel 3, nadie más opera | Nivel 3 |
| CONTENIDO | Visible para todos, modo consulta, nadie escribe ni modifica | Nivel 3 |
| CERRADO | Archivado. Solo Nivel 3 puede reabrir | Nivel 3 |

**Regla:** Cualquier cambio de estado puede revertirse, siempre por Nivel 3. Todo queda loggeado.

---

## Actores del sistema — Niveles de confianza

### Nivel 0 — Ciudadano
- Sin cuenta registrada O cuenta sin verificar
- **Puede:** Enviar requests públicos (necesidades, emergencias, solicitud de insumos)
- **No puede:** Crear tickets oficiales, ver panel operativo
- **Requisito:** Debe dejar datos de contacto (nombre + teléfono o email). Sin datos = request anónimo
- **Request anónimo:** Entra a lista gris, baja prioridad, no se notifica a nadie, puede convertirse en ticket si un operador lo valida
- **Notificación:** Cuando su request es atendido, se le notifica por SMS/email que "el operador X tomó su solicitud, ticket #XXXX"

### Nivel 1 — Voluntario / Personal institucional
- Cuenta verificada por un Nivel 2 o 3
- **Puede:** Ver requests ciudadanos, convertir request en ticket oficial (queda loggeado quién lo hizo), crear tickets oficiales desde cero, actualizar status de tickets, dar seguimiento
- **No puede:** Cerrar tickets (por default — configurable por evento), borrar nada, cambiar estado del evento
- **Todo queda loggeado:** "Voluntario Juan Pérez tomó request #445 de ciudadana Lupita García y creó ticket oficial #1821"

### Nivel 2 — Directivo organizacional
- Encargado de Cruz Roja, Universidad, Iglesia, ONG, etc.
- **Puede:** Todo lo del Nivel 1 + cerrar tickets (por default), gestionar usuarios de su organización, ver inventario y stock de su org, crear alertas, generar reportes de su organización
- **Clave:** Gestiona a su personal dentro del evento. Puede ver qué hizo cada miembro de su org.
- **Filtros:** Puede filtrar el sistema por su organización para reportes

### Nivel 3 — Admin AidMesh / Directivo Protección Civil
- **Puede:** Todo. Crear eventos, configurar setup del evento, override de permisos por evento, ver todo el sistema, casi borrar (con warnings y log)
- **Setup del evento:** Modifica campos de dropdowns, agrega/quita opciones, configura timeouts, permisos por nivel para ese evento
- **Advertencias:** Cualquier acción destructiva genera un warning visible en el log

### Nivel A — OpenClaw (IA)
- Agente autónomo con permisos configurables
- Escala tickets no atendidos tras timeout
- En Etapa 3: analiza inventarios y genera recomendaciones logísticas

---

## Sistema de permisos — Arquitectura Core + Override

### Principio
```
CORE (permisos default por nivel, todos los eventos)
  + OVERRIDE POR EVENTO (Nivel 3 puede modificar para ese evento específico)
  = PERMISOS EFECTIVOS EN ESE EVENTO
```

### Permisos atómicos del sistema
```
# Alertas
alerts:read, alerts:create, alerts:resolve, alerts:elevate

# COM / Tickets
com:view_requests          → ver requests ciudadanos
com:create_ticket          → crear ticket oficial
com:convert_request        → convertir request en ticket
com:update_ticket          → actualizar status/info
com:assign_ticket          → asignar ticket a persona
com:close_ticket           → cerrar ticket
com:manage_templates       → administrar templates COM (solo AidMesh)

# Eventos
events:create, events:manage, events:close, events:reopen, events:setup

# Logística (Etapa 2)
logistics:view, logistics:manage, logistics:inventory

# Vehículos
vehicles:track, vehicles:manage

# Ciudadanos
citizens:view_requests, citizens:review_signals

# Reportes
reports:own_org, reports:all

# Admin
admin:manage_users, admin:manage_roles, admin:manage_core
```

### Permisos default por nivel

| Permiso | Nivel 0 | Nivel 1 | Nivel 2 | Nivel 3 |
|---------|---------|---------|---------|---------|
| com:view_requests | ✗ | ✓ | ✓ | ✓ |
| com:create_ticket | ✗ | ✓ | ✓ | ✓ |
| com:convert_request | ✗ | ✓ | ✓ | ✓ |
| com:close_ticket | ✗ | ✗ | ✓ | ✓ |
| alerts:create | ✗ | ✗ | ✓ | ✓ |
| alerts:elevate | ✗ | ✗ | ✓ | ✓ |
| events:setup | ✗ | ✗ | ✗ | ✓ |
| admin:manage_core | ✗ | ✗ | ✗ | ✓ |
| reports:own_org | ✗ | ✗ | ✓ | ✓ |
| reports:all | ✗ | ✗ | ✗ | ✓ |

---

## Módulo COM — Sistema de despacho estructurado

### Dos tipos de entradas

**1. Request ciudadano (Nivel 0)**
- Formulario público simplificado
- Campos limitados: tipo de necesidad + ítems (checklist simplificado) + cantidad + unidad + ubicación + datos de contacto
- Sin datos de contacto = request anónimo (lista gris, baja prioridad)
- NO genera ticket oficial automáticamente
- Entra a cola de revisión visible para Nivel 1+
- Deduplicación: requests del mismo tipo en la misma zona se agrupan con contador

**2. Ticket oficial (Nivel 1, 2, 3)**
- Formulario completo con todos los campos
- Genera ticket con número, responsable, tracking completo
- Publica en MQTT → aparece en dashboard en tiempo real
- Queda loggeado quién lo creó

### Estados de ticket (hardcodeados en core)
```
NUEVO → ABIERTO → ATENDIDO → ASIGNADO → EN_SEGUIMIENTO → DEMORADO → CERRADO → ARCHIVADO
```

| Estado | Color | Descripción |
|--------|-------|-------------|
| NUEVO | Gris | Recién creado, sin asignar |
| ABIERTO | Azul | Visible, pendiente de atención |
| ATENDIDO | Verde claro | Alguien lo tomó |
| ASIGNADO | Verde | Asignado a persona específica |
| EN_SEGUIMIENTO | Azul | En proceso activo |
| DEMORADO | Naranja | Sin actividad más allá del timeout configurado |
| CERRADO | Gris oscuro | Resuelto o sin solución posible, documentado |
| ARCHIVADO | Invisible | No aparece en vistas normales, solo en reportes |

**Tickets CRÍTICOS:** Hacen blink en el dashboard hasta que alguien los atiende. No se pueden ignorar visualmente.

**Estado DEMORADO:** Se dispara automáticamente por timeout configurable en el setup del evento (default en core por tipo de necesidad). Aparece como tag naranja en la lista, filtrable.

**Cierre de ticket:** Requiere documentar la resolución. Si se cierra porque se atendió en otro ticket, se referencia el ticket relacionado.

### Cantidad y unidad
- Campo cantidad: dropdown de valores comunes + campo libre
- Campo unidad: dropdown (unidades, cajas, toneladas, kg, litros, etc.) + "no aplica" + campo personalizado
- Nunca asumir la unidad

### Flujo de conversión request → ticket
```
Request ciudadano entra
  → aparece en cola de revisión (Nivel 1+)
  → Nivel 1 revisa y decide: convertir a ticket oficial
  → queda loggeado: "Voluntario X convirtió request #Y de Ciudadano Z en ticket oficial #W"
  → ciudadano notificado si dejó datos de contacto
  → request queda como "atendido" con referencia al ticket generado
  → ticket entra al flujo normal
```

### Deduplicación
- Requests del mismo tipo en la misma zona geográfica se agrupan con contador
- Diferentes localidades = diferentes requests (Los Cabos ≠ Todos Santos)
- Feature futura: agente IA que sugiere agrupaciones al operador

---

## Layers del mapa

### Nivel 1 — Crítico (siempre visible, no ocultable fácilmente)
- 🔴 Alertas activas por severidad (rojo/naranja/amarillo/verde)

### Nivel 2 — Operativo (visible por default, togglable)
- 📦 Tickets abiertos y en proceso
- 📊 Inventarios y centros de acopio activos (Etapa 2)

### Nivel 3 — Informativo (oculto por default, togglable)
- ✅ Tickets resueltos
- 🏠 Albergues y centros de acopio (ubicación)
- 🏥 Hospitales y comandancias (apoyo institucional)
- 🚗 Vehículos GPS en tiempo real (Etapa 2)

**Regla:** Un ticket puede elevarse a alerta desde el panel del ticket (permiso: alerts:elevate, Nivel 2+).

---

## Widgets del dashboard

### Barra de estado inferior (siempre visible)
Columnas: estado MQTT | usuarios activos en evento | tickets abiertos | última actividad | estado de servicios

### Log de actividades (panel derecho, togglable)
- Muestra todas las actividades del evento en tiempo real
- Coloreado por tipo: rojo=crítico, naranja=demorado, verde=resuelto, azul=info
- Por default: visible para todos
- Configurable personalmente: ver solo mi grupo, ver todo, apagar
- Ejemplos de entradas:
  - 🔴 "Ticket #1821 CRÍTICO — Rescate en Todos Santos — sin atender"
  - 🟠 "Ticket #1654 DEMORADO — Agua en La Paz — 3 días sin actividad"  
  - 🟢 "Ticket #1432 CERRADO — Víveres en Los Cabos — atendido por Cruz Roja BCS"
  - 🔵 "Voluntario Juan Pérez convirtió request #445 en ticket oficial #1821"

### Feed MQTT (panel derecho, togglable)
- Por default: APAGADO
- Solo para desarrollo y diagnóstico técnico
- Configurable en setup del core

---

## Arquitectura Core + Personalización por Evento

### Core (init.sql — aplica a todos los eventos)
- Estados de ticket (hardcodeados, no modificables)
- Estados de evento (hardcodeados, no modificables)
- Permisos atómicos (hardcodeados)
- Permisos default por nivel
- Tipos de amenaza base
- Categorías de recursos base
- Unidades de medida base
- Templates COM base

### Personalización por evento (Nivel 3, solo para ese evento)
- Agregar/desactivar tipos de necesidad
- Agregar/desactivar ítems en categorías
- Agregar/desactivar unidades de medida
- Modificar timeouts de demorado por tipo
- Override de permisos por nivel
- Campos adicionales en tickets
- Templates COM específicos del evento

### Panel de configuración Core (Nivel 3, afecta todos los eventos futuros)
- Administrar listas master de ítems, unidades, categorías
- Configurar permisos default
- Gestionar templates COM globales
- Este panel NO afecta eventos ya creados

---

## Stack tecnológico

### Corriendo en producción local
| Servicio | Tecnología | Puerto |
|---------|-----------|--------|
| API Gateway | NestJS | 3000 |
| Auth Service | NestJS | 3001 |
| Alerts Service | NestJS | 3002 |
| Maps Service | Go + Gin | 3003 |
| COM Service | Go + Gin | 3004 |
| Dashboard | Next.js | 3005 |
| PostgreSQL+PostGIS | Cloud SQL / Docker | 5432 |
| Redis | Memorystore / Docker | 6379 |
| MongoDB | Atlas / Docker | 27017 |
| EMQX | Cloud Serverless / Docker | 1883/8083 |
| Adminer | Docker (solo dev) | 8082 |
| Mongo Express | Docker (solo dev) | 8081 |

### Notas importantes de infraestructura
- Dockerfiles NestJS y Next.js corren en modo `dev` (sin multi-stage build)
- Go services usan `golang:1.23-alpine`
- go.sum generado con `go mod tidy` localmente
- Para producción GCP: cambiar Dockerfiles a multi-stage build
- `synchronize: false` en TypeORM — las tablas las maneja init.sql

---

## Roadmap actualizado

### Etapa 1 — MVP (EN DESARROLLO)
✅ Auth/IAM, Eventos, Alertas, Mapas, COM básico, Dashboard  
🔨 Pendiente: formulario COM ciudadano, barra de estado, log de actividades, layers del mapa, asignación de tickets, panel de configuración Core

### Etapa 2 — Integración
IoT/Telemetría, App Flutter offline-first, OpenClaw v1, Logística e inventarios, Albergues, Notificaciones SMS/email

### Etapa 3 — Escalamiento
OpenClaw v2 con análisis logístico, Analítica predictiva, K8s, Interoperabilidad

### Etapa 4 — Internacional
OPS/OMS, Multi-idioma, Marketplace templates, Modelo de negocio

---

## Features pendientes (definidas, no en desarrollo aún)

- [ ] Agente IA para sugerir agrupación de requests duplicados
- [ ] Notificaciones SMS/email al ciudadano
- [ ] App móvil Flutter offline-first
- [ ] Módulo de logística e inventarios (ventaja competitiva principal)
- [ ] Niveles de confianza adicionales con permisos custom
- [ ] Elevar ticket a alerta (botón en panel de ticket)
- [ ] Reportes por organización
- [ ] Feed MQTT togglable por setup
- [ ] Filtros avanzados en board de tickets
- [ ] Panel de configuración Core (listas master, templates)
- [ ] Alarmas vecinales (side project conectado a AidMesh)
- [ ] Comunicados oficiales en eventos (Nivel 3)
- [ ] Cierre de ticket con referencia a otro ticket
- [ ] Reabrir evento cerrado (Nivel 3)

---

## Decisiones de arquitectura tomadas

| Decisión | Elección | Razón |
|----------|---------|-------|
| Permisos | Core + override por evento | Flexibilidad sin perder consistencia |
| resource_category | VARCHAR(100) libre | Soporta acentos, más flexible que enum |
| Mapas | MapLibre + OSM | Gratuito, offline, migrable |
| MQTT broker dev | EMQX Docker | Mismo protocolo que producción |
| TypeORM synchronize | false | Las tablas las maneja init.sql |
| Dockerfiles | Modo dev | Producción GCP usará multi-stage |
| Estados de ticket | Hardcodeados en core | Consistencia en todos los eventos |
| Estados de evento | Hardcodeados en core | No tiene sentido personalizarlos |
| Cantidad+unidad | Dos dropdowns + campo libre | Nunca asumir unidad |

---

## Instrucciones para la IA que lee este archivo

1. Eres el **Arquitecto Lead de AidMesh**. Conoces todo el contexto anterior.
2. El founder trabaja solo con IA. No programa mucho — tú generas el código, él revisa e integra.
3. Siempre que generes código, organízalo según la estructura de repositorio definida.
4. Si algo contradice una decisión ya tomada, señálalo antes de proceder.
5. Si falta contexto para una decisión técnica, pregunta antes de asumir.
6. Prioriza siempre: simplicidad > elegancia, funcional > perfecto, desplegable > completo.
7. El entorno de desarrollo es local con Docker Compose en Windows. Producción es GCP Linux.
8. Toda comunicación en **español**.
9. Cuando el founder diga "dame el archivo completo", siempre dar el archivo completo sin truncar.
10. Los archivos largos se pueden truncar en el chat — siempre preguntar si el founder ve el archivo completo antes de asumir que se guardó bien.