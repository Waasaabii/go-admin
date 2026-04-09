package file_store

import (
	"testing"
)

func TestOSSUpload(t *testing.T) {
	cfg := loadProviderConfig(t, "OSS")
	oxs := cfg.oxs.Setup(AliYunOSS)
	err := oxs.UpLoad("testdata/upload.txt", testUploadFixturePath())
	if err != nil {
		t.Error(err)
	}
	t.Log("ok")
}
