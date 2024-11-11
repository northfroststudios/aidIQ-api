package controllers

import (
	"aidIQ/api/internal/dto"
	services "aidIQ/api/internal/services/auth"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

type AuthController struct {
	service services.AuthService
}

func NewAuthController(service services.AuthService) *AuthController {
	return &AuthController{service: service}
}

func (c *AuthController) SignUpWithEmailAndPassword(ctx *gin.Context) {
	var body dto.EmailSignUpRequest

	if err := ctx.Bind(&body); err != nil {
		log.Print(err)
		ctx.JSON(http.StatusOK, gin.H{
			"error": "unable to parse request body",
		})
		return
	}

	err := c.service.SignUpWithEmailAndPassword(body)
	if err != nil {
		log.Print(err)
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"error": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "sign up successful",
	})
}
