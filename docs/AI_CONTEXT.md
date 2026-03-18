# AidMesh — AI Context File
**Versión:** 3.0  
**Última actualización:** Marzo 2026  
**Propósito:** Cargar este archivo al inicio de cualquier sesión con IA para tener contexto completo del proyecto sin re-explicar nada. Es la única fuente de verdad del proyecto.

---

## ¿Qué es AidMesh?

AidMesh es una **plataforma de coordinación de respuesta crítica** para cualquier evento que supere la capacidad de respuesta normal de una comunidad. No es solo para desastres naturales — cubre emergencias de salud pública, búsqueda y rescate, eventos de seguridad civil y operaciones humanitarias continuas.

**El problema que resuelve:** En una crisis, todos quieren ayudar pero nadie sabe qué ya está siendo atendido, qué recursos existen, ni a quién reportar. Hay duplicación de esfuerzos, rumores, desinformación y caos organizacional. AidMesh impone estructura y trazabilidad donde naturalmente hay caos humano.

**Ventaja competitiva principal:** Sistema de logística inteligente con OpenClaw que analiza inventarios de centros de acopio, tickets activos y recursos disponibles para sugerir automáticamente qué mandar, a dónde y cuándo. Nadie más tiene esto.

**Segunda ventaja competitiva:** Transparencia total en donaciones monetarias — trazabilidad de cada peso donado hasta el gasto final con comprobantes. Genera confianza institucional.

**Piloto objetivo:** Baja California Sur — contacto inicial con Protección Civil BCS ya establecido. Península aislada, dependencia de ferries desde Mazatlán. Los huracanes generan logística de ayuda excepcionalmente compleja. Caso de uso ideal.

---

## Estado actual del proyecto

**Fase:** Desarrollo activo — MVP funcional corriendo localmente.  
**Repositorio:** https://github.com/rtorrescodes/AidMesh  
**Entorno local:** Docker Compose en Windows, carpeta `C:\CODES\AidMesh`  
**Equipo:** 1 persona (el founder) + IA como par de desarrollo.  

### Servicios corriendo localmente
| Servicio | Tecnología | Puerto |
|---------|-----------|--------|
| API Gateway | NestJS | 3000 |
| Auth Service | NestJS | 3001 |
| Alerts Service | NestJS | 3002 |
| Maps Service | Go + Gin | 3003 |
| COM Service | Go + Gin | 3004 |
| Dashboard | Next.js | 3005 |
| PostgreSQL+PostGIS | Docker | 5432 |
| Redis | Docker | 6379 |
| MongoDB | Docker | 27017 |
| EMQX | Docker | 1883/8083 |
| Adminer | Docker (solo dev) | 8082 |

---

## Concepto central: el Evento

Todo en AidMesh ocurre dentro de un **Evento** — entidad que agrupa actores, recursos, mensajes, alertas y solicitudes bajo un contexto común con ciclo de vida propio.

### Estados del Evento (hardcodeados en core — no modificables por setup)

| Estado | Descripción | Quién puede cambiar |
|--------|-------------|---------------------|
| PREPARANDO | Borrador, configurándose, aún no operativo | Nivel 3 |
| ACTIVO | Operativo, todos pueden operar | Nivel 3 |
| DESACTIVADO | Solo visible para Nivel 3, nadie más opera | Nivel 3 |
| CONTENIDO | Visible para todos, solo lectura, nadie escribe ni modifica | Nivel 3 |
| CERRADO | Finalizado. Solo Nivel 3 puede reabrir | Nivel 3 |
| ARCHIVADO | Solo lectura permanente, no se puede reabrir | Nivel 3 |

**Regla:** Cualquier cambio de estado queda loggeado. Todo es reversible excepto ARCHIVADO.

Cada Evento tiene un **perfil de despliegue** que define qué módulos y contenedores se levantan.

---

## Actores del sistema — Niveles de confianza

