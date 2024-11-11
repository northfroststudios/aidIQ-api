package services

import (
	"aidIQ/api/internal/dto"
	auth "aidIQ/api/internal/helpers"
	"aidIQ/api/internal/models"
	"errors"

	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AuthService interface {
	SignUpWithEmailAndPassword(req dto.EmailSignUpRequest) error
}

type authService struct {
	validator *validator.Validate
	db        *gorm.DB
}

func NewAuthService(validator *validator.Validate, db *gorm.DB) AuthService {
	return &authService{
		validator: validator,
		db:        db,
	}
}

// SignInWithEmail allows users to sign up with a valid email and password. This comes with an email verification feature
func (a *authService) SignUpWithEmailAndPassword(req dto.EmailSignUpRequest) error {
	err := a.validator.Struct(req)
	if err != nil {
		return err
	}

	if req.Password != req.ConfirmPassword {
		return errors.New("passwords do not match")
	}

	if !auth.IsEmailUnique(a.db, req.Email) {
		return errors.New("user with provided email exists")
	}

	hashedPassword, err := auth.HashPassword(req.Password)
	if err != nil {
		return err
	}

	// Start a DB transaction to create a user and account
	a.db.Transaction(func(tx *gorm.DB) error {
		// Create a new User
		user := models.User{
			ID:        uuid.NewString(),
			FirstName: req.FirstName,
			LastName:  req.LastName,
			UserName:  req.UserName,
			Email:     req.Email,
		}

		if err := tx.Create(&user).Error; err != nil {
			return err
		}

		// Create a new Account with the UserID from the created User
		account := models.Account{
			ID:       uuid.NewString(),
			UserID:   user.ID,
			Provider: "email",
			// ProviderID:   "email",
			PasswordHash: string(hashedPassword),
		}

		if err := tx.Create(&account).Error; err != nil {
			return err
		}

		return nil
	})

	return nil
}
