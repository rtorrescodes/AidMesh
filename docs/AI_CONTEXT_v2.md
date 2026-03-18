# AidMesh — Catálogos del Sistema
**Versión:** 1.0  
**Última actualización:** Marzo 2026  
**Propósito:** Datos maestros que van en CORE (init.sql) y son configurables por Nivel 3.

---

## Arquitectura de catálogos

### Regla fundamental
- **Core** = datos que se cargan en TODOS los eventos nuevos (init.sql)
- **Override por evento** = Nivel 3 puede agregar/desactivar ítems solo para ese evento
- **Edición de Core** = Solo Nivel 3 desde panel de configuración, afecta eventos FUTUROS únicamente

### Tablas en base de datos
```
core_event_types          → tipos de evento
core_event_durations      → tipos de duración
core_need_categories      → categorías de necesidad (Alimento, Salud, etc.)
core_need_types           → tipos de necesidad con unidades sugeridas
core_supply_categories    → categorías de insumos
core_supplies             → ítems de insumos
core_units                → unidades de medida

event_catalog_overrides   → personalizaciones por evento (agrega/desactiva ítems)
```

---

## Catálogo 1 — Tipos de Evento

| ID | Tipo | Descripción |
|----|------|-------------|
| EVT-01 | Huracán / Ciclón / Tifón | Fenómeno meteorológico con vientos muy fuertes |
| EVT-02 | Sismo / Terremoto | Movimiento telúrico de la corteza terrestre |
| EVT-03 | Tsunami | Oleaje gigante por sismos submarinos |
| EVT-04 | Inundación | Desbordamiento por lluvias o deshielo |
| EVT-05 | Incendio Forestal / Estructural | Fuego en zonas forestales o urbanas |
| EVT-06 | Sequía | Escasez extrema de agua |
| EVT-07 | Ola de Calor / Frío Extremo | Temperaturas atípicas que afectan salud pública |
| EVT-08 | Deslizamiento / Alud / Derrumbe | Movimiento de tierra, rocas o nieve |
| EVT-09 | Erupción Volcánica | Actividad volcánica con lava o ceniza |
| EVT-10 | Tormenta Convectiva Severa | Tornados, granizo de gran tamaño |
| EVT-11 | Crisis Sanitaria / Pandemia | Enfermedades que requieren respuesta de salud pública |
| EVT-12 | Accidente Químico / Radiológico | Derrame o fuga de materiales peligrosos |
| EVT-13 | Crisis Humanitaria Compleja | Combinación de conflicto, desplazamiento y hambruna |
| EVT-14 | Conflicto Armado / Violencia | Guerra o violencia organizada |
| EVT-15 | Crisis de Desplazamiento Masivo | Movimientos forzados de población |
| EVT-16 | Inseguridad Alimentaria / Hambruna | Crisis por falta de alimentos |
| EVT-17 | Evento Masivo | Conciertos, peregrinaciones, concentraciones |
| EVT-18 | Colapso de Cadena de Suministro | Interrupción del flujo de bienes esenciales |
| EVT-19 | Plaga Agrícola | Crisis fitosanitaria que afecta cultivos |
| EVT-20 | Otro | Cualquier evento no clasificado |

---

## Catálogo 2 — Tipos de Duración del Evento

| ID | Tipo | Descripción |
|----|------|-------------|
| DUR-01 | Eventual | Ocurre esporádicamente, sin periodicidad |
| DUR-02 | Estacional | Ocurre en épocas específicas del año |
| DUR-03 | Permanente / Larga Duración | Situación continua que dura años |
| DUR-04 | Con Vigencia | Tiene fecha de inicio y fin definidas |
| DUR-05 | Recurrente | Se repite con frecuencia |
| DUR-06 | Indeterminado | No se conoce la duración potencial |

---

## Catálogo 3 — Estados del Evento (HARDCODEADOS — no modificables)

| ID | Estado | Descripción | Quién cambia |
|----|--------|-------------|--------------|
| EST-01 | Preparando | Borrador, configurándose | Nivel 3 |
| EST-02 | Activo | Operativo, todos pueden operar | Nivel 3 |
| EST-03 | Desactivado | Solo visible para Nivel 3 | Nivel 3 |
| EST-04 | Contenido | Visible todos, solo lectura | Nivel 3 |
| EST-05 | Cerrado | Finalizado, se puede reabrir | Nivel 3 |
| EST-06 | Archivado | Solo lectura, no se puede reabrir | Nivel 3 |

---

## Catálogo 4 — Estados de Ticket (HARDCODEADOS — no modificables)