### Nivel 0 — Ciudadano
- Sin cuenta O cuenta sin verificar
- **Puede:** Enviar requests públicos (necesidades, emergencias, solicitud de insumos)
- **No puede:** Crear tickets oficiales, ver panel operativo
- **Requisito:** Debe dejar datos de contacto (nombre + teléfono o email)
- **Sin datos = request anónimo:** Lista gris, baja prioridad, no se notifica, puede convertirse en ticket si operador lo valida
- **Notificación:** Cuando su request es atendido recibe SMS/email: "Operador X tomó tu solicitud, ticket #XXXX"
- **Formulario simplificado:** Menos campos que el ticket oficial, checklist limitado de ítems

### Nivel 1 — Voluntario / Personal institucional
- Cuenta verificada por Nivel 2 o 3
- **Puede:** Ver requests ciudadanos, convertir request en ticket oficial, crear tickets oficiales desde cero, actualizar status de tickets, dar seguimiento
- **No puede:** Cerrar tickets (por default, configurable por evento), borrar nada, cambiar estado del evento
- **Todo queda loggeado:** "Voluntario Juan Pérez tomó request #445 de Lupita García → ticket oficial #1821"

### Nivel 2 — Directivo organizacional
- Encargado de Cruz Roja, Universidad, Iglesia, ONG, etc.
- **Puede:** Todo Nivel 1 + cerrar tickets, gestionar usuarios de su org, ver inventario/stock de su org, crear alertas, elevar ticket a alerta, generar reportes de su organización
- **Filtros:** Puede filtrar el sistema por su organización para reportes
- **Gestiona:** A su personal dentro del evento

### Nivel 3 — Admin AidMesh / Directivo Protección Civil
- **Puede:** Todo. Crear eventos, configurar setup del evento, override de permisos por evento, configurar catálogos Core, ver todo el sistema
- **Setup del evento:** Modifica campos de dropdowns, agrega/quita opciones, configura timeouts, permisos por nivel para ese evento
- **Advertencias:** Cualquier acción destructiva genera warning en el log

### Nivel A — OpenClaw (IA)
- Agente autónomo con permisos configurables
- Etapa 2: escala tickets no atendidos tras timeout
- Etapa 3: analiza inventarios y genera recomendaciones logísticas automáticas

---

## Sistema de permisos — Arquitectura Core + Override
```
CORE (permisos default por nivel, aplica a todos los eventos)
  + OVERRIDE POR EVENTO (solo Nivel 3 puede modificar para ese evento específico)
  = PERMISOS EFECTIVOS EN ESE EVENTO
```

### Permisos atómicos
```
alerts:read, alerts:create, alerts:resolve, alerts:elevate
com:view_requests, com:create_ticket, com:convert_request
com:update_ticket, com:assign_ticket, com:close_ticket, com:manage_templates
events:create, events:manage, events:close, events:reopen, events:setup
logistics:view, logistics:manage, logistics:inventory
vehicles:track, vehicles:manage
citizens:view_requests, citizens:review_signals
reports:own_org, reports:all
admin:manage_users, admin:manage_roles, admin:manage_core
```

### Permisos default por nivel

| Permiso | N0 | N1 | N2 | N3 |
|---------|----|----|----|----|
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
- Formulario público simplificado con checklist limitado
- Sin datos de contacto = request anónimo (lista gris)
- NO genera ticket oficial automáticamente
- Entra a cola de revisión visible para Nivel 1+
- Deduplicación por tipo + zona geográfica

**2. Ticket oficial (Nivel 1, 2, 3)**
- Formulario completo con todos los campos
- Genera ticket con número, responsable, tracking completo
- Publica en MQTT → aparece en dashboard en tiempo real
- Queda loggeado quién lo creó

### Estados de ticket (hardcodeados en core — no modificables)

| Estado | Color UI | Descripción |
|--------|----------|-------------|
| NUEVO | Gris | Recién creado, sin revisar |
| ABIERTO | Azul | Pendiente de atención |
| ATENDIDO | Verde claro | Alguien lo tomó |
| ASIGNADO | Verde | Asignado a persona específica |
| EN_SEGUIMIENTO | Azul medio | En proceso activo |
| DEMORADO | Naranja | Sin actividad más allá del timeout |
| CERRADO | Gris oscuro | Resuelto o sin solución posible, documentado |
| ARCHIVADO | Invisible | Solo en reportes |

