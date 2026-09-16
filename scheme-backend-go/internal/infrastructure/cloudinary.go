package infrastructure

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"strings"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
	"scheme-backend-go/internal/config"
)

type CloudinaryStorage struct {
	cld    *cloudinary.Cloudinary
	folder string
}

func NewCloudinaryStorage(cfg *config.Config) (*CloudinaryStorage, error) {
	if cfg.Cloudinary.CloudName == "" || cfg.Cloudinary.APIKey == "" || cfg.Cloudinary.APISecret == "" {
		slog.Warn("Cloudinary credentials not fully configured, storage operations may fail")
	}

	cld, err := cloudinary.NewFromParams(
		cfg.Cloudinary.CloudName,
		cfg.Cloudinary.APIKey,
		cfg.Cloudinary.APISecret,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize Cloudinary client: %w", err)
	}

	folder := cfg.Cloudinary.Folder
	if folder == "" {
		folder = "scheme_vault"
	}

	slog.Info("Cloudinary storage service initialized", "folder", folder)
	return &CloudinaryStorage{
		cld:    cld,
		folder: folder,
	}, nil
}

func (s *CloudinaryStorage) Upload(ctx context.Context, file io.Reader, filename string) (*UploadedFile, error) {
	uploadParams := uploader.UploadParams{
		Folder:         s.folder,
		ResourceType:   "auto",
		UseFilename:    func(b bool) *bool { return &b }(true),
		UniqueFilename: func(b bool) *bool { return &b }(true),
	}

	res, err := s.cld.Upload.Upload(ctx, file, uploadParams)
	if err != nil {
		return nil, fmt.Errorf("cloudinary upload failed: %w", err)
	}

	return &UploadedFile{
		Key:       res.PublicID,
		URL:       res.URL,
		SecureURL: res.SecureURL,
		Bytes:     res.Bytes,
		Format:    res.Format,
	}, nil
}

func (s *CloudinaryStorage) Delete(ctx context.Context, fileKey string) error {
	// fileKey is the public_id in Cloudinary
	destroyParams := uploader.DestroyParams{
		ResourceType: "image",
	}

	// Try image first, if not found or auto
	res, err := s.cld.Upload.Destroy(ctx, destroyParams)
	if err != nil || (res != nil && res.Result != "ok") {
		// Try raw resource type (e.g. for PDFs or documents)
		destroyParams.ResourceType = "raw"
		resRaw, errRaw := s.cld.Upload.Destroy(ctx, destroyParams)
		if errRaw != nil || (resRaw != nil && resRaw.Result != "ok") {
			slog.Warn("Failed to delete from Cloudinary or resource not found", "key", fileKey, "err", err)
		}
	}

	return nil
}

func (s *CloudinaryStorage) GetURL(fileKey string) string {
	if strings.HasPrefix(fileKey, "http://") || strings.HasPrefix(fileKey, "https://") {
		return fileKey
	}
	// Generate public delivery URL from cloudinary
	asset, err := s.cld.Image(fileKey)
	if err != nil {
		return fileKey
	}
	url, err := asset.String()
	if err != nil {
		return fileKey
	}
	return url
}
