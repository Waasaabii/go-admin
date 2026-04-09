package file_store

import (
	"testing"
)

func TestOBSUpload(t *testing.T) {
	cfg := loadProviderConfig(t, "OBS")
	oxs := cfg.oxs.Setup(HuaweiOBS)
	err := oxs.UpLoad("testdata/upload.txt", testUploadFixturePath())
	if err != nil {
		t.Error(err)
	}
	t.Log("ok")
}
