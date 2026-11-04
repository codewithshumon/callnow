package dto

import "net/http"

type ErrorEnvelope struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

type APIResponse struct {
	Success bool           `json:"success"`
	Data    interface{}    `json:"data,omitempty"`
	Error   *ErrorEnvelope `json:"error,omitempty"`
}

type PaginatedResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data"`
	Meta    Meta        `json:"meta"`
}

type Meta struct {
	Page  int `json:"page"`
	Limit int `json:"limit"`
	Total int `json:"total"`
}

func Success(data interface{}) (int, APIResponse) {
	return http.StatusOK, APIResponse{
		Success: true,
		Data:    data,
	}
}

func Created(data interface{}) (int, APIResponse) {
	return http.StatusCreated, APIResponse{
		Success: true,
		Data:    data,
	}
}

func Error(status int, code, message string) (int, APIResponse) {
	return status, APIResponse{
		Success: false,
		Error: &ErrorEnvelope{
			Code:    code,
			Message: message,
		},
	}
}
