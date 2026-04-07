package dto

import (
	"github.com/gin-gonic/gin"
	"github.com/go-admin-team/go-admin-core/sdk/api"
	"go-admin/app/jobs/models"
	"go-admin/common/dto"
	common "go-admin/common/models"
	"time"
)

type SysJobLogSearch struct {
	dto.Pagination `search:"-"`
	Id             int    `form:"id" search:"type:exact;column:id;table:sys_job_log"`
	JobId          int    `form:"jobId" search:"type:exact;column:job_id;table:sys_job_log"`
	JobName        string `form:"jobName" search:"type:icontains;column:job_name;table:sys_job_log"`
	JobGroup       string `form:"jobGroup" search:"type:exact;column:job_group;table:sys_job_log"`
	Status         int    `form:"status" search:"type:exact;column:status;table:sys_job_log"`
}

func (m *SysJobLogSearch) GetNeedSearch() interface{} {
	return *m
}

func (m *SysJobLogSearch) Bind(ctx *gin.Context) error {
	log := api.GetRequestLogger(ctx)
	err := ctx.ShouldBind(m)
	if err != nil {
		log.Errorf("Bind error: %s", err)
	}
	return err
}

func (m *SysJobLogSearch) Generate() dto.Index {
	o := *m
	return &o
}

type SysJobLogById struct {
	dto.ObjectById
}

func (s *SysJobLogById) Generate() dto.Control {
	cp := *s
	return &cp
}

func (s *SysJobLogById) GenerateM() (common.ActiveRecord, error) {
	return &models.SysJobLog{}, nil
}

type SysJobLogItem struct {
	Id             int       `json:"id"`
	JobId          int       `json:"jobId"`
	JobName        string    `json:"jobName"`
	JobGroup       string    `json:"jobGroup"`
	JobType        int       `json:"jobType"`
	InvokeTarget   string    `json:"invokeTarget"`
	CronExpression string    `json:"cronExpression"`
	Status         int       `json:"status"`
	Message        string    `json:"message"`
	DurationMs     int64     `json:"durationMs"`
	StartTime      time.Time `json:"startTime"`
	EndTime        time.Time `json:"endTime"`
	EntryId        int       `json:"entryId"`
}
