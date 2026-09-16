package errors

import (
	"fmt"
	"net/http"

	"github.com/gofiber/fiber/v2"
)

type AppError struct {
	StatusCode int    `json:"status_code"`
	ErrorCode  string `json:"error"`
	Message    string `json:"message"`
	Detail     string `json:"detail"`
}

func (e *AppError) Error() string {
	return fmt.Sprintf("[%s] %s (status: %d)", e.ErrorCode, e.Message, e.StatusCode)
}

func New(statusCode int, errorCode, message string) *AppError {
	return &AppError{
		StatusCode: statusCode,
		ErrorCode:  errorCode,
		Message:    message,
		Detail:     message,
	}
}

func BadRequest(message string) *AppError {
	return New(http.StatusBadRequest, "BAD_REQUEST", message)
}

func NotFound(message string) *AppError {
	return New(http.StatusNotFound, "NOT_FOUND", message)
}

func Unauthorized(message string) *AppError {
	return New(http.StatusUnauthorized, "UNAUTHORIZED", message)
}

func Forbidden(message string) *AppError {
	return New(http.StatusForbidden, "FORBIDDEN", message)
}

func Conflict(message string) *AppError {
	return New(http.StatusConflict, "DUPLICATE_ENTITY", message)
}

func Unprocessable(message string) *AppError {
	return New(http.StatusUnprocessableEntity, "VALIDATION_ERROR", message)
}

func Internal(message string) *AppError {
	return New(http.StatusInternalServerError, "INTERNAL_SERVER_ERROR", message)
}

// FiberErrorHandler handles all errors returned by Fiber handlers
func FiberErrorHandler(c *fiber.Ctx, err error) error {
	if appErr, ok := err.(*AppError); ok {
		return c.Status(appErr.StatusCode).JSON(appErr)
	}

	if fiberErr, ok := err.(*fiber.Error); ok {
		return c.Status(fiberErr.Code).JSON(fiber.Map{
			"error":       "HTTP_ERROR",
			"message":     fiberErr.Message,
			"detail":      fiberErr.Message,
			"status_code": fiberErr.Code,
		})
	}

	return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
		"error":       "INTERNAL_SERVER_ERROR",
		"message":     "An unexpected error occurred. Please try again later.",
		"detail":      err.Error(),
		"status_code": http.StatusInternalServerError,
	})
}
