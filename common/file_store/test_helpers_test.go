package file_store

import (
	"os"
	"path/filepath"
	"testing"
)

type testConfig struct {
	oxs     OXS
	options []ClientOption
}

func loadProviderConfig(t *testing.T, provider string) testConfig {
	t.Helper()

	prefix := "FILE_STORE_TEST_" + provider + "_"
	required := map[string]string{
		"endpoint":          os.Getenv(prefix + "ENDPOINT"),
		"access_key_id":     os.Getenv(prefix + "ACCESS_KEY_ID"),
		"access_key_secret": os.Getenv(prefix + "ACCESS_KEY_SECRET"),
		"bucket_name":       os.Getenv(prefix + "BUCKET_NAME"),
	}

	missing := make([]string, 0, len(required))
	for key, value := range required {
		if value == "" {
			missing = append(missing, prefix+toEnvName(key))
		}
	}
	if len(missing) > 0 {
		t.Skipf("缺少集成测试环境变量: %v", missing)
	}

	cfg := testConfig{
		oxs: OXS{
			Endpoint:        required["endpoint"],
			AccessKeyID:     required["access_key_id"],
			AccessKeySecret: required["access_key_secret"],
			BucketName:      required["bucket_name"],
		},
	}

	if provider == "KODO" {
		zone := os.Getenv(prefix + "ZONE")
		if zone != "" {
			cfg.options = append(cfg.options, ClientOption{"Zone": Zone(zone)})
		}
	}

	return cfg
}

func testUploadFixturePath() string {
	return filepath.Join("testdata", "upload.txt")
}

func toEnvName(key string) string {
	switch key {
	case "access_key_id":
		return "ACCESS_KEY_ID"
	case "access_key_secret":
		return "ACCESS_KEY_SECRET"
	case "bucket_name":
		return "BUCKET_NAME"
	default:
		return "ENDPOINT"
	}
}
