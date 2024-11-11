package main

import (
	"aidIQ/api/db"
	"aidIQ/api/internal/routes"
	"aidIQ/api/provider"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

func main() {
	database, err := db.InitDB()
	if err != nil {
		log.Fatalf("could not connect to db: %v", err)
	}

	validator := validator.New()

	provider := provider.NewProvider(database, validator)

	router := routes.SetupRouter(provider)
	router.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "Welcome to the AidIQ!🚀"})
	})

	router.Run(":8080")
}
