package jobs

import (
	log "github.com/go-admin-team/go-admin-core/logger"
	models2 "go-admin/app/jobs/models"
	"time"
)

func writeJobLog(job JobCore, status int, message string, startTime time.Time, endTime time.Time) {
	if job.DB == nil || job.JobId == 0 {
		return
	}
	if message == "" {
		if status == 2 {
			message = "执行成功"
		} else {
			message = "执行失败"
		}
	}
	record := models2.SysJobLog{
		JobId:          job.JobId,
		JobName:        job.Name,
		JobGroup:       job.JobGroup,
		JobType:        job.JobType,
		InvokeTarget:   job.InvokeTarget,
		CronExpression: job.CronExpression,
		Status:         status,
		Message:        message,
		DurationMs:     endTime.Sub(startTime).Milliseconds(),
		StartTime:      startTime,
		EndTime:        endTime,
		EntryId:        job.EntryId,
	}
	if err := job.DB.Create(&record).Error; err != nil {
		log.Warnf("[Job] write job log failed, jobId=%d err=%v", job.JobId, err)
	}
}
