package service

import (
	"context"
	"testing"
	"time"

	appModels "go-admin/app/ops/models"
	commonModels "go-admin/common/models"
)

func TestTaskManagerBroadcastDropsSlowSubscriber(t *testing.T) {
	manager := &TaskManager{
		envLocks:    make(map[string]int),
		subs:        make(map[int]map[chan TaskEvent]struct{}),
		taskCancels: make(map[int]context.CancelFunc),
		rootCtx:     context.Background(),
	}
	ch := make(chan TaskEvent, 128)
	manager.subs[1] = map[chan TaskEvent]struct{}{
		ch: {},
	}
	for i := 0; i < cap(ch); i++ {
		ch <- TaskEvent{Type: "log"}
	}

	manager.Broadcast(1, TaskEvent{Type: "status"})

	if _, ok := manager.subs[1]; ok {
		t.Fatalf("expected slow subscriber to be removed")
	}
}

func TestTaskManagerRootContextCancellationStopsTask(t *testing.T) {
	rootCtx, cancel := context.WithCancel(context.Background())
	manager := &TaskManager{
		envLocks:    make(map[string]int),
		subs:        make(map[int]map[chan TaskEvent]struct{}),
		taskCancels: make(map[int]context.CancelFunc),
		rootCtx:     rootCtx,
	}
	done := make(chan struct{})

	manager.StartTask(1, func(ctx context.Context) {
		defer close(done)
		<-ctx.Done()
	})

	cancel()

	select {
	case <-done:
	case <-time.After(2 * time.Second):
		t.Fatalf("expected task context to be cancelled by root context")
	}
	if ok := manager.Wait(2 * time.Second); !ok {
		t.Fatalf("expected task manager wait to finish")
	}
}

func TestFinalizeQueuedTaskCancellationReleasesEnvLockAndBroadcastsError(t *testing.T) {
	manager := &TaskManager{
		envLocks:    make(map[string]int),
		subs:        make(map[int]map[chan TaskEvent]struct{}),
		taskCancels: make(map[int]context.CancelFunc),
		rootCtx:     context.Background(),
	}
	task := &appModels.OpsTask{
		Model:  commonModels.Model{Id: 7},
		Env:    "dev",
		Type:   appModels.TaskTypeDeployBackend,
		Status: appModels.TaskStatusCancelled,
		ErrMsg: "任务在排队阶段被取消",
	}
	manager.envLocks["dev"] = task.Id
	ch := manager.Subscribe(task.Id)

	finalizeQueuedTaskCancellation(manager, task)

	if _, ok := manager.envLocks["dev"]; ok {
		t.Fatalf("expected env lock to be released")
	}
	event, ok := <-ch
	if !ok {
		t.Fatalf("expected buffered error event before channel close")
	}
	if event.Type != "error" {
		t.Fatalf("expected error event, got %s", event.Type)
	}
	errData, ok := event.Data.(errorEvent)
	if !ok {
		t.Fatalf("expected errorEvent payload, got %T", event.Data)
	}
	if errData.ErrMsg != task.ErrMsg {
		t.Fatalf("expected err msg %q, got %q", task.ErrMsg, errData.ErrMsg)
	}
	if _, ok := <-ch; ok {
		t.Fatalf("expected subscriber channel to be closed")
	}
}
