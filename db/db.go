package db

import (
	"aidIQ/api/config"
	"aidIQ/api/internal/models"
	"fmt"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/schema"
)

func InitDB() (*gorm.DB, error) {
	// Create the DB Connection String from the config
	dsn := fmt.Sprintf("postgresql://%s:%s@%s:%s/%s", config.ENV.DBUser, config.ENV.DBPassword, config.ENV.DBHost, config.ENV.DBPort, config.ENV.DBName)

	db, err := gorm.Open(postgres.New(postgres.Config{
		DSN:                  dsn,
		PreferSimpleProtocol: true,
	}), &gorm.Config{
		NamingStrategy: schema.NamingStrategy{
			SingularTable: false,
		},
	})

	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Create ENUM type for Auth Provider if it doesn't exist
	err = db.Exec("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'auth_provider') THEN CREATE TYPE auth_provider AS ENUM ('email', 'google', 'github'); END IF; END $$;").Error
	if err != nil {
		return nil, fmt.Errorf("failed to run create enum: %w", err)
	}

	// Run DB Migrations
	err = db.AutoMigrate(&models.User{}, &models.Account{})
	if err != nil {
		return nil, fmt.Errorf("failed to run migrations: %w", err)
	}

	log.Print("Connected to database and migrations applied")
	return db, nil
}
