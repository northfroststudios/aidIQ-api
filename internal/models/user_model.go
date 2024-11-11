package models

import "time"

type User struct {
	ID              string    `gorm:"primaryKey;not null"`
	FirstName       string    `gorm:"column:first_name;not null" json:"first_name"`
	LastName        string    `gorm:"column:last_name;not null" json:"last_name"`
	UserName        string    `gorm:"column:user_name;not null" json:"user_name"`
	Email           string    `gorm:"column:email;unique;not null" json:"email"`
	IsEmailVerified bool      `gorm:"column:is_email_verified;default:false" json:"is_email_verified"`
	Accounts        []Account `gorm:"foreignKey:UserID" json:"-"`
	CreatedAt       time.Time `gorm:"column:created_at" json:"created_at"`
	UpdatedAt       time.Time `gorm:"column:updated_at" json:"updated_at"`
}

