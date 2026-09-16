package http

import (
	"net/http"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"scheme-backend-go/internal/features/admin/dto"
	"scheme-backend-go/internal/features/admin/service"
	"scheme-backend-go/internal/pkg/errors"
	"scheme-backend-go/internal/pkg/jwt"
	"scheme-backend-go/internal/pkg/middleware"
)

type AdminHandler struct {
	svc    service.AdminService
	jwtSvc *jwt.Service
}

func NewAdminHandler(svc service.AdminService, jwtSvc *jwt.Service) *AdminHandler {
	return &AdminHandler{
		svc:    svc,
		jwtSvc: jwtSvc,
	}
}

func (h *AdminHandler) RegisterRoutes(router fiber.Router) {
	admin := router.Group("/admin", middleware.Auth(h.jwtSvc), middleware.RequireRole("admin"))
	admin.Get("/users", h.ListUsers)
	admin.Patch("/users/:id/role", h.UpdateUserRole)
	admin.Get("/audits", h.ListAudits)
}

func (h *AdminHandler) ListUsers(c *fiber.Ctx) error {
	resp, err := h.svc.ListUsers(c.UserContext())
	if err != nil {
		return err
	}
	return c.Status(http.StatusOK).JSON(fiber.Map{
		"items": resp,
		"total": len(resp),
	})
}

func (h *AdminHandler) UpdateUserRole(c *fiber.Ctx) error {
	adminID, err := middleware.GetUserID(c)
	if err != nil {
		return err
	}

	targetID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return errors.BadRequest("Invalid user ID")
	}

	var req dto.UpdateRoleRequest
	if err := c.BodyParser(&req); err != nil {
		return errors.BadRequest("Invalid request body")
	}

	resp, err := h.svc.UpdateUserRole(c.UserContext(), int32(targetID), adminID, req.Role, req.Reason)
	if err != nil {
		return err
	}

	return c.Status(http.StatusOK).JSON(resp)
}

func (h *AdminHandler) ListAudits(c *fiber.Ctx) error {
	resp, err := h.svc.ListAudits(c.UserContext())
	if err != nil {
		return err
	}
	return c.Status(http.StatusOK).JSON(fiber.Map{
		"items": resp,
		"total": len(resp),
	})
}
