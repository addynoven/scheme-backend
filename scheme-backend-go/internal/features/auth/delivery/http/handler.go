package http

import (
	"net/http"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"scheme-backend-go/internal/features/auth/dto"
	"scheme-backend-go/internal/features/auth/service"
	"scheme-backend-go/internal/pkg/errors"
	"scheme-backend-go/internal/pkg/jwt"
	"scheme-backend-go/internal/pkg/middleware"
)

type AuthHandler struct {
	svc      service.AuthService
	validate *validator.Validate
	jwtSvc   *jwt.Service
}

func NewAuthHandler(svc service.AuthService, jwtSvc *jwt.Service) *AuthHandler {
	return &AuthHandler{
		svc:      svc,
		validate: validator.New(),
		jwtSvc:   jwtSvc,
	}
}

func (h *AuthHandler) RegisterRoutes(router fiber.Router) {
	// Auth routes
	authGroup := router.Group("/auth")
	authGroup.Post("/register", h.Register)
	authGroup.Post("/login", h.Login)
	authGroup.Post("/google", h.GoogleAuth)
	authGroup.Post("/refresh", h.RefreshToken)
	authGroup.Get("/me", middleware.Auth(h.jwtSvc), h.GetMe)

	// User profile routes
	usersGroup := router.Group("/users")
	usersGroup.Get("/me", middleware.Auth(h.jwtSvc), h.GetMe)
	usersGroup.Get("/me/profile", middleware.Auth(h.jwtSvc), h.GetProfile)
	usersGroup.Post("/me/profile", middleware.Auth(h.jwtSvc), h.CreateOrUpdateProfile)
	usersGroup.Patch("/me/profile", middleware.Auth(h.jwtSvc), h.CreateOrUpdateProfile)
}

func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var req dto.RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return errors.BadRequest("Invalid request body")
	}

	if err := h.validate.Struct(&req); err != nil {
		return errors.Unprocessable(err.Error())
	}

	resp, err := h.svc.Register(c.UserContext(), req)
	if err != nil {
		return err
	}

	return c.Status(http.StatusCreated).JSON(resp)
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req dto.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return errors.BadRequest("Invalid request body")
	}

	if err := h.validate.Struct(&req); err != nil {
		return errors.Unprocessable(err.Error())
	}

	resp, err := h.svc.Login(c.UserContext(), req)
	if err != nil {
		return err
	}

	return c.Status(http.StatusOK).JSON(resp)
}

func (h *AuthHandler) GoogleAuth(c *fiber.Ctx) error {
	var req dto.GoogleAuthRequest
	if err := c.BodyParser(&req); err != nil {
		return errors.BadRequest("Invalid request body")
	}

	if err := h.validate.Struct(&req); err != nil {
		return errors.Unprocessable(err.Error())
	}

	resp, err := h.svc.GoogleAuth(c.UserContext(), req)
	if err != nil {
		return err
	}

	return c.Status(http.StatusOK).JSON(resp)
}

func (h *AuthHandler) RefreshToken(c *fiber.Ctx) error {
	var req dto.RefreshTokenRequest
	if err := c.BodyParser(&req); err != nil {
		return errors.BadRequest("Invalid request body")
	}

	if err := h.validate.Struct(&req); err != nil {
		return errors.Unprocessable(err.Error())
	}

	resp, err := h.svc.RefreshToken(c.UserContext(), req)
	if err != nil {
		return err
	}

	return c.Status(http.StatusOK).JSON(resp)
}

func (h *AuthHandler) GetMe(c *fiber.Ctx) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return err
	}

	resp, err := h.svc.GetMe(c.UserContext(), userID)
	if err != nil {
		return err
	}

	return c.Status(http.StatusOK).JSON(resp)
}

func (h *AuthHandler) GetProfile(c *fiber.Ctx) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return err
	}

	resp, err := h.svc.GetProfile(c.UserContext(), userID)
	if err != nil {
		return err
	}

	return c.Status(http.StatusOK).JSON(resp)
}

func (h *AuthHandler) CreateOrUpdateProfile(c *fiber.Ctx) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return err
	}

	var req dto.ProfileRequest
	if err := c.BodyParser(&req); err != nil {
		return errors.BadRequest("Invalid request body")
	}

	if err := h.validate.Struct(&req); err != nil {
		return errors.Unprocessable(err.Error())
	}

	resp, err := h.svc.CreateOrUpdateProfile(c.UserContext(), userID, req)
	if err != nil {
		return err
	}

	return c.Status(http.StatusOK).JSON(resp)
}
