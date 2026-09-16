package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"scheme-backend-go/internal/pkg/errors"
	"scheme-backend-go/internal/pkg/jwt"
)

func Auth(jwtSvc *jwt.Service) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return errors.Unauthorized("Missing Authorization header")
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "bearer") {
			return errors.Unauthorized("Invalid Authorization header format")
		}

		claims, err := jwtSvc.ValidateToken(parts[1])
		if err != nil {
			return errors.Unauthorized("Invalid or expired token")
		}

		if claims.Type != "access" {
			return errors.Unauthorized("Token is not an access token")
		}

		c.Locals("user_id", claims.UserID)
		c.Locals("role", claims.Role)
		c.Locals("email", claims.Email)

		return c.Next()
	}
}

func OptionalAuth(jwtSvc *jwt.Service) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader != "" {
			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) == 2 && strings.EqualFold(parts[0], "bearer") {
				if claims, err := jwtSvc.ValidateToken(parts[1]); err == nil && claims.Type == "access" {
					c.Locals("user_id", claims.UserID)
					c.Locals("role", claims.Role)
					c.Locals("email", claims.Email)
				}
			}
		}
		return c.Next()
	}
}

func RequireRole(roles ...string) fiber.Handler {
	allowedRoles := make(map[string]bool)
	for _, r := range roles {
		allowedRoles[r] = true
	}

	return func(c *fiber.Ctx) error {
		roleVal := c.Locals("role")
		roleStr, ok := roleVal.(string)
		if !ok || !allowedRoles[roleStr] {
			return errors.Forbidden("Access forbidden: insufficient permissions")
		}
		return c.Next()
	}
}

func GetUserID(c *fiber.Ctx) (int32, error) {
	val := c.Locals("user_id")
	if id, ok := val.(int32); ok {
		return id, nil
	}
	return 0, errors.Unauthorized("User not authenticated")
}
