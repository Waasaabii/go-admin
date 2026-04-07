package routerx

import "github.com/gin-gonic/gin"

var (
	adminPrefixes = []string{"/api/v1", "/admin-api/v1"}
	appPrefix     = "/app-api/v1"
)

func AdminPrefixes() []string {
	return adminPrefixes
}

func AppPrefix() string {
	return appPrefix
}

func RegisterGroups(r *gin.Engine, prefixes []string, fn func(group *gin.RouterGroup)) {
	for _, prefix := range prefixes {
		fn(r.Group(prefix))
	}
}