**Tickets CRÍTICOS:** Hacen blink en el dashboard hasta ser atendidos.  
**Estado DEMORADO:** Automático por timeout configurable por tipo de necesidad en setup del evento.  
**Cierre de ticket:** Requiere documentar resolución. Puede referenciar otro ticket relacionado.

### Campos de cantidad y unidad
- **Cantidad:** Dropdown (1,2,5,10,20,50,100) + campo numérico libre + "Indefinido"
- **Unidad:** Dropdown de unidades comunes + "No aplica" + campo personalizado libre
- Nunca asumir la unidad — siempre se especifica

### Flujo de conversión request → ticket oficial
```
Request ciudadano entra
  → aparece en cola de revisión (Nivel 1+)
  → Nivel 1 revisa y convierte a ticket oficial
  → loggeado: "Voluntario X convirtió request #Y de Ciudadano Z en ticket #W"
  → ciudadano notificado si dejó datos de contacto
  → request queda como "atendido" con referencia al ticket generado
```

### Deduplicación
- Requests del mismo tipo en la misma zona geográfica se agrupan con contador
- Diferentes localidades = diferentes requests (Los Cabos ≠ Todos Santos)
- Feature futura: agente IA sugiere agrupaciones al operador

---

## Layers del mapa

### Nivel 1 — Crítico (siempre visible, difícil de ocultar)
- 🔴 Alertas activas por severidad (rojo/naranja/amarillo/verde)

### Nivel 2 — Operativo (visible por default, togglable)
- 📦 Tickets abiertos y en proceso
- 📊 Inventarios y centros de acopio activos (Etapa 2)

### Nivel 3 — Informativo (oculto por default, togglable)
- ✅ Tickets resueltos
- 🏠 Albergues y centros de acopio (ubicación)
- 🏥 Hospitales y comandancias
- 🚗 Vehículos GPS en tiempo real (Etapa 2)

**Un ticket puede elevarse a alerta** desde su panel (permiso alerts:elevate, Nivel 2+).

---

## Widgets del dashboard

### Sistema de widgets togglables
- **Nivel 3/2:** Configura para todo el evento o su organización
- **Nivel 1:** Configura personal
- Sin drag and drop por ahora — solo prender/apagar

### Barra de estado inferior (siempre visible)
Columnas: Estado MQTT | Usuarios activos | Tickets abiertos | Última actividad | Estado de servicios

### Log de actividades (panel derecho)
- Default: ENCENDIDO, visible para todos
- Coloreado: 🔴 crítico | 🟠 demorado | 🟢 resuelto | 🔵 info
- Ejemplos: "🔴 Ticket #1821 CRÍTICO — Rescate Todos Santos — sin atender"
- Configurable: ver solo mi grupo, ver todo, apagar (personal)

### Feed MQTT (panel derecho)
- Default: APAGADO
- Solo para desarrollo y diagnóstico técnico

---

## Arquitectura Core + Personalización por Evento

### Core (init.sql — aplica a todos los eventos)
- Estados de ticket y evento (hardcodeados)
- Permisos atómicos y defaults por nivel
- Catálogos maestros (tipos de evento, necesidades, insumos, unidades)
- Templates COM base

### Personalización por evento (Nivel 3, solo para ese evento)
- Agregar/desactivar tipos de necesidad
- Agregar/desactivar ítems en categorías
- Modificar timeouts de demorado
- Override de permisos por nivel
- Templates COM específicos del evento

### Panel de configuración Core (Nivel 3, afecta eventos futuros)
- Editar catálogos maestros desde UI sin tocar código
- Gestionar templates COM globales
- NO afecta eventos ya creados

---

## Catálogos del sistema (van en init.sql como datos, NO como enums)

