package http

import (
	"net/http"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"scheme-backend-go/internal/features/schemes/service"
	"scheme-backend-go/internal/pkg/errors"
)

type SchemesHandler struct {
	svc service.SchemesService
}

func NewSchemesHandler(svc service.SchemesService) *SchemesHandler {
	return &SchemesHandler{svc: svc}
}

func (h *SchemesHandler) RegisterRoutes(router fiber.Router) {
	schemes := router.Group("/schemes")
	schemes.Get("", h.ListSchemes)
	schemes.Get("/categories", h.ListCategories)
	schemes.Get("/states", h.ListStates)
	schemes.Get("/slug/:slug", h.GetBySlug)
	schemes.Get("/:id", h.GetByID)
}

func (h *SchemesHandler) ListSchemes(c *fiber.Ctx) error {
	skip := c.QueryInt("skip", 0)
	limit := c.QueryInt("limit", 20)
	category := c.Query("category", "")
	state := c.Query("state", "")
	search := c.Query("search", "")
	if search == "" {
		search = c.Query("q", "")
	}

	resp, err := h.svc.ListSchemes(c.UserContext(), skip, limit, category, state, search)
	if err != nil {
		return err
	}

	return c.Status(http.StatusOK).JSON(resp)
}

func (h *SchemesHandler) ListCategories(c *fiber.Ctx) error {
	resp, err := h.svc.ListCategories(c.UserContext())
	if err != nil {
		return err
	}
	return c.Status(http.StatusOK).JSON(resp)
}

func (h *SchemesHandler) ListStates(c *fiber.Ctx) error {
	resp, err := h.svc.ListStates(c.UserContext())
	if err != nil {
		return err
	}
	return c.Status(http.StatusOK).JSON(fiber.Map{"states": resp})
}

func (h *SchemesHandler) GetBySlug(c *fiber.Ctx) error {
	slug := c.Params("slug")
	if slug == "" {
		return errors.BadRequest("Slug parameter is required")
	}

	resp, err := h.svc.GetSchemeBySlug(c.UserContext(), slug)
	if err != nil {
		return err
	}

	return c.Status(http.StatusOK).JSON(resp)
}

func (h *SchemesHandler) GetByID(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		return errors.BadRequest("Invalid scheme ID")
	}

	resp, err := h.svc.GetSchemeByID(c.UserContext(), int32(id))
	if err != nil {
		return err
	}

	return c.Status(http.StatusOK).JSON(resp)
}
