package service

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"scheme-backend-go/gen/sqlc"
	"scheme-backend-go/internal/features/auth/dto"
	"scheme-backend-go/internal/features/auth/repository"
	"scheme-backend-go/internal/pkg/errors"
	"scheme-backend-go/internal/pkg/jwt"
	"scheme-backend-go/internal/pkg/password"
)

type AuthService interface {
	Register(ctx context.Context, req dto.RegisterRequest) (*dto.UserResponse, error)
	Login(ctx context.Context, req dto.LoginRequest) (*dto.TokenResponse, error)
	GoogleAuth(ctx context.Context, req dto.GoogleAuthRequest) (*dto.TokenResponse, error)
	RefreshToken(ctx context.Context, req dto.RefreshTokenRequest) (*dto.TokenResponse, error)
	GetMe(ctx context.Context, userID int32) (*dto.UserResponse, error)
	GetProfile(ctx context.Context, userID int32) (*dto.ProfileResponse, error)
	CreateOrUpdateProfile(ctx context.Context, userID int32, req dto.ProfileRequest) (*dto.ProfileResponse, error)
}

type authService struct {
	repo   repository.AuthRepository
	jwtSvc *jwt.Service
}

func NewAuthService(repo repository.AuthRepository, jwtSvc *jwt.Service) AuthService {
	return &authService{
		repo:   repo,
		jwtSvc: jwtSvc,
	}
}

func (s *authService) Register(ctx context.Context, req dto.RegisterRequest) (*dto.UserResponse, error) {
	// Check email uniqueness
	if _, err := s.repo.GetUserByEmail(ctx, req.Email); err == nil {
		return nil, errors.Conflict("Email is already registered")
	}

	// Check phone uniqueness
	if _, err := s.repo.GetUserByPhone(ctx, req.Phone); err == nil {
		return nil, errors.Conflict("Phone number is already registered")
	}

	hashedPassword, err := password.Hash(req.Password)
	if err != nil {
		return nil, errors.Internal("Failed to hash password")
	}

	citizenUID := "CIT-" + randomAlphanumeric(8)
	householdUID := "HH-" + randomAlphanumeric(8)

	user, err := s.repo.CreateUser(ctx, sqlc.CreateUserParams{
		CitizenUid:     pgtype.Text{String: citizenUID, Valid: true},
		HouseholdUid:   pgtype.Text{String: householdUID, Valid: true},
		Email:          req.Email,
		Phone:          req.Phone,
		HashedPassword: hashedPassword,
		Role:           "citizen",
		IsVerified:     false,
	})
	if err != nil {
		return nil, errors.Internal(fmt.Sprintf("Failed to create user: %v", err))
	}

	return toUserResponse(user, nil), nil
}

func (s *authService) Login(ctx context.Context, req dto.LoginRequest) (*dto.TokenResponse, error) {
	user, err := s.repo.GetUserByEmail(ctx, req.Email)
	if err != nil {
		return nil, errors.Unauthorized("Invalid email or password")
	}

	if !password.Verify(req.Password, user.HashedPassword) {
		return nil, errors.Unauthorized("Invalid email or password")
	}

	return s.createSessionTokens(ctx, user)
}

func (s *authService) GoogleAuth(ctx context.Context, req dto.GoogleAuthRequest) (*dto.TokenResponse, error) {
	user, err := s.repo.GetUserByEmail(ctx, req.Email)
	if err != nil {
		// Create new user
		randPass := randomAlphanumeric(16)
		hashedPassword, _ := password.Hash(randPass)
		citizenUID := "CIT-" + randomAlphanumeric(8)
		householdUID := "HH-" + randomAlphanumeric(8)
		phone := "+91" + randomDigits(10)

		createdUser, err := s.repo.CreateUser(ctx, sqlc.CreateUserParams{
			CitizenUid:     pgtype.Text{String: citizenUID, Valid: true},
			HouseholdUid:   pgtype.Text{String: householdUID, Valid: true},
			Email:          req.Email,
			Phone:          phone,
			HashedPassword: hashedPassword,
			Role:           "citizen",
			IsVerified:     true,
		})
		if err != nil {
			return nil, errors.Internal(fmt.Sprintf("Failed to create user for google auth: %v", err))
		}
		user = createdUser

		// Create default profile if full name provided
		if req.FullName != "" {
			dob, _ := time.Parse("2006-01-02", "1995-01-01")
			_, _ = s.repo.CreateProfile(ctx, sqlc.CreateProfileParams{
				UserID:       user.ID,
				FullName:     req.FullName,
				DateOfBirth:  pgtype.Date{Time: dob, Valid: true},
				Gender:       "other",
				State:        "Maharashtra",
				District:     "Mumbai",
				AnnualIncome: 0,
				Occupation:   "other",
			})
		}
	}

	return s.createSessionTokens(ctx, user)
}

