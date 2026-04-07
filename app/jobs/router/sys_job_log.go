package router

import (
	"github.com/gin-gonic/gin"
	jwt "github.com/go-admin-team/go-admin-core/sdk/pkg/jwtauth"
	"go-admin/app/jobs/models"
	dto2 "go-admin/app/jobs/service/dto"
	"go-admin/common/actions"
	"go-admin/common/middleware"
)

func init() {
	routerCheckRole = append(routerCheckRole, registerSysJobLogRouter)
}

func registerSysJobLogRouter(v1 *gin.RouterGroup, authMiddleware *jwt.GinJWTMiddleware) {
	r := v1.Group("/sysjob-log").Use(authMiddleware.MiddlewareFunc()).Use(middleware.AuthCheckRole())
	{
		sysJobLog := &models.SysJobLog{}
		r.GET("", actions.PermissionAction(), actions.IndexAction(sysJobLog, new(dto2.SysJobLogSearch), func() interface{} {
			list := make([]models.SysJobLog, 0)
			return &list
		}))
		r.GET("/:id", actions.PermissionAction(), actions.ViewAction(new(dto2.SysJobLogById), func() interface{} {
			return &dto2.SysJobLogItem{}
		}))
	}
}
