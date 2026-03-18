package models

import "time"

type TicketStatus     string
type TicketPriority   string
type NeedType         string
type ResourceCategory string

const (
TicketStatusNuevo         TicketStatus = "nuevo"
TicketStatusAbierto       TicketStatus = "abierto"
TicketStatusAtendido      TicketStatus = "atendido"
TicketStatusAsignado      TicketStatus = "asignado"
TicketStatusEnSeguimiento TicketStatus = "en_seguimiento"
TicketStatusDemorado      TicketStatus = "demorado"
TicketStatusCerrado       TicketStatus = "cerrado"
TicketStatusArchivado     TicketStatus = "archivado"
)

const (
PriorityLow      TicketPriority = "baja"
PriorityMedium   TicketPriority = "media"
PriorityHigh     TicketPriority = "alta"
PriorityCritical TicketPriority = "critica"
)

const (
NeedTypeAguaPotable            NeedType = "agua_potable"
NeedTypeAlimentosNoPerecederos NeedType = "alimentos_no_perecederos"
NeedTypeAlimentosPreparados    NeedType = "alimentos_preparados"
NeedTypeFormulaInfantil        NeedType = "formula_infantil"
NeedTypeHidratacionOral        NeedType = "hidratacion_oral"
NeedTypeAtencionMedica         NeedType = "atencion_medica"
NeedTypeMedicamentos           NeedType = "medicamentos"
NeedTypeEquipoMedico           NeedType = "equipo_medico"
NeedTypeSaludMental            NeedType = "salud_mental"
NeedTypeAtencionHeridos        NeedType = "atencion_heridos"
NeedTypeKitHigiene             NeedType = "kit_higiene"
NeedTypePaniales               NeedType = "pañales"
NeedTypeAguaSaneamiento        NeedType = "agua_saneamiento"
NeedTypeBanosPortatiles        NeedType = "banos_portatiles"
NeedTypeAlbergue               NeedType = "albergue_temporal"
NeedTypeCarpas                 NeedType = "carpas"
NeedTypeColchonetas            NeedType = "cobijas_colchonetas"
NeedTypeKitDormitorio          NeedType = "kit_dormitorio"
NeedTypeRopaAdulto             NeedType = "ropa_adulto"
NeedTypeRopaInfantil           NeedType = "ropa_infantil"
NeedTypeCalzado                NeedType = "calzado"
NeedTypeRopaFrio               NeedType = "ropa_clima_frio"
NeedTypeTransportePersonas     NeedType = "transporte_personas"
NeedTypeTransporteSuministros  NeedType = "transporte_suministros"
NeedTypeCombustible            NeedType = "combustible"
NeedTypeVehiculoRescate        NeedType = "vehiculo_rescate"
NeedTypeEnergiaElectrica       NeedType = "energia_electrica"
NeedTypePanelesSolares         NeedType = "paneles_solares"
NeedTypeComunicacionRadio      NeedType = "comunicacion_radio"
NeedTypeConectividad           NeedType = "conectividad_internet"
NeedTypeRescateUrbano          NeedType = "rescate_urbano"
NeedTypeRescateAcuatico        NeedType = "rescate_acuatico"
NeedTypeRescateMontana         NeedType = "rescate_montaña"
NeedTypePerrosRescate          NeedType = "perros_rescate"
NeedTypeSeguridadPerimetral    NeedType = "seguridad_perimetral"
NeedTypeControlAcceso          NeedType = "control_acceso"
NeedTypeEvacuacionZona         NeedType = "evacuacion_zona"
NeedTypeHerramientas           NeedType = "herramientas_obra"
NeedTypeVoluntarios            NeedType = "voluntarios_campo"
NeedTypeMaquinaria             NeedType = "maquinaria_pesada"
NeedTypeApoyoPsicosocial       NeedType = "apoyo_psicosocial"
)

const (
ResourceFood      ResourceCategory = "víveres"
ResourceMedicine  ResourceCategory = "medicamentos"
ResourceEquipment ResourceCategory = "equipo"
ResourcePersonnel ResourceCategory = "personal"
ResourceVehicle   ResourceCategory = "vehículo"
ResourceShelter   ResourceCategory = "albergue"
)

type COMTicket struct {
ID               string                 `json:"id"                    db:"id"`
EventID          string                 `json:"event_id"              db:"event_id"`
NeedType         NeedType               `json:"need_type"             db:"need_type"`
ResourceCategory ResourceCategory       `json:"resource_category"     db:"resource_category"`
Priority         TicketPriority         `json:"priority"              db:"priority"`
Status           TicketStatus           `json:"status"                db:"status"`
Quantity         *int                   `json:"quantity,omitempty"    db:"quantity"`
Latitude         float64                `json:"latitude"              db:"latitude"`
Longitude        float64                `json:"longitude"             db:"longitude"`
Description      *string                `json:"description,omitempty" db:"description"`
Payload          map[string]interface{} `json:"payload"               db:"payload"`
ReportCount      int                    `json:"report_count"          db:"report_count"`
CreatedBy        *string                `json:"created_by,omitempty"  db:"created_by"`
AssignedTo       *string                `json:"assigned_to,omitempty" db:"assigned_to"`
AssignedBy       *string                `json:"assigned_by,omitempty" db:"assigned_by"`
AssignedAt       *time.Time             `json:"assigned_at,omitempty" db:"assigned_at"`
OrgID            *string                `json:"org_id,omitempty"      db:"org_id"`
CreatedAt        time.Time              `json:"created_at"            db:"created_at"`
UpdatedAt        time.Time              `json:"updated_at"            db:"updated_at"`
ResolvedAt       *time.Time             `json:"resolved_at,omitempty" db:"resolved_at"`
DelayedAt        *time.Time             `json:"delayed_at,omitempty"  db:"delayed_at"`
ArchivedAt       *time.Time             `json:"archived_at,omitempty" db:"archived_at"`
}

type CreateTicketRequest struct {
EventID          string           `json:"event_id"          binding:"required"`
NeedType         NeedType         `json:"need_type"         binding:"required"`
ResourceCategory ResourceCategory `json:"resource_category" binding:"required"`
Priority         TicketPriority   `json:"priority"          binding:"required"`
Quantity         *int             `json:"quantity"`
Latitude         float64          `json:"latitude"          binding:"required"`
Longitude        float64          `json:"longitude"         binding:"required"`
Description      *string          `json:"description"`
}

type UpdateTicketRequest struct {
Status   *TicketStatus   `json:"status"`
Priority *TicketPriority `json:"priority"`
}

type AssignTicketRequest struct {
AssignedTo string `json:"assigned_to" binding:"required"`
}

type TicketMQTTPayload struct {
TicketID  string         `json:"ticket_id"`
EventID   string         `json:"event_id"`
NeedType  NeedType       `json:"need_type"`
Priority  TicketPriority `json:"priority"`
Status    TicketStatus   `json:"status"`
Latitude  float64        `json:"latitude"`
Longitude float64        `json:"longitude"`
Timestamp time.Time      `json:"timestamp"`
}

type TicketAssignedPayload struct {
TicketID   string    `json:"ticket_id"`
EventID    string    `json:"event_id"`
AssignedTo string    `json:"assigned_to"`
AssignedBy string    `json:"assigned_by"`
AssignedAt time.Time `json:"assigned_at"`
}

type AssignableUser struct {
ID         string  `json:"id"`
Name       string  `json:"name"`
Email      string  `json:"email"`
TrustLevel int     `json:"trust_level"`
OrgID      *string `json:"org_id,omitempty"`
}
