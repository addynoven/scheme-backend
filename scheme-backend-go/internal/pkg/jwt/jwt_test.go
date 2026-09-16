package jwt_test

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"scheme-backend-go/internal/config"
	"scheme-backend-go/internal/pkg/jwt"
)

func TestJWT_GenerateAndValidateToken(t *testing.T) {
	cfg := &config.Config{
		JWT: config.JWTConfig{
			Secret:               "test-secret-key-1234567890",
			AccessTokenDuration:  15 * time.Minute,
			RefreshTokenDuration: 24 * time.Hour,
		},
	}

	svc := jwt.NewService(cfg)

	// 1. Generate tokens
	tokens, err := svc.GenerateTokenPair(42, "citizen@example.com", "citizen")
	assert.NoError(t, err)
	assert.NotEmpty(t, tokens.AccessToken)
	assert.NotEmpty(t, tokens.RefreshToken)
	assert.Equal(t, "Bearer", tokens.TokenType)
	assert.NotEmpty(t, tokens.FamilyID)

	// 2. Validate Access Token
	claims, err := svc.ValidateToken(tokens.AccessToken)
	assert.NoError(t, err)
	assert.Equal(t, int32(42), claims.UserID)
	assert.Equal(t, "citizen@example.com", claims.Email)
	assert.Equal(t, "citizen", claims.Role)
	assert.Equal(t, "access", claims.Type)

	// 3. Validate Refresh Token
	refreshClaims, err := svc.ValidateToken(tokens.RefreshToken)
	assert.NoError(t, err)
	assert.Equal(t, int32(42), refreshClaims.UserID)
	assert.Equal(t, "refresh", refreshClaims.Type)

	// 4. Validate with tampered token
	_, err = svc.ValidateToken(tokens.AccessToken + "tampered")
	assert.Error(t, err)
}