| Estado | Color | Descripción |
|--------|-------|-------------|
| NUEVO | Gris | Recién creado, sin revisar |
| ABIERTO | Azul | Pendiente de atención |
| ATENDIDO | Verde claro | Alguien lo tomó |
| ASIGNADO | Verde | Asignado a persona específica |
| EN_SEGUIMIENTO | Azul medio | En proceso activo |
| DEMORADO | Naranja | Sin actividad más allá del timeout |
| CERRADO | Gris oscuro | Resuelto, documentado |
| ARCHIVADO | Invisible | Solo en reportes |

**Tickets CRÍTICOS:** Hacen blink hasta ser atendidos, independiente del estado.  
**Estado DEMORADO:** Automático por timeout configurable por tipo de necesidad en setup del evento.

---

## Catálogo 5 — Categorías y Tipos de Necesidad

Selector en 2 niveles: Categoría → Tipo de Necesidad → Unidades sugeridas automáticamente.

### Alimento e Hidratación
| ID | Tipo | Unidades sugeridas |
|----|------|--------------------|
| NEC-01 | Agua Potable | Litros, Galones, Botellones, Paquetes de 12 botellas |
| NEC-02 | Alimento Preparado (Comida Caliente) | Raciones, Platos, Kits de comida caliente |
| NEC-03 | Despensa (Alimentos No Perecederos) | Cajas de despensa, Kilogramos, Bolsas de granos |
| NEC-04 | Alimento para Bebés (Fórmula) | Latas de fórmula, Cajas, Biberones |
| NEC-05 | Alimento para Mascotas | Kilogramos de croquetas, Latas |

### Salud y Medicinas
| ID | Tipo | Unidades sugeridas |
|----|------|--------------------|
| NEC-06 | Medicamentos Recetados | Cajas, Frascos, Inyectables |
| NEC-07 | Medicamentos de Venta Libre | Cajas de tabletas, Tubos, Sobres |
| NEC-08 | Primeros Auxilios (Botiquín) | Kits, Unidades |
| NEC-09 | Atención Médica Especializada | Consultas, Cirugías, Curaciones |
| NEC-10 | Vacunación | Dosis, Frascos de vacuna |
| NEC-11 | Equipo Médico Duradero | Unidades, Tanques de oxígeno, Pares |

### Higiene y Aseo
| ID | Tipo | Unidades sugeridas |
|----|------|--------------------|
| NEC-12 | Kit de Higiene Personal | Kits, Unidades sueltas |
| NEC-13 | Productos de Gestión Menstrual | Paquetes, Cajas |
| NEC-14 | Pañales (Bebé y Adulto) | Paquetes por talla, Unidades |
| NEC-15 | Artículos de Limpieza | Litros de cloro, Bolsas, Unidades |

### Abrigo y Vestimenta
| ID | Tipo | Unidades sugeridas |
|----|------|--------------------|
| NEC-16 | Ropa (Mujer / Hombre / Niño) | Prendas, Pares de calcetines, Paquetes |
| NEC-17 | Calzado | Pares por talla |
| NEC-18 | Frazadas / Cobijas | Unidades, Fardos de mantas |
| NEC-19 | Ropa de Cama | Juegos, Almohadas, Colchonetas |

### Refugio y Albergue
| ID | Tipo | Unidades sugeridas |
|----|------|--------------------|
| NEC-20 | Albergue Temporal | Personas, Familias, Espacios m² |
| NEC-21 | Carpa / Lona | Unidades, Metros de lona |
| NEC-22 | Reparación de Vivienda | Láminas, Bolsas de cemento, Kits |

### Logística y Transporte
| ID | Tipo | Unidades sugeridas |
|----|------|--------------------|
| NEC-23 | Transporte de Personas | Viajes, Unidades de vehículos |
| NEC-24 | Transporte de Carga / Insumos | Viajes de camión, Fletes |
| NEC-25 | Combustible | Litros, Galones, Tanques |
| NEC-26 | Almacenamiento (Bodega) | m² de bodega, Contenedores |

### Energía e Iluminación
| ID | Tipo | Unidades sugeridas |
|----|------|--------------------|
| NEC-27 | Generador Eléctrico | Unidades por KW |
| NEC-28 | Iluminación | Unidades, Postes temporales |
| NEC-29 | Baterías / Power Banks | Unidades, Paquetes de pilas |

### Comunicación e Información
| ID | Tipo | Unidades sugeridas |
|----|------|--------------------|
| NEC-30 | Radio de Comunicación | Unidades, Estaciones base |
| NEC-31 | Internet / Telefonía | Horas, Puntos WiFi satelital |
| NEC-32 | Información a la Comunidad | Horas de perifoneo, Volantes |

