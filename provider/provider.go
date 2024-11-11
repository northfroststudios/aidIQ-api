package provider

import (
	"aidIQ/api/internal/controllers"
	services "aidIQ/api/internal/services/auth"

	"github.com/go-playground/validator/v10"
	"gorm.io/gorm"
)

type Provider struct {
	AuthController *controllers.AuthController
	DB             *gorm.DB
}

func NewProvider(db *gorm.DB, validator *validator.Validate) *Provider {

	// Initialize service
	authService := services.NewAuthService(validator, db)

	// Initialize handler
	authController := controllers.NewAuthController(authService)

	return &Provider{
		DB:             db,
		AuthController: authController,
	}
}
