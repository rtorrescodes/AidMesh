\# AidMesh



Plataforma de coordinación de respuesta crítica para eventos que superan la capacidad de respuesta normal de una comunidad: desastres naturales, emergencias de salud pública, búsqueda y rescate, operaciones humanitarias.



\## ¿Qué problema resuelve?



En una crisis, todos quieren ayudar pero nadie sabe qué ya está siendo atendido, qué recursos existen, ni a quién reportar. AidMesh impone estructura y trazabilidad donde naturalmente hay caos humano.



\*\*Piloto:\*\* Baja California Sur — en coordinación con Protección Civil BCS.



\---



\## Stack



| Capa | Tecnología |

|------|-----------|

| API Gateway | NestJS |

| Auth Service | NestJS |

| Alerts Service | NestJS |

| Maps Service | Go |

| COM Service | Go |

| Dashboard | Next.js |

| Base de datos | PostgreSQL + PostGIS |

| Cache | Redis |

| Logs | MongoDB Atlas |

| Broker MQTT | EMQX Cloud Serverless |

| Comunicación interna | gRPC |

| Contenedores | Docker + Docker Compose |

| Cloud | GCP |



\---



\## Estructura del repositorio

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

│   ├── shared-types/       # Tipos TypeScript compartidos

│   ├── mqtt-topics/        # Constantes de topics MQTT

│   └── proto/              # Definiciones gRPC

├── infra/

│   ├── docker/             # docker-compose.yml dev local

│   ├── scripts/            # Scripts GCP CLI

│   ├── k8s/                # Manifiestos K8s (Etapa 3)

│   └── terraform/          # IaC GCP (Etapa 3)

└── docs/

&#x20;   ├── adr/                # Architecture Decision Records

&#x20;   └── ...

```



\---



\## Levantar entorno local

```bash

docker compose -f infra/docker/docker-compose.yml up -d

```



Requiere Docker Desktop instalado.



\---



\## Etapas de desarrollo



| Etapa | Objetivo | Estado |

|-------|---------|--------|

| E1 — MVP | Auth, Eventos, Alertas, Mapas, COM, Dashboard | 🔨 En construcción |

| E2 — Integración | IoT, App móvil, OpenClaw v1 | ⏳ Pendiente |

| E3 — Escalamiento | Analítica, K8s, OpenClaw v2 | ⏳ Futuro |

| E4 — Internacional | OPS/OMS, modelo de negocio | ⏳ Futuro lejano |



\---



\## Documentación



\- \[PRD v2.0](docs/PRD-v2.md)

\- \[Mapa de Módulos](docs/module-map.md)

\- \[Roadmap](docs/roadmap.md)

\- \[Infraestructura](docs/infrastructure.md)

\- \[Perfiles de Despliegue](docs/deployment-profiles.md)

\- \[Contexto IA](docs/AI\_CONTEXT.md)

