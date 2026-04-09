// @vitest-environment jsdom
import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { Form, Input, Textarea } from "./index";

let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  host.remove();
  document.body.innerHTML = "";
});

function InputTabCompletionDemo() {
  const [value, setValue] = useState("ops");

  return (
    <Input
      completePlaceholderOnTab
      onChange={(event) => setValue(event.target.value)}
      placeholder="ops-worker"
      value={value}
    />
  );
}

function TextareaTabCompletionDemo() {
  const [value, setValue] = useState("请在变更窗口内");

  return (
    <Textarea
      completePlaceholderOnTab
      onChange={(event) => setValue(event.target.value)}
      placeholder="请在变更窗口内完成灰度、观测与回滚预案确认。"
      rows={4}
      value={value}
    />
  );
}

describe("ui-admin primitives", () => {
  it("Input 在启用 completePlaceholderOnTab 时按 Tab 用 placeholder 补全", async () => {
    await act(async () => {
      root.render(<InputTabCompletionDemo />);
    });

    const input = document.querySelector("input");
    expect(input).toBeTruthy();

    input?.setSelectionRange(input.value.length, input.value.length);

    await act(async () => {
      input?.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Tab" }));
    });

    expect(input?.value).toBe("ops-worker");
  });

  it("Textarea 在启用 completePlaceholderOnTab 时按 Tab 用 placeholder 补全", async () => {
    await act(async () => {
      root.render(<TextareaTabCompletionDemo />);
    });

    const textarea = document.querySelector("textarea");
    expect(textarea).toBeTruthy();

    textarea?.setSelectionRange(textarea.value.length, textarea.value.length);

    await act(async () => {
      textarea?.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Tab" }));
    });

    expect(textarea?.value).toBe("请在变更窗口内完成灰度、观测与回滚预案确认。");
  });

  it("Form 根据 layout 输出对应布局类名", async () => {
    await act(async () => {
      root.render(
        <div>
          <Form data-kind="vertical">
            <div>vertical</div>
          </Form>
          <Form data-kind="inline" layout="inline">
            <div>inline</div>
          </Form>
        </div>,
      );
    });

    const verticalForm = document.querySelector("form[data-kind='vertical']");
    const inlineForm = document.querySelector("form[data-kind='inline']");

    expect(verticalForm?.className).toContain("grid");
    expect(inlineForm?.className).toContain("flex");
  });
});
