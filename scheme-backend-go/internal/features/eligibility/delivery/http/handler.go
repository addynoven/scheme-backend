package http

import (
	"net/http"

	"github.com/gofiber/fiber/v2"
	"scheme-backend-go/internal/features/eligibility/dto"
	"scheme-backend-go/internal/features/eligibility/service"
	"scheme-backend-go/internal/pkg/errors"
	"scheme-backend-go/internal/pkg/jwt"
	"scheme-backend-go/internal/pkg/middleware"
)

type EligibilityHandler struct {
	svc    service.EligibilityService
	jwtSvc *jwt.Service
}

func NewEligibilityHandler(svc service.EligibilityService, jwtSvc *jwt.Service) *EligibilityHandler {
	return &EligibilityHandler{
		svc:    svc,
		jwtSvc: jwtSvc,
	}
}

func (h *EligibilityHandler) RegisterRoutes(router fiber.Router) {
	elig := router.Group("/eligibility")
	elig.Post("/check", middleware.OptionalAuth(h.jwtSvc), h.Check)
	elig.Post("/explain", middleware.OptionalAuth(h.jwtSvc), h.Explain)
	elig.Post("/explain/:slug", middleware.OptionalAuth(h.jwtSvc), h.Explain)
}

func (h *EligibilityHandler) Check(c *fiber.Ctx) error {
	var req dto.EligibilityCheckRequest
	if err := c.BodyParser(&req); err != nil {
		return errors.BadRequest("Invalid request body")
	}

	var userID *int32
	if uid, err := middleware.GetUserID(c); err == nil {
		userID = &uid
	}

	resp, err := h.svc.CheckEligibility(c.UserContext(), userID, req)
	if err != nil {
		return err
	}

	return c.Status(http.StatusOK).JSON(resp)
}

func (h *EligibilityHandler) Explain(c *fiber.Ctx) error {
	slug := c.Params("slug")
	if slug == "" {
		slug = c.Query("slug", "")
	}
	if slug == "" {
		return errors.BadRequest("Scheme slug is required")
	}

	var req dto.EligibilityCheckRequest
	if err := c.BodyParser(&req); err != nil {
		return errors.BadRequest("Invalid request body")
	}

	resp, err := h.svc.ExplainScheme(c.UserContext(), slug, req)
	if err != nil {
		return err
	}

	return c.Status(http.StatusOK).JSON(resp)
}