### Catálogo 1 — Tipos de Evento
| ID | Tipo |
|----|------|
| EVT-01 | Huracán / Ciclón / Tifón |
| EVT-02 | Sismo / Terremoto |
| EVT-03 | Tsunami |
| EVT-04 | Inundación |
| EVT-05 | Incendio Forestal / Estructural |
| EVT-06 | Sequía |
| EVT-07 | Ola de Calor / Frío Extremo |
| EVT-08 | Deslizamiento / Alud / Derrumbe |
| EVT-09 | Erupción Volcánica |
| EVT-10 | Tormenta Convectiva Severa |
| EVT-11 | Crisis Sanitaria / Pandemia |
| EVT-12 | Accidente Químico / Radiológico |
| EVT-13 | Crisis Humanitaria Compleja |
| EVT-14 | Conflicto Armado / Violencia |
| EVT-15 | Crisis de Desplazamiento Masivo |
| EVT-16 | Inseguridad Alimentaria / Hambruna |
| EVT-17 | Evento Masivo |
| EVT-18 | Colapso de Cadena de Suministro |
| EVT-19 | Plaga Agrícola |
| EVT-20 | Otro |

### Catálogo 2 — Tipos de Duración del Evento
| ID | Tipo |
|----|------|
| DUR-01 | Eventual |
| DUR-02 | Estacional |
| DUR-03 | Permanente / Larga Duración |
| DUR-04 | Con Vigencia (fecha inicio/fin) |
| DUR-05 | Recurrente |
| DUR-06 | Indeterminado |

### Catálogo 3 — Categorías y Tipos de Necesidad
Selector en cascada: Categoría → Tipo → Unidad sugerida automática (editable).

**Alimento e Hidratación**
NEC-01 Agua Potable | NEC-02 Alimento Preparado | NEC-03 Despensa | NEC-04 Fórmula Infantil | NEC-05 Alimento para Mascotas

**Salud y Medicinas**
NEC-06 Medicamentos Recetados | NEC-07 Medicamentos Venta Libre | NEC-08 Primeros Auxilios | NEC-09 Atención Médica Especializada | NEC-10 Vacunación | NEC-11 Equipo Médico Duradero

**Higiene y Aseo**
NEC-12 Kit de Higiene Personal | NEC-13 Gestión Menstrual | NEC-14 Pañales | NEC-15 Artículos de Limpieza

**Abrigo y Vestimenta**
NEC-16 Ropa | NEC-17 Calzado | NEC-18 Frazadas/Cobijas | NEC-19 Ropa de Cama

**Refugio y Albergue**
NEC-20 Albergue Temporal | NEC-21 Carpa/Lona | NEC-22 Reparación de Vivienda

**Logística y Transporte**
NEC-23 Transporte de Personas | NEC-24 Transporte de Carga | NEC-25 Combustible | NEC-26 Almacenamiento

**Energía e Iluminación**
NEC-27 Generador Eléctrico | NEC-28 Iluminación | NEC-29 Baterías/Power Banks

**Comunicación e Información**
NEC-30 Radio de Comunicación | NEC-31 Internet/Telefonía | NEC-32 Información a la Comunidad

**Búsqueda y Rescate**
NEC-33 Equipo de Rescate Técnico | NEC-34 Unidades Caninas K9 | NEC-35 Maquinaria Pesada

**Seguridad y Protección**
NEC-36 Personal de Seguridad | NEC-37 EPP

**Herramientas y Mano de Obra**
NEC-38 Mano de Obra/Voluntarios | NEC-39 Herramientas Manuales | NEC-40 Motosierras/Equipo de Corte

**Apoyo Psicosocial**
NEC-41 Apoyo Psicológico

*Nota: NEC-42 Apoyo Económico/Efectivo es feature futura con submódulo de donaciones (ver F-001)*

### Catálogo 4 — Unidades de medida maestras
```
Volumen:    Litros, Galones, Botellones, ml
Peso:       Kilogramos, Gramos, Toneladas, Libras
Conteo:     Unidad, Par, Docena, Caja, Paquete, Fardo, Kit, Juego
Área:       m², Hectáreas
Energía:    KW, KWh
Tiempo:     Horas, Días, Turnos
Económico:  MXN, USD, Voucher, Tarjeta prepagada
Servicio:   Consulta, Sesión, Ración, Dosis, Viaje, Flete, Cuadrilla
Personalizado: Campo libre (siempre disponible)
```

