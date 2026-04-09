package file_store

import (
	"testing"
)

func TestKODOUpload(t *testing.T) {
	cfg := loadProviderConfig(t, "KODO")
	oxs := cfg.oxs.Setup(QiNiuKodo, cfg.options...)
	err := oxs.UpLoad("testdata/upload.txt", testUploadFixturePath())
	if err != nil {
		t.Error(err)
	}
	t.Log("ok")
}

func TestKODOGetTempToken(t *testing.T) {
	cfg := loadProviderConfig(t, "KODO")
	oxs := cfg.oxs.Setup(QiNiuKodo, cfg.options...)
	token, err := oxs.GetTempToken()
	if err != nil {
		t.Fatal(err)
	}
	if token == "" {
		t.Fatal("token 不能为空")
	}
	t.Log(token)
	t.Log("ok")
}
