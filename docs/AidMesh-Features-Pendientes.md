# AidMesh — Features Pendientes
**Versión:** 1.0  
**Última actualización:** Marzo 2026  
**Propósito:** Registro de features definidas conceptualmente pero no en desarrollo activo.
**Regla:** Nada aquí se implementa sin revisión con el founder primero.

---

## F-001 — Módulo de Donaciones con Transparencia Total
**Prioridad:** Alta (ventaja competitiva)  
**Etapa estimada:** 3-4  
**Disparador:** El tipo de necesidad "Apoyo Económico" en tickets abre este submódulo.

### Concepto
Sistema de donaciones monetarias con trazabilidad completa de cómo se usó cada peso donado. No es solo recibir dinero — es demostrar transparencia total en su uso.

### Flujo propuesto
```
Donante ve lista de necesidades activas con costo estimado
  → Selecciona partidas como "lista de compras" (ej: $2,000 en agua + $3,000 en medicamentos)
  → Realiza donación por el monto que puede
  → El sistema asigna su donación a partidas específicas
  → Cuando se ejecuta el gasto, se registra contra su donación
  → Donante recibe reporte: "Tu donación de $5,000 compró X litros de agua en Todos Santos
    y Y kits médicos en La Paz. Aquí están los comprobantes."
```

### Componentes necesarios
- Lista de requerimientos de compra por evento (creada por Nivel 2/3)
- Partidas con costo estimado y proveedor sugerido
- Portal público para donantes (sin cuenta requerida)
- Motor de asignación: un donante puede cubrir parte de varias partidas
- Registro de ejecución: cuándo se compró, quién autorizó, comprobante
- Reporte de transparencia por donante (PDF descargable)
- Dashboard público del evento: "Se recibieron $X, se han gastado $Y en esto"

### Notas importantes
- Las partidas de compra NO son lo mismo que los requests ciudadanos
- Una partida puede cubrir múltiples requests del mismo tipo en distintas zonas
- Siempre debe haber un responsable que autorice el gasto (Nivel 2+)
- Todo queda en audit log con comprobantes adjuntos
- Futuro: integración con pasarela de pago (Stripe, Conekta, OXXO Pay)
- Futuro: emisión de recibos deducibles de impuestos

### Por qué es ventaja competitiva
Ningún sistema de coordinación de emergencias en México ofrece trazabilidad de donaciones en tiempo real. Esto genera confianza institucional y puede ser el argumento para que empresas privadas y gobierno donen a través de AidMesh.

---

## F-002 — Agente IA para agrupación de requests duplicados
**Prioridad:** Media  
**Etapa estimada:** 2-3  

### Concepto
OpenClaw revisa continuamente los requests ciudadanos y sugiere al operador agrupaciones: "Hay 47 requests de pañales en La Paz, ¿los junto en un solo ticket oficial?"

### Notas
- El operador siempre aprueba la agrupación, nunca es automática
- Requests de distintas localidades NO se agrupan automáticamente
- Al agrupar, se referencia qué requests originaron el ticket

---

## F-003 — Notificaciones SMS/Email al ciudadano
**Prioridad:** Alta  
**Etapa estimada:** 2  

### Concepto
Cuando un operador toma un request ciudadano y lo convierte en ticket oficial, el ciudadano recibe notificación automática.

### Mensaje ejemplo
"Hola [Nombre], tu solicitud de [tipo] fue recibida por el operador [X] y se creó el ticket oficial #1821. Puedes dar seguimiento en aidmesh.mx/ticket/1821"

### Notas
- Requiere que el ciudadano haya dejado teléfono o email
- Requests anónimos no reciben notificación
- Proveedores candidatos: Twilio, Vonage, proveedor local México

---

## F-004 — App móvil Flutter offline-first
**Prioridad:** Alta  
**Etapa estimada:** 2  

### Concepto
App para operadores y voluntarios en campo. Funciona sin internet, sincroniza cuando recupera conexión.

### Decisión pendiente
Flutter vs React Native — evaluar al inicio de Etapa 2.

---

## F-005 — Módulo de Logística e Inventarios
**Prioridad:** Muy alta (ventaja competitiva principal)  
**Etapa estimada:** 2-3  

