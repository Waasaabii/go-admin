package models

import (
	"go-admin/common/models"
	"time"
)

type SysJobLog struct {
	Id             int       `json:"id" gorm:"primaryKey;autoIncrement"`
	JobId          int       `json:"jobId" gorm:"index;comment:任务ID"`
	JobName        string    `json:"jobName" gorm:"size:255;comment:任务名称"`
	JobGroup       string    `json:"jobGroup" gorm:"size:255;comment:任务分组"`
	JobType        int       `json:"jobType" gorm:"size:1;comment:任务类型"`
	InvokeTarget   string    `json:"invokeTarget" gorm:"size:255;comment:调用目标"`
	CronExpression string    `json:"cronExpression" gorm:"size:255;comment:Cron表达式"`
	Status         int       `json:"status" gorm:"size:1;comment:执行状态"`
	Message        string    `json:"message" gorm:"type:text;comment:执行消息"`
	DurationMs     int64     `json:"durationMs" gorm:"comment:执行耗时毫秒"`
	StartTime      time.Time `json:"startTime" gorm:"comment:开始时间"`
	EndTime        time.Time `json:"endTime" gorm:"comment:结束时间"`
	EntryId        int       `json:"entryId" gorm:"comment:调度服务EntryId"`
	models.ControlBy
	models.ModelTime

	DataScope string `json:"dataScope" gorm:"-"`
}

func (*SysJobLog) TableName() string {
	return "sys_job_log"
}

func (e *SysJobLog) Generate() models.ActiveRecord {
	o := *e
	return &o
}

func (e *SysJobLog) GetId() interface{} {
	return e.Id
}
