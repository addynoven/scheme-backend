package dto

import "time"

type UserDocumentResponse struct {
	ID                   int32      `json:"id"`
	UserID               int32      `json:"user_id"`
	CitizenUID           *string    `json:"citizen_uid,omitempty"`
	HouseholdMemberID    *int32     `json:"household_member_id,omitempty"`
	DocumentType         string     `json:"document_type"`
	DocumentNumberMasked *string    `json:"document_number_masked,omitempty"`
	FileKey              string     `json:"file_key"`
	FileName             string     `json:"file_name"`
	FileSizeBytes        int32      `json:"file_size_bytes"`
	MimeType             string     `json:"mime_type"`
	FileURL              string     `json:"file_url"`
	IsVerified           bool       `json:"is_verified"`
	UploadedAt           time.Time  `json:"uploaded_at"`
	VerifiedAt           *time.Time `json:"verified_at,omitempty"`
}

type DirectUploadParamsResponse struct {
	UploadURL string `json:"upload_url"`
	CloudName string `json:"cloud_name"`
	APIKey    string `json:"api_key"`
	Timestamp int64  `json:"timestamp"`
	Signature string `json:"signature"`
	PublicID  string `json:"public_id"`
	Folder    string `json:"folder"`
}

type DirectUploadConfirmRequest struct {
	DocumentType         string  `json:"document_type" validate:"required"`
	FileName             string  `json:"file_name" validate:"required"`
	PublicID             string  `json:"public_id" validate:"required"`
	URL                  string  `json:"url" validate:"required"`
	FileSizeBytes        int32   `json:"file_size_bytes"`
	MimeType             string  `json:"mime_type"`
	DocumentNumberMasked *string `json:"document_number_masked"`
}
