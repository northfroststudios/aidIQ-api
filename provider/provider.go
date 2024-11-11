package provider

import (
	"github.com/go-playground/validator/v10"
	"gorm.io/gorm"
)

type Provider struct {
	DB *gorm.DB
}

func NewProvider(db *gorm.DB, validator *validator.Validate) *Provider {

	return &Provider{
		DB: db,
	}
}
