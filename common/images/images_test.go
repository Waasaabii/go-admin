package images

import (
	"bytes"
	"image"
	"image/color"
	"image/gif"
	"image/png"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestBuildVariantPath(t *testing.T) {
	path := BuildVariantPath("/static/uploadfile/avatar/demo.webp", 128)
	if path != "/static/uploadfile/avatar/demo@128.webp" {
		t.Fatalf("unexpected variant path: %s", path)
	}
}

func TestNormalizePathPreservesAbsoluteURL(t *testing.T) {
	path := NormalizePath("https://example.com/avatar.webp")
	if path != "https://example.com/avatar.webp" {
		t.Fatalf("unexpected normalized path: %s", path)
	}
}

func TestSaveAvatarFromReader(t *testing.T) {
	workspace, err := os.Getwd()
	if err != nil {
		t.Fatalf("getwd failed: %v", err)
	}

	testDir := filepath.Join(workspace, ".tmp-avatar-test")
	if err := os.MkdirAll(testDir, 0o755); err != nil {
		t.Fatalf("mkdir failed: %v", err)
	}
	defer os.RemoveAll(testDir)

	originalWd, err := os.Getwd()
	if err != nil {
		t.Fatalf("getwd failed: %v", err)
	}
	if err := os.Chdir(testDir); err != nil {
		t.Fatalf("chdir failed: %v", err)
	}
	defer os.Chdir(originalWd)

	img := image.NewRGBA(image.Rect(0, 0, 900, 600))
	for y := 0; y < 600; y++ {
		for x := 0; x < 900; x++ {
			img.Set(x, y, color.RGBA{R: uint8(x % 255), G: uint8(y % 255), B: 120, A: 255})
		}
	}

	var buffer bytes.Buffer
	if err := png.Encode(&buffer, img); err != nil {
		t.Fatalf("encode png failed: %v", err)
	}

	asset, err := SaveAvatarFromReader(bytes.NewReader(buffer.Bytes()), "avatar-unit")
	if err != nil {
		t.Fatalf("save avatar failed: %v", err)
	}

	if asset.Path != "/static/uploadfile/avatar/avatar-unit.webp" {
		t.Fatalf("unexpected master path: %s", asset.Path)
	}
	if asset.Size != 512 {
		t.Fatalf("unexpected master size: %d", asset.Size)
	}
	if len(asset.Variants) != 3 {
		t.Fatalf("unexpected variants length: %d", len(asset.Variants))
	}

	expectedFiles := []string{
		"static/uploadfile/avatar/avatar-unit.webp",
		"static/uploadfile/avatar/avatar-unit@64.webp",
		"static/uploadfile/avatar/avatar-unit@128.webp",
		"static/uploadfile/avatar/avatar-unit@256.webp",
	}
	for _, file := range expectedFiles {
		if _, err := os.Stat(file); err != nil {
			t.Fatalf("expected file missing %s: %v", file, err)
		}
	}

	for _, variant := range asset.Variants {
		if !strings.Contains(variant.Path, "@") {
			t.Fatalf("variant path missing suffix: %s", variant.Path)
		}
	}

	restored := AssetFromPath(asset.Path)
	if restored == nil {
		t.Fatalf("asset from path should not be nil")
	}
	if restored.Size != 512 {
		t.Fatalf("unexpected restored size: %d", restored.Size)
	}
	if len(restored.Variants) != 3 {
		t.Fatalf("unexpected restored variants length: %d", len(restored.Variants))
	}
}

func TestSaveAvatarFromReaderKeepsGif(t *testing.T) {
	workspace, err := os.Getwd()
	if err != nil {
		t.Fatalf("getwd failed: %v", err)
	}

	testDir := filepath.Join(workspace, ".tmp-avatar-gif-test")
	if err := os.MkdirAll(testDir, 0o755); err != nil {
		t.Fatalf("mkdir failed: %v", err)
	}
	defer os.RemoveAll(testDir)

	originalWd, err := os.Getwd()
	if err != nil {
		t.Fatalf("getwd failed: %v", err)
	}
	if err := os.Chdir(testDir); err != nil {
		t.Fatalf("chdir failed: %v", err)
	}
	defer os.Chdir(originalWd)

	palette := color.Palette{
		color.RGBA{0, 0, 0, 255},
		color.RGBA{255, 0, 0, 255},
	}
	img := image.NewPaletted(image.Rect(0, 0, 32, 24), palette)
	for y := 0; y < 24; y++ {
		for x := 0; x < 32; x++ {
			if x%2 == 0 {
				img.SetColorIndex(x, y, 1)
			}
		}
	}

	var buffer bytes.Buffer
	if err := gif.Encode(&buffer, img, nil); err != nil {
		t.Fatalf("encode gif failed: %v", err)
	}

	asset, err := SaveAvatarFromReader(bytes.NewReader(buffer.Bytes()), "avatar-gif-unit")
	if err != nil {
		t.Fatalf("save gif avatar failed: %v", err)
	}

	if asset.Path != "/static/uploadfile/avatar/avatar-gif-unit.gif" {
		t.Fatalf("unexpected gif master path: %s", asset.Path)
	}
	if asset.Size != 32 {
		t.Fatalf("unexpected gif size: %d", asset.Size)
	}
	if len(asset.Variants) != 0 {
		t.Fatalf("gif should not generate variants, got %d", len(asset.Variants))
	}

	if _, err := os.Stat("static/uploadfile/avatar/avatar-gif-unit.gif"); err != nil {
		t.Fatalf("expected gif file missing: %v", err)
	}
	if _, err := os.Stat("static/uploadfile/avatar/avatar-gif-unit.webp"); !os.IsNotExist(err) {
		t.Fatalf("gif avatar should not generate webp file, stat err: %v", err)
	}

	restored := AssetFromPath(asset.Path)
	if restored == nil {
		t.Fatalf("asset from path should not be nil")
	}
	if restored.Path != asset.Path {
		t.Fatalf("unexpected restored path: %s", restored.Path)
	}
	if len(restored.Variants) != 0 {
		t.Fatalf("restored gif should not have variants")
	}
}

func TestSaveAvatarFromReaderFallsBackToOriginalWhenTranscodeFails(t *testing.T) {
	workspace, err := os.Getwd()
	if err != nil {
		t.Fatalf("getwd failed: %v", err)
	}

	testDir := filepath.Join(workspace, ".tmp-avatar-fallback-test")
	if err := os.MkdirAll(testDir, 0o755); err != nil {
		t.Fatalf("mkdir failed: %v", err)
	}
	defer os.RemoveAll(testDir)

	originalWd, err := os.Getwd()
	if err != nil {
		t.Fatalf("getwd failed: %v", err)
	}
	if err := os.Chdir(testDir); err != nil {
		t.Fatalf("chdir failed: %v", err)
	}
	defer os.Chdir(originalWd)

	img := image.NewRGBA(image.Rect(0, 0, 160, 160))
	for y := 0; y < 160; y++ {
		for x := 0; x < 160; x++ {
			img.Set(x, y, color.RGBA{R: 80, G: 150, B: 200, A: 255})
		}
	}

	var buffer bytes.Buffer
	if err := png.Encode(&buffer, img); err != nil {
		t.Fatalf("encode png failed: %v", err)
	}

	originalFormats := transcodableAvatarFormats
	transcodableAvatarFormats = map[string]bool{
		"jpeg": false,
		"png":  false,
		"webp": false,
	}
	defer func() {
		transcodableAvatarFormats = originalFormats
	}()

	asset, err := SaveAvatarFromReader(bytes.NewReader(buffer.Bytes()), "avatar-fallback-unit")
	if err != nil {
		t.Fatalf("save fallback avatar failed: %v", err)
	}

	if asset.Path != "/static/uploadfile/avatar/avatar-fallback-unit.png" {
		t.Fatalf("unexpected fallback path: %s", asset.Path)
	}
	if len(asset.Variants) != 0 {
		t.Fatalf("fallback asset should not generate variants, got %d", len(asset.Variants))
	}
	if _, err := os.Stat("static/uploadfile/avatar/avatar-fallback-unit.png"); err != nil {
		t.Fatalf("expected fallback file missing: %v", err)
	}
	if _, err := os.Stat("static/uploadfile/avatar/avatar-fallback-unit.webp"); !os.IsNotExist(err) {
		t.Fatalf("fallback should not generate webp file, stat err: %v", err)
	}
}