func (s *authService) RefreshToken(ctx context.Context, req dto.RefreshTokenRequest) (*dto.TokenResponse, error) {
	claims, err := s.jwtSvc.ValidateToken(req.RefreshToken)
	if err != nil || claims.Type != "refresh" {
		return nil, errors.Unauthorized("Invalid refresh token")
	}

	hash := hashToken(req.RefreshToken)
	tokenRecord, err := s.repo.GetRefreshTokenByHash(ctx, hash)
	if err != nil {
		return nil, errors.Unauthorized("Refresh token not found or already used")
	}

	if tokenRecord.IsRevoked {
		// Potential reuse attack: revoke entire family!
		_ = s.repo.RevokeRefreshTokenFamily(ctx, tokenRecord.FamilyID)
		return nil, errors.Unauthorized("Refresh token has been revoked")
	}

	if time.Now().After(tokenRecord.ExpiresAt.Time) {
		return nil, errors.Unauthorized("Refresh token has expired")
	}

	// Revoke current token
	_ = s.repo.RevokeRefreshToken(ctx, tokenRecord.ID)

	// Fetch user
	user, err := s.repo.GetUserByID(ctx, tokenRecord.UserID)
	if err != nil {
		return nil, errors.Unauthorized("User not found")
	}

	return s.createSessionTokens(ctx, user)
}

func (s *authService) GetMe(ctx context.Context, userID int32) (*dto.UserResponse, error) {
	user, err := s.repo.GetUserByID(ctx, userID)
	if err != nil {
		return nil, errors.NotFound("User not found")
	}

	var profileResp *dto.ProfileResponse
	if profile, err := s.repo.GetProfileByUserID(ctx, userID); err == nil {
		profileResp = toProfileResponse(profile)
	}

	return toUserResponse(user, profileResp), nil
}

func (s *authService) GetProfile(ctx context.Context, userID int32) (*dto.ProfileResponse, error) {
	profile, err := s.repo.GetProfileByUserID(ctx, userID)
	if err != nil {
		return nil, errors.NotFound("Profile not found")
	}
	return toProfileResponse(profile), nil
}

func (s *authService) CreateOrUpdateProfile(ctx context.Context, userID int32, req dto.ProfileRequest) (*dto.ProfileResponse, error) {
	dob, err := time.Parse("2006-01-02", req.DateOfBirth)
	if err != nil {
		return nil, errors.BadRequest("Invalid date_of_birth format. Use YYYY-MM-DD")
	}

	existing, err := s.repo.GetProfileByUserID(ctx, userID)
	if err != nil {
		// Create new profile
		p, err := s.repo.CreateProfile(ctx, sqlc.CreateProfileParams{
			UserID:             userID,
			FullName:           req.FullName,
			DateOfBirth:        pgtype.Date{Time: dob, Valid: true},
			Gender:             req.Gender,
			State:              req.State,
			District:           req.District,
			AnnualIncome:       req.AnnualIncome,
			Occupation:         req.Occupation,
			CasteCategory:      toPgText(req.CasteCategory),
			IsDifferentlyAbled: toPgBool(req.IsDifferentlyAbled),
			MaritalStatus:      toPgText(req.MaritalStatus),
			ResidenceArea:      toPgText(req.ResidenceArea),
			HasLand:            toPgBool(req.HasLand),
		})
		if err != nil {
			return nil, errors.Internal(fmt.Sprintf("Failed to create profile: %v", err))
		}
		return toProfileResponse(p), nil
	}

	// Update existing profile
	p, err := s.repo.UpdateProfile(ctx, sqlc.UpdateProfileParams{
		UserID:             userID,
		FullName:           req.FullName,
		DateOfBirth:        pgtype.Date{Time: dob, Valid: true},
		Gender:             req.Gender,
		State:              req.State,
		District:           req.District,
		AnnualIncome:       req.AnnualIncome,
		Occupation:         req.Occupation,
		CasteCategory:      toPgText(req.CasteCategory),
		IsDifferentlyAbled: toPgBool(req.IsDifferentlyAbled),
		MaritalStatus:      toPgText(req.MaritalStatus),
		ResidenceArea:      toPgText(req.ResidenceArea),
		HasLand:            toPgBool(req.HasLand),
	})
	if err != nil {
		return nil, errors.Internal(fmt.Sprintf("Failed to update profile: %v", err))
	}

	_ = existing
	return toProfileResponse(p), nil
}

