package main

import (
	"context"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"github.com/rtorrescodes/aidmesh/maps-service/internal/handlers"
	"github.com/rtorrescodes/aidmesh/maps-service/internal/middleware"
	"github.com/rtorrescodes/aidmesh/maps-service/internal/repository"
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

	repo := repository.NewMapsRepository(db)
	layersHandler := handlers.NewLayersHandler(repo)
	routesHandler := handlers.NewRoutesHandler(repo)

	if os.Getenv("NODE_ENV") == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "maps-service"})
	})

	api := r.Group("/api")
	api.Use(middleware.JWTAuth())
	{
		layers := api.Group("/layers")
		{
			layers.POST("", layersHandler.Create)
			layers.GET("", layersHandler.GetByEvent)
			layers.GET("/:id", layersHandler.GetByID)
		}

		routes := api.Group("/routes")
		{
			routes.POST("", routesHandler.Create)
			routes.GET("", routesHandler.GetByEvent)
			routes.GET("/:id", routesHandler.GetByID)
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "3003"
	}

	log.Printf("Maps Service corriendo en puerto %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Error iniciando servidor: %v", err)
	}
}