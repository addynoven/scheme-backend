package infrastructure

import (
	"context"
	"io"
)

type UploadedFile struct {
	Key       string `json:"key"`
	URL       string `json:"url"`
	SecureURL string `json:"secure_url"`
	Bytes     int    `json:"bytes"`
	Format    string `json:"format"`
}

type StorageService interface {
	Upload(ctx context.Context, file io.Reader, filename string) (*UploadedFile, error)
	Delete(ctx context.Context, fileKey string) error
	GetURL(fileKey string) string
}
