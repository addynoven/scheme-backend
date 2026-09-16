package service

import (
	"context"
	"fmt"
	"io"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"scheme-backend-go/gen/sqlc"
	"scheme-backend-go/internal/features/vault/dto"
	"scheme-backend-go/internal/features/vault/repository"
	"scheme-backend-go/internal/infrastructure"
	"scheme-backend-go/internal/pkg/errors"
)

type VaultService interface {
	UploadDocument(ctx context.Context, userID int32, docType, filename, mimeType string, maskedNum *string, memberID *int32, file io.Reader, size int64) (*dto.UserDocumentResponse, error)
	ConfirmDirectUpload(ctx context.Context, userID int32, req dto.DirectUploadConfirmRequest) (*dto.UserDocumentResponse, error)
	ListDocuments(ctx context.Context, userID int32) ([]dto.UserDocumentResponse, error)
	GetDocument(ctx context.Context, id, userID int32) (*dto.UserDocumentResponse, error)
	DeleteDocument(ctx context.Context, id, userID int32) error
	VerifyDocument(ctx context.Context, id, userID int32) (*dto.UserDocumentResponse, error)
}

type vaultService struct {
	repo    repository.VaultRepository
	storage infrastructure.StorageService
}

func NewVaultService(repo repository.VaultRepository, storage infrastructure.StorageService) VaultService {
	return &vaultService{
		repo:    repo,
		storage: storage,
	}
}

func (s *vaultService) UploadDocument(
	ctx context.Context,
	userID int32,
	docType, filename, mimeType string,
	maskedNum *string,
	memberID *int32,
	file io.Reader,
	size int64,
) (*dto.UserDocumentResponse, error) {
	// Upload to Cloudinary
	uploaded, err := s.storage.Upload(ctx, file, filename)
	if err != nil {
		return nil, errors.Internal(fmt.Sprintf("Failed to upload document to Cloudinary: %v", err))
	}

	var mID pgtype.Int4
	if memberID != nil {
		mID = pgtype.Int4{Int32: *memberID, Valid: true}
	}
	var masked pgtype.Text
	if maskedNum != nil {
		masked = pgtype.Text{String: *maskedNum, Valid: true}
	}

	doc, err := s.repo.CreateUserDocument(ctx, sqlc.CreateUserDocumentParams{
		UserID:               userID,
		HouseholdMemberID:    mID,
		CitizenUid:           pgtype.Text{Valid: false},
		DocumentType:         docType,
		DocumentNumberMasked: masked,
		FileKey:              uploaded.Key,
		FileName:             filename,
		FileSizeBytes:        int32(size),
		MimeType:             mimeType,
		IsVerified:           false,
	})
	if err != nil {
		// Attempt rollback delete on Cloudinary
		_ = s.storage.Delete(ctx, uploaded.Key)
		return nil, errors.Internal(fmt.Sprintf("Failed to save document metadata: %v", err))
	}

	return s.toResponse(doc), nil
}

func (s *vaultService) ConfirmDirectUpload(ctx context.Context, userID int32, req dto.DirectUploadConfirmRequest) (*dto.UserDocumentResponse, error) {
	var masked pgtype.Text
	if req.DocumentNumberMasked != nil {
		masked = pgtype.Text{String: *req.DocumentNumberMasked, Valid: true}
	}

	doc, err := s.repo.CreateUserDocument(ctx, sqlc.CreateUserDocumentParams{
		UserID:               userID,
		HouseholdMemberID:    pgtype.Int4{Valid: false},
		CitizenUid:           pgtype.Text{Valid: false},
		DocumentType:         req.DocumentType,
		DocumentNumberMasked: masked,
		FileKey:              req.PublicID,
		FileName:             req.FileName,
		FileSizeBytes:        req.FileSizeBytes,
		MimeType:             req.MimeType,
		IsVerified:           false,
	})
	if err != nil {
		return nil, errors.Internal(fmt.Sprintf("Failed to confirm direct upload: %v", err))
	}

	return s.toResponse(doc), nil
}

func (s *vaultService) ListDocuments(ctx context.Context, userID int32) ([]dto.UserDocumentResponse, error) {
	docs, err := s.repo.ListUserDocumentsByUserID(ctx, userID)
	if err != nil {
		return nil, errors.Internal("Failed to list vault documents")
	}

	res := make([]dto.UserDocumentResponse, len(docs))
	for i, d := range docs {
		res[i] = *s.toResponse(d)
	}

	return res, nil
}

func (s *vaultService) GetDocument(ctx context.Context, id, userID int32) (*dto.UserDocumentResponse, error) {
	doc, err := s.repo.GetUserDocumentByID(ctx, id)
	if err != nil || doc.UserID != userID {
		return nil, errors.NotFound("Document not found")
	}
	return s.toResponse(doc), nil
}

func (s *vaultService) DeleteDocument(ctx context.Context, id, userID int32) error {
	doc, err := s.repo.GetUserDocumentByID(ctx, id)
	if err != nil || doc.UserID != userID {
		return errors.NotFound("Document not found")
	}

	// Delete from Cloudinary
	_ = s.storage.Delete(ctx, doc.FileKey)

	// Delete from database
	if err := s.repo.DeleteUserDocument(ctx, id, userID); err != nil {
		return errors.Internal("Failed to delete document record")
	}

	return nil
}

func (s *vaultService) VerifyDocument(ctx context.Context, id, userID int32) (*dto.UserDocumentResponse, error) {
	doc, err := s.repo.GetUserDocumentByID(ctx, id)
	if err != nil || doc.UserID != userID {
		return nil, errors.NotFound("Document not found")
	}

	updated, err := s.repo.VerifyUserDocument(ctx, id)
	if err != nil {
		return nil, errors.Internal("Failed to verify document")
	}

	return s.toResponse(updated), nil
}

func (s *vaultService) toResponse(d sqlc.UserDocument) *dto.UserDocumentResponse {
	var citizenUID *string
	if d.CitizenUid.Valid {
		citizenUID = &d.CitizenUid.String
	}
	var memberID *int32
	if d.HouseholdMemberID.Valid {
		memberID = &d.HouseholdMemberID.Int32
	}
	var maskedNum *string
	if d.DocumentNumberMasked.Valid {
		maskedNum = &d.DocumentNumberMasked.String
	}
	var verifiedAt *time.Time
	if d.VerifiedAt.Valid {
		verifiedAt = &d.VerifiedAt.Time
	}

	url := s.storage.GetURL(d.FileKey)

	return &dto.UserDocumentResponse{
		ID:                   d.ID,
		UserID:               d.UserID,
		CitizenUID:           citizenUID,
		HouseholdMemberID:    memberID,
		DocumentType:         d.DocumentType,
		DocumentNumberMasked: maskedNum,
		FileKey:              d.FileKey,
		FileName:             d.FileName,
		FileSizeBytes:        d.FileSizeBytes,
		MimeType:             d.MimeType,
		FileURL:              url,
		IsVerified:           d.IsVerified,
		UploadedAt:           d.UploadedAt.Time,
		VerifiedAt:           verifiedAt,
	}
}