### Búsqueda y Rescate
| ID | Tipo | Unidades sugeridas |
|----|------|--------------------|
| NEC-33 | Equipo de Rescate Técnico | Kits, Unidades |
| NEC-34 | Unidades Caninas (K9) | Equipos caninos, Horas |
| NEC-35 | Maquinaria Pesada | Horas máquina, Días de alquiler |

### Seguridad y Protección
| ID | Tipo | Unidades sugeridas |
|----|------|--------------------|
| NEC-36 | Personal de Seguridad | Guardias por turno, Patrullajes |
| NEC-37 | Equipo de Protección Personal | Unidades N95, Cajas de guantes |

### Herramientas y Mano de Obra
| ID | Tipo | Unidades sugeridas |
|----|------|--------------------|
| NEC-38 | Mano de Obra (Voluntarios) | Voluntarios por hora, Cuadrillas |
| NEC-39 | Herramientas Manuales | Unidades, Juegos |
| NEC-40 | Motosierras / Equipo de Corte | Unidades, Horas de uso |

### Apoyo Económico y Psicosocial
| ID | Tipo | Unidades sugeridas |
|----|------|--------------------|
| NEC-41 | Efectivo / Vales | Monto USD / Moneda local, Tarjetas |
| NEC-42 | Apoyo Psicológico | Sesiones, Psicólogos disponibles |

---

## Catálogo 6 — Insumos para inventario y centros de acopio

### Alimentos
| Insumo | Unidad base |
|--------|-------------|
| Agua Potable | Litros |
| Alimentos No Perecederos | Kilogramos |
| Alimentos Listos para Consumir | Unidad |
| Alimento Terapéutico | Unidad |
| Fórmula Infantil | Kilogramos |
| Alimentos Especiales | Unidad |

### Salud
| Insumo | Unidad base |
|--------|-------------|
| Medicamentos Controlados | Unidad / Caja |
| Medicamentos de Venta Libre | Unidad / Caja |
| Vacunas | Dosis |
| Kits de Salud Básica | Kit |
| Equipo Médico Duradero | Unidad |
| EPP | Unidad |

### Higiene
| Insumo | Unidad base |
|--------|-------------|
| Kits de Higiene Personal | Kit |
| Productos de Gestión Menstrual | Unidad |
| Pañales | Unidad |
| Desinfectantes | Litros |
| Papel Higiénico | Unidad |

### Agua y Saneamiento
| Insumo | Unidad base |
|--------|-------------|
| Productos para Potabilización | Unidad / Litros |
| Equipo de Bombeo | Unidad |

### Abrigo y Refugio
| Insumo | Unidad base |
|--------|-------------|
| Mantas y Cobijas | Unidad |
| Ropa | Unidad |
| Carpas / Lonas / Tiendas | Unidad |
| Kits de Cocina | Kit |

### Logística
| Insumo | Unidad base |
|--------|-------------|
| Combustible | Litros |
| Generador Eléctrico | Unidad |
| Equipo de Comunicación | Unidad |
| Power Banks / Baterías | Unidad / Paquete |
| Iluminación | Unidad |
| Equipo de Rescate | Unidad |

### Otros
| Insumo | Unidad base |
|--------|-------------|
| Alimento para Mascotas | Kilogramos |
| Apoyo Económico | Monto |
| Insumos Agrícolas | Unidad |

---

## Catálogo 7 — Unidades de medida maestras
```
Unidades de volumen:    Litros, Galones, Botellones, ml
Unidades de peso:       Kilogramos, Gramos, Toneladas, Libras
Unidades de conteo:     Unidad, Par, Docena, Caja, Paquete, Fardo, Kit, Juego
Unidades de área:       m², Hectáreas
Unidades de energía:    KW, KWh
Unidades de tiempo:     Horas, Días, Turnos
Unidades económicas:    MXN, USD, Voucher, Tarjeta prepagada
Unidades de servicio:   Consulta, Sesión, Ración, Dosis, Viaje, Flete, Cuadrilla
Personalizado:          Campo de texto libre (siempre disponible)
```

---

## Notas de implementación

1. **Selector en cascada:** Categoría → Tipo de Necesidad → Unidad sugerida automática
2. **Unidad siempre editable:** La sugerida es default, el usuario puede cambiarla o escribir custom
3. **Cantidad:** Dropdown de valores comunes (1,2,5,10,20,50,100) + campo numérico libre + "Indefinido"
4. **Estos catálogos van en init.sql** como INSERT en tablas configurables, NO como enums de PostgreSQL
5. **Override por evento:** La tabla `event_catalog_overrides` guarda solo los deltas (qué se agregó o desactivó)
6. **Panel Core:** Nivel 3 edita estos catálogos desde UI, sin tocar código ni SQL