### Concepto
Registro de inventarios por centro de acopio + análisis inteligente con OpenClaw para sugerir: qué mandar, a dónde, cuándo y en qué vehículo.

### Componentes
- Registro de centros de acopio con capacidad y ubicación
- Inventario en tiempo real por centro
- Entradas y salidas con responsable
- OpenClaw analiza: tickets abiertos + inventarios disponibles + distancias → sugiere distribución óptima
- Trazabilidad: "Esta caja de medicamentos salió del centro de acopio X el día Y, la entregó el voluntario Z en la colonia W"

### Por qué es ventaja competitiva
Es la feature que ningún sistema tiene. Convierte AidMesh de "coordinador de información" a "coordinador logístico activo".

---

## F-006 — Elevar ticket a alerta
**Prioridad:** Media  
**Etapa estimada:** 1 (pendiente en MVP)  

### Concepto
Botón en el panel de un ticket que permite a Nivel 2+ crear una alerta oficial basada en ese ticket.

### Flujo
```
Ticket de rescate crítico sin atender
  → Operador Nivel 2 decide elevar
  → Sistema crea alerta roja con las coordenadas del ticket
  → Ticket queda referenciado en la alerta
  → Alerta aparece en mapa con nivel de severidad
```

---

## F-007 — Reportes por organización
**Prioridad:** Media  
**Etapa estimada:** 2-3  

### Concepto
Nivel 2 puede generar reportes de qué hizo su organización en el evento: tickets atendidos, insumos distribuidos, voluntarios activos, horas trabajadas.

---

## F-008 — Niveles de confianza adicionales
**Prioridad:** Baja  
**Etapa estimada:** 3-4  

### Concepto
Crear niveles custom entre 1 y 2 con permisos específicos. Por ejemplo: "Líder comunitario verificado" con permiso de validar requests de su colonia pero no de crear alertas.

---

## F-009 — Alarmas vecinales
**Prioridad:** Media  
**Etapa estimada:** 3  

### Concepto
Side project conectado a AidMesh vía MQTT. Dispositivos físicos en colonias que pueden activar alertas directamente al sistema.

---

## F-010 — Comunicados oficiales en eventos
**Prioridad:** Media  
**Etapa estimada:** 2  

### Concepto
Nivel 3 puede publicar comunicados oficiales dentro del evento (boletines de Protección Civil, instrucciones de evacuación, etc.). Aparecen destacados en el dashboard para todos los niveles.

---

## F-011 — Cierre de ticket con referencia cruzada
**Prioridad:** Alta  
**Etapa estimada:** 1 (pendiente en MVP)  

### Concepto
Al cerrar un ticket, el operador puede indicar que ya fue atendido en otro ticket y referenciar el número. Evita duplicación y mantiene trazabilidad.

---

## F-012 — Panel de configuración Core
**Prioridad:** Alta  
**Etapa estimada:** 1-2  

### Concepto
Panel web para Nivel 3 que permite editar catálogos maestros (tipos de necesidad, unidades, templates COM) sin tocar código ni SQL.

---

## F-013 — Feed MQTT y widgets togglables por evento
**Prioridad:** Media  
**Etapa estimada:** 1 (pendiente en MVP)  

### Concepto
Sistema de widgets en el dashboard que se pueden prender/apagar:
- Nivel 3/2: configura para todo el evento u organización
- Nivel 1: configura personal
- Feed MQTT: por default APAGADO (solo desarrollo)
- Log de actividades: por default ENCENDIDO

---

## F-014 — Filtros avanzados en board de tickets
**Prioridad:** Alta  
**Etapa estimada:** 1 (pendiente en MVP)  

### Concepto
Filtrar tickets por: estado, prioridad, tipo de necesidad, organización, zona geográfica, fecha, responsable, demorados.

---

## F-015 — Interoperabilidad OPS/OMS/ONU
**Prioridad:** Baja  
**Etapa estimada:** 4  

### Concepto
Integración con estándares internacionales de respuesta humanitaria (CAP, HL7 FHIR, etc.) para que AidMesh pueda operar en contextos internacionales.