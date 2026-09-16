package vault_test

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"

	"scheme-backend-go/gen/sqlc"
	"scheme-backend-go/internal/config"
	delivery "scheme-backend-go/internal/features/vault/delivery/http"
	"scheme-backend-go/internal/features/vault/dto"
	"scheme-backend-go/internal/features/vault/service"
	"scheme-backend-go/internal/infrastructure"
	"scheme-backend-go/internal/pkg/errors"
	"scheme-backend-go/internal/pkg/jwt"
)

type MockVaultRepo struct {
	mock.Mock
}

func (m *MockVaultRepo) CreateUserDocument(ctx context.Context, arg sqlc.CreateUserDocumentParams) (sqlc.UserDocument, error) {
	args := m.Called(ctx, arg)
	return args.Get(0).(sqlc.UserDocument), args.Error(1)
}

func (m *MockVaultRepo) GetUserDocumentByID(ctx context.Context, id int32) (sqlc.UserDocument, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(sqlc.UserDocument), args.Error(1)
}

func (m *MockVaultRepo) ListUserDocumentsByUserID(ctx context.Context, userID int32) ([]sqlc.UserDocument, error) {
	args := m.Called(ctx, userID)
	return args.Get(0).([]sqlc.UserDocument), args.Error(1)
}

func (m *MockVaultRepo) DeleteUserDocument(ctx context.Context, id, userID int32) error {
	args := m.Called(ctx, id, userID)
	return args.Error(0)
}

func (m *MockVaultRepo) VerifyUserDocument(ctx context.Context, id int32) (sqlc.UserDocument, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(sqlc.UserDocument), args.Error(1)
}

type MockCloudinaryStorage struct {
	mock.Mock
}

func (m *MockCloudinaryStorage) Upload(ctx context.Context, file io.Reader, filename string) (*infrastructure.UploadedFile, error) {
	args := m.Called(ctx, file, filename)
	return args.Get(0).(*infrastructure.UploadedFile), args.Error(1)
}

func (m *MockCloudinaryStorage) Delete(ctx context.Context, fileKey string) error {
	args := m.Called(ctx, fileKey)
	return args.Error(0)
}

func (m *MockCloudinaryStorage) GetURL(fileKey string) string {
	args := m.Called(fileKey)
	return args.String(0)
}

func TestVault_UploadAndList_Flow(t *testing.T) {
	repo := new(MockVaultRepo)
	storage := new(MockCloudinaryStorage)

	jwtSvc := jwt.NewService(&config.Config{
		JWT: config.JWTConfig{
			Secret:               "test-secret-key-32-bytes-long!",
			AccessTokenDuration:  15 * time.Minute,
			RefreshTokenDuration: 24 * time.Hour,
		},
	})

	svc := service.NewVaultService(repo, storage)
	handler := delivery.NewVaultHandler(svc, jwtSvc)

	app := fiber.New(fiber.Config{
		ErrorHandler: errors.FiberErrorHandler,
	})
	handler.RegisterRoutes(app)

	// Create auth token
	tokens, _ := jwtSvc.GenerateTokenPair(10, "citizen@example.com", "citizen")

	// 1. Test Upload to Cloudinary
	storage.On("Upload", mock.Anything, mock.Anything, "aadhaar.pdf").Return(&infrastructure.UploadedFile{
		Key:       "vault/aadhaar_sample_key",
		URL:       "http://res.cloudinary.com/demo/image/upload/v1/vault/aadhaar_sample_key",
		SecureURL: "https://res.cloudinary.com/demo/image/upload/v1/vault/aadhaar_sample_key",
		Bytes:     1024,
		Format:    "pdf",
	}, nil).Once()

	storage.On("GetURL", "vault/aadhaar_sample_key").Return("https://res.cloudinary.com/demo/image/upload/v1/vault/aadhaar_sample_key")

	docRecord := sqlc.UserDocument{
		ID:                   1,
		UserID:               10,
		DocumentType:         "Aadhaar Card",
		DocumentNumberMasked: pgtype.Text{String: "XXXX-XXXX-1234", Valid: true},
		FileKey:              "vault/aadhaar_sample_key",
		FileName:             "aadhaar.pdf",
		FileSizeBytes:        1024,
		MimeType:             "application/pdf",
		IsVerified:           false,
		UploadedAt:           pgtype.Timestamptz{Time: time.Now(), Valid: true},
	}
	repo.On("CreateUserDocument", mock.Anything, mock.Anything).Return(docRecord, nil).Once()

	// Prepare multipart form body
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	_ = writer.WriteField("document_type", "Aadhaar Card")
	_ = writer.WriteField("document_number_masked", "XXXX-XXXX-1234")
	part, _ := writer.CreateFormFile("file", "aadhaar.pdf")
	_, _ = part.Write([]byte("%PDF-1.4 dummy pdf content"))
	_ = writer.Close()

	req := httptest.NewRequest(http.MethodPost, "/vault/documents/upload", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.Header.Set("Authorization", "Bearer "+tokens.AccessToken)

	resp, err := app.Test(req, -1)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusCreated, resp.StatusCode)

	var docResp dto.UserDocumentResponse
	_ = json.NewDecoder(resp.Body).Decode(&docResp)
	assert.Equal(t, int32(1), docResp.ID)
	assert.Equal(t, "Aadhaar Card", docResp.DocumentType)
	assert.Equal(t, "https://res.cloudinary.com/demo/image/upload/v1/vault/aadhaar_sample_key", docResp.FileURL)

	// 2. Test List Documents
	repo.On("ListUserDocumentsByUserID", mock.Anything, int32(10)).Return([]sqlc.UserDocument{docRecord}, nil).Once()

	req2 := httptest.NewRequest(http.MethodGet, "/vault/documents", nil)
	req2.Header.Set("Authorization", "Bearer "+tokens.AccessToken)

	resp2, err := app.Test(req2, -1)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp2.StatusCode)

	var listResp []dto.UserDocumentResponse
	_ = json.NewDecoder(resp2.Body).Decode(&listResp)
	assert.Len(t, listResp, 1)
	assert.Equal(t, "vault/aadhaar_sample_key", listResp[0].FileKey)
}
