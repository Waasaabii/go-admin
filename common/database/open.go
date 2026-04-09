package database

import (
	"github.com/glebarez/sqlite"
	"gorm.io/driver/mysql"
	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlserver"
	"gorm.io/gorm"
)

var opens = map[string]func(string) gorm.Dialector{
	"mysql":     mysql.Open,
	"postgres":  postgres.Open,
	"sqlite3":   sqlite.Open,
	"sqlserver": sqlserver.Open,
}