---

## Stack tecnológico

### Confirmado para Etapa 1
| Capa | Tecnología | Notas |
|------|-----------|-------|
| API Gateway | NestJS | JWT, rate limiting, proxy a microservicios |
| Auth Service | NestJS | RBAC granular, permisos atómicos en JSONB |
| Alerts Service | NestJS | Semáforos, eventos, MQTT publisher |
| Maps Service | Go + Gin | PostGIS, GeoJSON, layers |
| COM Service | Go + Gin | Tickets, deduplicación, MQTT |
| Dashboard | Next.js | Single codebase, role-based rendering |
| Base de datos | PostgreSQL + PostGIS | Docker local / Cloud SQL GCP |
| Cache | Redis | Docker local / Memorystore GCP |
| Logs | MongoDB | Atlas free tier |
| Broker MQTT | EMQX | Docker local / EMQX Cloud Serverless |
| Mapas | MapLibre + OpenStreetMap | Gratuito, offline, migrable |

### Notas importantes de infraestructura
- Dockerfiles NestJS y Next.js corren en **modo dev** (sin multi-stage)
- Go services usan `golang:1.23-alpine`
- `go.sum` generado con `go mod tidy` localmente antes de buildear
- `synchronize: false` en TypeORM — las tablas las maneja `init.sql`
- Para producción GCP: cambiar Dockerfiles a multi-stage build
- Adminer en puerto 8082 (8080 ocupado en la máquina del founder)

### En evaluación (decidir cuando llegue el momento)
- Flutter vs React Native para app móvil
- n8n vs código propio para OpenClaw
- Proveedor SMS: Twilio u opción local
- LLM para OpenClaw v2
- Pasarela de pago para módulo de donaciones

---

## Infraestructura — modelo de tres modos

| Modo | Descripción | Costo aprox. |
|------|------------|-------------|
| Consulta | Solo DB activa, microservicios apagados | ~$0/mes |
| Activo | Core encendido + módulos del perfil | ~$13–26/mes |
| Crisis | VPS dedicada por Evento, todos los módulos | $50–200+/mes |

---

## Roadmap — 4 etapas

### Etapa 1 — MVP (EN DESARROLLO)
**Completado:** Auth/IAM, Eventos, Alertas con MQTT en tiempo real, Mapas con MapLibre, COM básico con tickets, Dashboard con mapa operativo, board Kanban, formulario COM estructurado.

**Pendiente en E1:**
- Actualizar estados de ticket al nuevo esquema (nuevo→abierto→atendido→asignado→en_seguimiento→demorado→cerrado→archivado)
- Barra de estado inferior
- Log de actividades (widget togglable)
- Layers del mapa con toggles
- Asignación de tickets a persona específica
- Widgets togglables por evento
- Schema SQL de catálogos (tablas configurables)
- Formulario COM ciudadano (Nivel 0, simplificado)

### Etapa 2 — Integración
IoT/Telemetría, App Flutter offline-first, OpenClaw v1 (escalación), Logística e inventarios, Albergues, Notificaciones SMS/email

### Etapa 3 — Escalamiento
OpenClaw v2 (análisis logístico), Analítica predictiva, K8s, Interoperabilidad nacional

### Etapa 4 — Internacional
OPS/OMS, Multi-idioma, Marketplace templates, Modelo de negocio activo

---

## Features pendientes (definidas, no en desarrollo)

