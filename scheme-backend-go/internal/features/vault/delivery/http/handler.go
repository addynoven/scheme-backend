package http

import (
	"net/http"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"scheme-backend-go/internal/features/vault/dto"
	"scheme-backend-go/internal/features/vault/service"
	"scheme-backend-go/internal/pkg/errors"
	"scheme-backend-go/internal/pkg/jwt"
	"scheme-backend-go/internal/pkg/middleware"
)

type VaultHandler struct {
	svc    service.VaultService
	jwtSvc *jwt.Service
}

func NewVaultHandler(svc service.VaultService, jwtSvc *jwt.Service) *VaultHandler {
	return &VaultHandler{
		svc:    svc,
		jwtSvc: jwtSvc,
	}
}

func (h *VaultHandler) RegisterRoutes(router fiber.Router) {
	vault := router.Group("/vault", middleware.Auth(h.jwtSvc))
	vault.Post("/documents/upload", h.Upload)
	vault.Post("/documents/direct-upload-confirm", h.DirectUploadConfirm)
	vault.Get("/documents", h.ListDocuments)
	vault.Get("/documents/:id", h.GetDocument)
	vault.Get("/documents/:id/download", h.DownloadDocument)
	vault.Delete("/documents/:id", h.DeleteDocument)
}

func (h *VaultHandler) Upload(c *fiber.Ctx) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return err
	}

	docType := c.FormValue("document_type")
	if docType == "" {
		return errors.BadRequest("document_type is required")
	}

	var maskedNum *string
	if masked := c.FormValue("document_number_masked"); masked != "" {
		maskedNum = &masked
	}

	var memberID *int32
	if mStr := c.FormValue("household_member_id"); mStr != "" {
		if m, err := strconv.Atoi(mStr); err == nil {
			id32 := int32(m)
			memberID = &id32
		}
	}

	fileHeader, err := c.FormFile("file")
	if err != nil {
		return errors.BadRequest("File binary is required in 'file' form field")
	}

	file, err := fileHeader.Open()
	if err != nil {
		return errors.Internal("Failed to read uploaded file")
	}
	defer file.Close()

	mimeType := fileHeader.Header.Get("Content-Type")
	if mimeType == "" {
		mimeType = "application/octet-stream"
	}

	resp, err := h.svc.UploadDocument(
		c.UserContext(),
		userID,
		docType,
		fileHeader.Filename,
		mimeType,
		maskedNum,
		memberID,
		file,
		fileHeader.Size,
	)
	if err != nil {
		return err
	}

	return c.Status(http.StatusCreated).JSON(resp)
}

func (h *VaultHandler) DirectUploadConfirm(c *fiber.Ctx) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return err
	}

	var req dto.DirectUploadConfirmRequest
	if err := c.BodyParser(&req); err != nil {
		return errors.BadRequest("Invalid request body")
	}

	resp, err := h.svc.ConfirmDirectUpload(c.UserContext(), userID, req)
	if err != nil {
		return err
	}

	return c.Status(http.StatusCreated).JSON(resp)
}

func (h *VaultHandler) ListDocuments(c *fiber.Ctx) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return err
	}

	resp, err := h.svc.ListDocuments(c.UserContext(), userID)
	if err != nil {
		return err
	}

	return c.Status(http.StatusOK).JSON(resp)
}

func (h *VaultHandler) GetDocument(c *fiber.Ctx) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return err
	}

	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return errors.BadRequest("Invalid document ID")
	}

	resp, err := h.svc.GetDocument(c.UserContext(), int32(id), userID)
	if err != nil {
		return err
	}

	return c.Status(http.StatusOK).JSON(resp)
}

func (h *VaultHandler) DownloadDocument(c *fiber.Ctx) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return err
	}

	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return errors.BadRequest("Invalid document ID")
	}

	doc, err := h.svc.GetDocument(c.UserContext(), int32(id), userID)
	if err != nil {
		return err
	}

	return c.Redirect(doc.FileURL, http.StatusTemporaryRedirect)
}

func (h *VaultHandler) DeleteDocument(c *fiber.Ctx) error {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		return err
	}

	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return errors.BadRequest("Invalid document ID")
	}

	if err := h.svc.DeleteDocument(c.UserContext(), int32(id), userID); err != nil {
		return err
	}

	return c.SendStatus(http.StatusNoContent)
}
