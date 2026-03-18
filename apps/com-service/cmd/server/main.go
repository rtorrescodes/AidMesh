package main

import (
	"context"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"github.com/rtorrescodes/aidmesh/com-service/internal/handlers"
	"github.com/rtorrescodes/aidmesh/com-service/internal/middleware"
	"github.com/rtorrescodes/aidmesh/com-service/internal/mqtt"
	"github.com/rtorrescodes/aidmesh/com-service/internal/repository"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file, usando variables de entorno del sistema")
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL no configurada")
	}

	db, err := pgxpool.New(context.Background(), dbURL)
	if err != nil {
		log.Fatalf("Error conectando a PostgreSQL: %v", err)
	}
	defer db.Close()

	if err := db.Ping(context.Background()); err != nil {
		log.Fatalf("Error en ping a PostgreSQL: %v", err)
	}
	log.Println("PostgreSQL conectado")

	mqttClient := mqtt.NewMQTTClient()
	defer mqttClient.Disconnect()

	repo := repository.NewCOMRepository(db)
	ticketsHandler := handlers.NewTicketsHandler(repo, mqttClient)
	signalsHandler := handlers.NewSignalsHandler(repo, mqttClient)

	if os.Getenv("NODE_ENV") == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "com-service"})
	})

	// Endpoint público — señales ciudadanas sin JWT
	r.POST("/api/signals", signalsHandler.Create)

	// Endpoints protegidos
	api := r.Group("/api")
	api.Use(middleware.JWTAuth())
	{
		// Tickets COM
		tickets := api.Group("/tickets")
		{
			tickets.POST("",
				middleware.RequirePermission("com:send_structured"),
				ticketsHandler.Create,
			)
			tickets.GET("",    ticketsHandler.GetByEvent)
			tickets.GET("/:id", ticketsHandler.GetByID)
			tickets.PATCH("/:id",
				middleware.RequirePermission("com:send_structured"),
				ticketsHandler.Update,
			)
			// ← NUEVAS RUTAS
			tickets.PATCH("/:id/assign",
				middleware.RequirePermission("com:assign_tickets"),
				ticketsHandler.Assign,
			)
			tickets.GET("/:id/assignable-users",
				middleware.RequirePermission("com:assign_tickets"),
				ticketsHandler.GetAssignableUsers,
			)
		}

		// Señales ciudadanas — revisión por operadores
		signals := api.Group("/signals")
		{
			signals.GET("",
				middleware.RequirePermission("citizens:review_signals"),
				signalsHandler.GetPending,
			)
			signals.PATCH("/:id/review",
				middleware.RequirePermission("citizens:review_signals"),
				signalsHandler.Review,
			)
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "3004"
	}

	log.Printf("COM Service corriendo en puerto %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Error iniciando servidor: %v", err)
	}
}