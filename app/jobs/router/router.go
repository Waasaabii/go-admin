package router

import (
	"github.com/gin-gonic/gin"
	jwt "github.com/go-admin-team/go-admin-core/sdk/pkg/jwtauth"
	"go-admin/common/routerx"
)

var (
	routerNoCheckRole = make([]func(*gin.RouterGroup), 0)
	routerCheckRole   = make([]func(v1 *gin.RouterGroup, authMiddleware *jwt.GinJWTMiddleware), 0)
)

// initRouter 路由示例
func initRouter(r *gin.Engine, authMiddleware *jwt.GinJWTMiddleware) *gin.Engine {

	// 无需认证的路由
	noCheckRoleRouter(r)
	// 需要认证的路由
	checkRoleRouter(r, authMiddleware)

	return r
}

// noCheckRoleRouter 无需认证的路由示例
func noCheckRoleRouter(r *gin.Engine) {
	routerx.RegisterGroups(r, routerx.AdminPrefixes(), func(v1 *gin.RouterGroup) {
		for _, f := range routerNoCheckRole {
			f(v1)
		}
	})
}

// checkRoleRouter 需要认证的路由示例
func checkRoleRouter(r *gin.Engine, authMiddleware *jwt.GinJWTMiddleware) {
	routerx.RegisterGroups(r, routerx.AdminPrefixes(), func(v1 *gin.RouterGroup) {
		for _, f := range routerCheckRole {
			f(v1, authMiddleware)
		}
	})
}