| ID | Feature | Prioridad | Etapa |
|----|---------|-----------|-------|
| F-001 | Módulo de donaciones con transparencia total | Alta | 3-4 |
| F-002 | Agente IA para agrupación de requests duplicados | Media | 2-3 |
| F-003 | Notificaciones SMS/Email al ciudadano | Alta | 2 |
| F-004 | App móvil Flutter offline-first | Alta | 2 |
| F-005 | Módulo de logística e inventarios | Muy alta | 2-3 |
| F-006 | Elevar ticket a alerta | Media | 1 |
| F-007 | Reportes por organización | Media | 2-3 |
| F-008 | Niveles de confianza adicionales custom | Baja | 3-4 |
| F-009 | Alarmas vecinales (side project MQTT) | Media | 3 |
| F-010 | Comunicados oficiales en eventos | Media | 2 |
| F-011 | Cierre de ticket con referencia cruzada | Alta | 1 |
| F-012 | Panel de configuración Core | Alta | 1-2 |
| F-013 | Feed MQTT y widgets togglables por evento | Media | 1 |
| F-014 | Filtros avanzados en board de tickets | Alta | 1 |
| F-015 | Interoperabilidad OPS/OMS/ONU | Baja | 4 |

### Detalle F-001 — Módulo de Donaciones
Feature killer de transparencia. Cuando se selecciona "Apoyo Económico" en un ticket, abre submódulo completo:
- Lista de requerimientos de compra con costo estimado
- Portal público para donantes — seleccionan partidas como "lista de compras"
- Motor de asignación: una donación puede cubrir partes de varias partidas
- Registro de ejecución con comprobantes
- Reporte PDF al donante: "Tu donación de $X compró Y en Z"
- Dashboard público: "Se recibieron $X, se gastaron $Y en esto"
- Futuro: integración con pasarela de pago, recibos deducibles

### Detalle F-005 — Módulo de Logística
**La ventaja competitiva principal de AidMesh.**
OpenClaw analiza: tickets abiertos + inventarios por centro de acopio + distancias → sugiere distribución óptima automáticamente. Trazabilidad completa de cada insumo desde donación hasta entrega.

---

## Decisiones de arquitectura tomadas (no reabrir sin razón)

| Decisión | Elección | Razón |
|----------|---------|-------|
| Permisos | Core + override por evento | Flexibilidad sin perder consistencia |
| resource_category | VARCHAR(100) libre | Soporta acentos, más flexible que enum |
| Catálogos | Tablas configurables, no enums | Panel Core editable sin código |
| Mapas | MapLibre + OSM | Gratuito, offline, migrable a Google Maps |
| MQTT broker dev | EMQX Docker | Mismo protocolo que producción |
| TypeORM synchronize | false | Las tablas las maneja init.sql |
| Dockerfiles | Modo dev | Producción GCP usará multi-stage |
| Estados ticket/evento | Hardcodeados en core | Consistencia en todos los eventos |
| Cantidad+unidad | Dos dropdowns + campo libre | Nunca asumir unidad |
| Widgets dashboard | Togglables, sin drag and drop | Simple primero |
| Override permisos | Solo Nivel 3 | Control centralizado |

## Decisiones pendientes (NO asumir, preguntar)

- Stack app móvil: Flutter vs React Native
- Orquestador OpenClaw: n8n vs código propio
- LLM para OpenClaw v2: sin evaluar
- Proveedor SMS: Twilio u otro
- Pasarela de pago para donaciones
- Modelo de negocio: sin definir
- Estructura legal/fiscal: sin definir

---

## Repositorio — estructura
```
aidmesh/
├── apps/
│   ├── api-gateway/        # NestJS
│   ├── auth-service/       # NestJS
│   ├── alerts-service/     # NestJS
│   ├── maps-service/       # Go
│   ├── com-service/        # Go
│   └── dashboard/          # Next.js
├── packages/
│   ├── shared-types/
│   ├── mqtt-topics/
│   └── proto/
├── infra/
│   ├── docker/
│   │   ├── docker-compose.yml
│   │   └── postgres/init.sql
│   ├── scripts/
│   ├── k8s/
│   └── terraform/
└── docs/
    └── AI_CONTEXT.md       # Este archivo — única fuente de verdad
```

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
10. Los archivos largos se pueden truncar en el chat — siempre verificar que el founder vea el archivo completo antes de asumir que se guardó bien.
11. Antes de codificar features nuevas, verificar que estén en el roadmap o features pendientes. Si no están, discutir primero.
12. El founder tiene experiencia práctica en crisis reales — sus decisiones de flujo operativo son correctas aunque parezcan complejas técnicamente.