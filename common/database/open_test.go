package database

import "testing"

func TestOpensIncludesSupportedDrivers(t *testing.T) {
	drivers := []string{"mysql", "postgres", "sqlite3", "sqlserver"}
	for _, driver := range drivers {
		if opens[driver] == nil {
			t.Fatalf("expected driver %s to be registered", driver)
		}
	}
}
