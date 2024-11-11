package models

import "time"

type Account struct {
	ID              string       `gorm:"primaryKey" json:"id"`
	UserID          string       `gorm:"column:user_id;index;not null" json:"user_id"`
	Provider        AuthProvider `gorm:"type:auth_provider;not null" json:"provider"`
	ProviderID      string       `gorm:"column:provider_id;uniqueIndex" json:"provider_id"`
	PasswordHash    string       `json:"-"` // Only used if Provider is 'email'
	CreatedAt       time.Time    `json:"created_at"`
	UpdatedAt       time.Time    `json:"updated_at"`
}

// AuthProvider defines the type of login provider
type AuthProvider string

const (
	AuthProviderEmail  AuthProvider = "email"
	AuthProviderGoogle AuthProvider = "google"
	AuthProviderGithub AuthProvider = "github"
)
