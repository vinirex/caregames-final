package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// APIResponse is the standard response envelope for all API calls.
type APIResponse struct {
	Success    bool        `json:"success"`
	Data       interface{} `json:"data,omitempty"`
	Message    string      `json:"message,omitempty"`
	Error      *APIError   `json:"error,omitempty"`
	Pagination *Pagination `json:"pagination,omitempty"`
}

// APIError holds structured error information.
type APIError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// Pagination holds paging metadata.
type Pagination struct {
	Page       int   `json:"page"`
	Limit      int   `json:"limit"`
	Total      int64 `json:"total"`
	TotalPages int   `json:"total_pages"`
}

// OK sends a 200 success response.
func OK(c *gin.Context, data interface{}, message string) {
	c.JSON(http.StatusOK, APIResponse{
		Success: true,
		Data:    data,
		Message: message,
	})
}

// Created sends a 201 created response.
func Created(c *gin.Context, data interface{}, message string) {
	c.JSON(http.StatusCreated, APIResponse{
		Success: true,
		Data:    data,
		Message: message,
	})
}

// OKPaginated sends a 200 response with pagination metadata.
func OKPaginated(c *gin.Context, data interface{}, p Pagination) {
	c.JSON(http.StatusOK, APIResponse{
		Success:    true,
		Data:       data,
		Pagination: &p,
	})
}

// BadRequest sends a 400 error response.
func BadRequest(c *gin.Context, code, message string) {
	c.JSON(http.StatusBadRequest, APIResponse{
		Success: false,
		Error:   &APIError{Code: code, Message: message},
	})
}

// Unauthorized sends a 401 error response.
func Unauthorized(c *gin.Context, message string) {
	c.JSON(http.StatusUnauthorized, APIResponse{
		Success: false,
		Error:   &APIError{Code: "UNAUTHORIZED", Message: message},
	})
}

// Forbidden sends a 403 error response.
func Forbidden(c *gin.Context, message string) {
	c.JSON(http.StatusForbidden, APIResponse{
		Success: false,
		Error:   &APIError{Code: "FORBIDDEN", Message: message},
	})
}

// NotFound sends a 404 error response.
func NotFound(c *gin.Context, message string) {
	c.JSON(http.StatusNotFound, APIResponse{
		Success: false,
		Error:   &APIError{Code: "NOT_FOUND", Message: message},
	})
}

// Conflict sends a 409 error response.
func Conflict(c *gin.Context, code, message string) {
	c.JSON(http.StatusConflict, APIResponse{
		Success: false,
		Error:   &APIError{Code: code, Message: message},
	})
}

// UnprocessableEntity sends a 422 error response (business rule violation).
func UnprocessableEntity(c *gin.Context, code, message string) {
	c.JSON(http.StatusUnprocessableEntity, APIResponse{
		Success: false,
		Error:   &APIError{Code: code, Message: message},
	})
}

// InternalError sends a 500 error response.
func InternalError(c *gin.Context, message string) {
	c.JSON(http.StatusInternalServerError, APIResponse{
		Success: false,
		Error:   &APIError{Code: "INTERNAL_ERROR", Message: message},
	})
}
