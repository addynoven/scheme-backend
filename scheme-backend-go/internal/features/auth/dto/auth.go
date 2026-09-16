package dto

import "time"

type RegisterRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Phone    string `json:"phone" validate:"required"`
	Password string `json:"password" validate:"required,min=8"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type GoogleAuthRequest struct {
	Email    string `json:"email" validate:"required,email"`
	FullName string `json:"full_name"`
	IDToken  string `json:"id_token"`
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

type TokenResponse struct {
	AccessToken  string        `json:"access_token"`
	RefreshToken string        `json:"refresh_token"`
	TokenType    string        `json:"token_type"`
	User         *UserResponse `json:"user,omitempty"`
}

type ProfileRequest struct {
	FullName           string  `json:"full_name" validate:"required"`
	DateOfBirth        string  `json:"date_of_birth" validate:"required"` // YYYY-MM-DD
	Gender             string  `json:"gender" validate:"required"`
	State              string  `json:"state" validate:"required"`
	District           string  `json:"district" validate:"required"`
	AnnualIncome       int32   `json:"annual_income"`
	Occupation         string  `json:"occupation" validate:"required"`
	CasteCategory      *string `json:"caste_category"`
	IsDifferentlyAbled *bool   `json:"is_differently_abled"`
	MaritalStatus      *string `json:"marital_status"`
	ResidenceArea      *string `json:"residence_area"`
	HasLand            *bool   `json:"has_land"`
}

type ProfileResponse struct {
	ID                 int32     `json:"id"`
	UserID             int32     `json:"user_id"`
	FullName           string    `json:"full_name"`
	DateOfBirth        string    `json:"date_of_birth"`
	Gender             string    `json:"gender"`
	State              string    `json:"state"`
	District           string    `json:"district"`
	AnnualIncome       int32     `json:"annual_income"`
	Occupation         string    `json:"occupation"`
	CasteCategory      *string   `json:"caste_category"`
	IsDifferentlyAbled *bool     `json:"is_differently_abled"`
	MaritalStatus      *string   `json:"marital_status"`
	ResidenceArea      *string   `json:"residence_area"`
	HasLand            *bool     `json:"has_land"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

type UserResponse struct {
	ID           int32            `json:"id"`
	CitizenUID   *string          `json:"citizen_uid"`
	HouseholdUID *string          `json:"household_uid"`
	Email        string           `json:"email"`
	Phone        string           `json:"phone"`
	PhoneNumber  string           `json:"phone_number"`
	Role         string           `json:"role"`
	IsVerified   bool             `json:"is_verified"`
	CreatedAt    time.Time        `json:"created_at"`
	UpdatedAt    time.Time        `json:"updated_at"`
	Profile      *ProfileResponse `json:"profile,omitempty"`
}
