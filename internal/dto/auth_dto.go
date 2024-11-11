package dto

type EmailSignUpRequest struct {
	FirstName       string `json:"first_name" validate:"required"`
	LastName        string `json:"last_name" validate:"required"`
	UserName        string `json:"user_name" validate:"required"`
	Email           string `json:"email" validate:"required,email"`
	Password        string `json:"password" validate:"required,min=8,max=32"`
	ConfirmPassword string `json:"confirm_password" validate:"required,min=8"`
}

type AuthResponse struct {
	FirstName    string `json:"first_name"`
	LastName     string `json:"last_name"`
	UserName     string `json:"user_name"`
	Email        string `json:"email"`
	ID           string `json:"id"`
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int64  `json:"expires_in"`
}
