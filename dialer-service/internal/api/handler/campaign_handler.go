package handler

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"github.com/voicelink/dialer-service/internal/api/dto"
	"github.com/voicelink/dialer-service/internal/campaign"
)

type CampaignHandler struct {
	service *campaign.Service
}

func NewCampaignHandler(service *campaign.Service) *CampaignHandler {
	return &CampaignHandler{service: service}
}

// POST /campaigns — Create and start campaign
func (h *CampaignHandler) CreateAndStart(c echo.Context) error {
	var req dto.CreateCampaignRequest
	if err := c.Bind(&req); err != nil {
		status, resp := dto.Error(http.StatusBadRequest, "BAD_REQUEST", "Invalid request body")
		return c.JSON(status, resp)
	}

	if req.Name == "" || req.FromNumber == "" {
		status, resp := dto.Error(http.StatusBadRequest, "VALIDATION_FAILED", "name and fromNumber are required")
		return c.JSON(status, resp)
	}

	input := campaign.CreateCampaignInput{
		ID:                   req.ID,
		UserID:               req.UserID,
		Name:                 req.Name,
		FromNumber:           req.FromNumber,
		Concurrency:          req.Concurrency,
		DelaySeconds:         req.DelaySeconds,
		RetryMax:             req.RetryMax,
		VoicemailDropURL:     req.VoicemailDropURL,
		CallingHoursStart:    req.CallingHoursStart,
		CallingHoursEnd:      req.CallingHoursEnd,
		CallingHoursTimezone: req.CallingHoursTimezone,
		ScheduledAt:          req.ScheduledAt,
		Contacts:             req.Contacts,
	}

	res, err := h.service.CreateAndStart(c.Request().Context(), input)
	if err != nil {
		status, resp := dto.Error(http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return c.JSON(status, resp)
	}

	status, resp := dto.Created(res)
	return c.JSON(status, resp)
}

// GET /campaigns/:id — Get campaign status + progress
func (h *CampaignHandler) GetByID(c echo.Context) error {
	id := c.Param("id")
	res, err := h.service.GetCampaign(c.Request().Context(), id)
	if err != nil {
		status, resp := dto.Error(http.StatusNotFound, "NOT_FOUND", "Campaign not found")
		return c.JSON(status, resp)
	}
	status, resp := dto.Success(res)
	return c.JSON(status, resp)
}

// POST /campaigns/:id/pause — Pause campaign
func (h *CampaignHandler) Pause(c echo.Context) error {
	id := c.Param("id")
	if err := h.service.PauseCampaign(c.Request().Context(), id); err != nil {
		status, resp := dto.Error(http.StatusBadRequest, "BAD_REQUEST", err.Error())
		return c.JSON(status, resp)
	}
	status, resp := dto.Success(map[string]string{"status": "paused"})
	return c.JSON(status, resp)
}

// POST /campaigns/:id/resume — Resume campaign
func (h *CampaignHandler) Resume(c echo.Context) error {
	id := c.Param("id")
	if err := h.service.ResumeCampaign(c.Request().Context(), id); err != nil {
		status, resp := dto.Error(http.StatusBadRequest, "BAD_REQUEST", err.Error())
		return c.JSON(status, resp)
	}
	status, resp := dto.Success(map[string]string{"status": "running"})
	return c.JSON(status, resp)
}

// POST /campaigns/:id/stop — Stop campaign
func (h *CampaignHandler) Stop(c echo.Context) error {
	id := c.Param("id")
	if err := h.service.StopCampaign(c.Request().Context(), id); err != nil {
		status, resp := dto.Error(http.StatusBadRequest, "BAD_REQUEST", err.Error())
		return c.JSON(status, resp)
	}
	status, resp := dto.Success(map[string]string{"status": "stopped"})
	return c.JSON(status, resp)
}

// GET /campaigns/:id/results — Paginated contact results
func (h *CampaignHandler) GetResults(c echo.Context) error {
	id := c.Param("id")
	page, _ := strconv.Atoi(c.QueryParam("page"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(c.QueryParam("limit"))
	if limit < 1 || limit > 100 {
		limit = 50
	}

	results, total, err := h.service.GetResults(c.Request().Context(), id, page, limit)
	if err != nil {
		status, resp := dto.Error(http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return c.JSON(status, resp)
	}

	return c.JSON(http.StatusOK, dto.PaginatedResponse{
		Success: true,
		Data:    results,
		Meta: dto.Meta{
			Page:  page,
			Limit: limit,
			Total: total,
		},
	})
}

// GET /campaigns/:id/export — Export CSV
func (h *CampaignHandler) ExportCSV(c echo.Context) error {
	id := c.Param("id")
	csvBytes, err := h.service.ExportCSV(c.Request().Context(), id)
	if err != nil {
		status, resp := dto.Error(http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return c.JSON(status, resp)
	}

	c.Response().Header().Set(echo.HeaderContentType, "text/csv")
	c.Response().Header().Set(echo.HeaderContentDisposition, `attachment; filename="campaign-results.csv"`)
	return c.Blob(http.StatusOK, "text/csv", csvBytes)
}