func (s *authService) createSessionTokens(ctx context.Context, user sqlc.User) (*dto.TokenResponse, error) {
	tokens, err := s.jwtSvc.GenerateTokenPair(user.ID, user.Email, user.Role)
	if err != nil {
		return nil, errors.Internal("Failed to generate authentication tokens")
	}

	// Store refresh token hash
	refreshHash := hashToken(tokens.RefreshToken)
	_, err = s.repo.CreateRefreshToken(ctx, sqlc.CreateRefreshTokenParams{
		UserID:    user.ID,
		TokenHash: refreshHash,
		FamilyID:  tokens.FamilyID,
		IsRevoked: false,
		ExpiresAt: pgtype.Timestamptz{Time: time.Now().Add(30 * 24 * time.Hour), Valid: true},
	})
	if err != nil {
		return nil, errors.Internal("Failed to persist session token")
	}

	var profileResp *dto.ProfileResponse
	if profile, err := s.repo.GetProfileByUserID(ctx, user.ID); err == nil {
		profileResp = toProfileResponse(profile)
	}

	return &dto.TokenResponse{
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
		TokenType:    "bearer",
		User:         toUserResponse(user, profileResp),
	}, nil
}

func toUserResponse(u sqlc.User, p *dto.ProfileResponse) *dto.UserResponse {
	var citizenUID *string
	if u.CitizenUid.Valid {
		citizenUID = &u.CitizenUid.String
	}
	var householdUID *string
	if u.HouseholdUid.Valid {
		householdUID = &u.HouseholdUid.String
	}

	return &dto.UserResponse{
		ID:           u.ID,
		CitizenUID:   citizenUID,
		HouseholdUID: householdUID,
		Email:        u.Email,
		Phone:        u.Phone,
		PhoneNumber:  u.Phone,
		Role:         u.Role,
		IsVerified:   u.IsVerified,
		CreatedAt:    u.CreatedAt.Time,
		UpdatedAt:    u.UpdatedAt.Time,
		Profile:      p,
	}
}

func toProfileResponse(p sqlc.Profile) *dto.ProfileResponse {
	var caste *string
	if p.CasteCategory.Valid {
		caste = &p.CasteCategory.String
	}
	var marital *string
	if p.MaritalStatus.Valid {
		marital = &p.MaritalStatus.String
	}
	var residence *string
	if p.ResidenceArea.Valid {
		residence = &p.ResidenceArea.String
	}
	var diffAbled *bool
	if p.IsDifferentlyAbled.Valid {
		diffAbled = &p.IsDifferentlyAbled.Bool
	}
	var land *bool
	if p.HasLand.Valid {
		land = &p.HasLand.Bool
	}

	return &dto.ProfileResponse{
		ID:                 p.ID,
		UserID:             p.UserID,
		FullName:           p.FullName,
		DateOfBirth:        p.DateOfBirth.Time.Format("2006-01-02"),
		Gender:             p.Gender,
		State:              p.State,
		District:           p.District,
		AnnualIncome:       p.AnnualIncome,
		Occupation:         p.Occupation,
		CasteCategory:      caste,
		IsDifferentlyAbled: diffAbled,
		MaritalStatus:      marital,
		ResidenceArea:      residence,
		HasLand:            land,
		CreatedAt:          p.CreatedAt.Time,
		UpdatedAt:          p.UpdatedAt.Time,
	}
}

func toPgText(s *string) pgtype.Text {
	if s == nil {
		return pgtype.Text{Valid: false}
	}
	return pgtype.Text{String: *s, Valid: true}
}

func toPgBool(b *bool) pgtype.Bool {
	if b == nil {
		return pgtype.Bool{Valid: false}
	}
	return pgtype.Bool{Bool: *b, Valid: true}
}

func hashToken(token string) string {
	h := sha256.Sum256([]byte(token))
	return hex.EncodeToString(h[:])
}

func randomAlphanumeric(n int) string {
	const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	bytes := make([]byte, n)
	_, _ = rand.Read(bytes)
	for i := range bytes {
		bytes[i] = charset[int(bytes[i])%len(charset)]
	}
	return string(bytes)
}

func randomDigits(n int) string {
	const charset = "0123456789"
	bytes := make([]byte, n)
	_, _ = rand.Read(bytes)
	for i := range bytes {
		bytes[i] = charset[int(bytes[i])%len(charset)]
	}
	return string(bytes)
}
