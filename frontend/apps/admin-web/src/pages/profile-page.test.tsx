// @vitest-environment jsdom
import { act } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProfilePage } from "./profile-page";

let host: HTMLDivElement;
let root: Root;

function setNativeValue(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");

  descriptor?.set?.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
}

async function flushPromises(rounds = 5) {
  for (let index = 0; index < rounds; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
}

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

describe("ProfilePage", () => {
  it("会渲染可编辑的个人资料表单", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <ProfilePage
            api={{
              system: {
                updateProfile: vi.fn(),
                uploadAvatar: vi.fn(),
              },
            }}
            info={{
              avatar: null,
              buttons: [],
              code: 200,
              deptId: 1,
              introduction: "",
              name: "管理员",
              permissions: [],
              roles: ["系统管理员"],
              userId: 1,
              userName: "admin",
            }}
            profile={{
              posts: [],
              roles: [],
              user: {
                avatar: null,
                deptId: 1,
                email: "admin@example.com",
                nickName: "管理员",
                phone: "13800000000",
                remark: "系统管理员",
                roleId: 1,
                userId: 1,
                username: "admin",
              },
            }}
          />
        </QueryClientProvider>,
      );
    });

    expect(host.textContent).toContain("基本资料");
    expect(host.textContent).toContain("账号与组织信息");
    expect(host.textContent).not.toContain("当前仅支持更换头像");
    expect(document.querySelector('input[name="nickName"]')).toBeTruthy();
    expect(document.querySelector('input[name="phone"]')).toBeTruthy();
    expect(document.querySelector('input[name="email"]')).toBeTruthy();
    expect(document.querySelector('textarea[name="remark"]')).toBeTruthy();
    expect(document.querySelector('input[name="username"]')).toBeFalsy();
  });

  it("提交资料后会调用更新接口并同步缓存", async () => {
    const api = {
      system: {
        updateProfile: vi.fn().mockResolvedValue(1),
        uploadAvatar: vi.fn(),
      },
    };
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    queryClient.setQueryData(["admin", "info"], {
      avatar: null,
      buttons: [],
      code: 200,
      deptId: 1,
      introduction: "",
      name: "管理员",
      permissions: [],
      roles: ["系统管理员"],
      userId: 1,
      userName: "admin",
    });
    queryClient.setQueryData(["admin", "profile"], {
      posts: [],
      roles: [{ roleId: 1, roleKey: "admin", roleName: "系统管理员" }],
      user: {
        avatar: null,
        deptId: 1,
        email: "admin@example.com",
        nickName: "管理员",
        phone: "13800000000",
        remark: "旧备注",
        roleId: 1,
        userId: 1,
        username: "admin",
      },
    });

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <ProfilePage
            api={api}
            info={{
              avatar: null,
              buttons: [],
              code: 200,
              deptId: 1,
              introduction: "",
              name: "管理员",
              permissions: [],
              roles: ["系统管理员"],
              userId: 1,
              userName: "admin",
            }}
            profile={{
              posts: [],
              roles: [{ roleId: 1, roleKey: "admin", roleName: "系统管理员" }],
              user: {
                avatar: null,
                deptId: 1,
                email: "admin@example.com",
                nickName: "管理员",
                phone: "13800000000",
                remark: "旧备注",
                roleId: 1,
                userId: 1,
                username: "admin",
              },
            }}
          />
        </QueryClientProvider>,
      );
    });

    const nickNameInput = document.querySelector('input[name="nickName"]') as HTMLInputElement | null;
    const phoneInput = document.querySelector('input[name="phone"]') as HTMLInputElement | null;
    const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement | null;
    const remarkInput = document.querySelector('textarea[name="remark"]') as HTMLTextAreaElement | null;
    const submitButton = Array.from(document.querySelectorAll("button")).find((item) => item.textContent?.trim() === "保存资料") as HTMLButtonElement | undefined;

    expect(nickNameInput).toBeTruthy();
    expect(phoneInput).toBeTruthy();
    expect(emailInput).toBeTruthy();
    expect(remarkInput).toBeTruthy();
    expect(submitButton).toBeTruthy();

    await act(async () => {
      setNativeValue(nickNameInput!, "新昵称");
      setNativeValue(phoneInput!, "13900000000");
      setNativeValue(emailInput!, "new@example.com");
      setNativeValue(remarkInput!, "新的备注");
    });

    await act(async () => {
      submitButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await flushPromises(8);

    expect(api.system.updateProfile).toHaveBeenCalledWith({
      email: "new@example.com",
      nickName: "新昵称",
      phone: "13900000000",
      remark: "新的备注",
    });
    expect(queryClient.getQueryData(["admin", "info"])).toMatchObject({
      name: "新昵称",
    });
    expect(queryClient.getQueryData(["admin", "profile"])).toMatchObject({
      user: {
        email: "new@example.com",
        nickName: "新昵称",
        phone: "13900000000",
        remark: "新的备注",
      },
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["admin", "info"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["admin", "profile"] });
  });

  it("上传头像后会调用上传接口并刷新查询", async () => {
    const nextAvatar = {
      path: "/static/uploadfile/avatar/avatar-next.gif",
      size: 320,
    };
    const api = {
      system: {
        updateProfile: vi.fn(),
        uploadAvatar: vi.fn().mockResolvedValue(nextAvatar),
      },
    };
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    queryClient.setQueryData(["admin", "info"], {
      avatar: {
        path: "/static/uploadfile/avatar/avatar-old.webp",
        size: 512,
        variants: [
          { path: "/static/uploadfile/avatar/avatar-old@64.webp", size: 64 },
          { path: "/static/uploadfile/avatar/avatar-old@128.webp", size: 128 },
          { path: "/static/uploadfile/avatar/avatar-old@256.webp", size: 256 },
        ],
      },
      buttons: [],
      code: 200,
      deptId: 1,
      introduction: "",
      name: "管理员",
      permissions: [],
      roles: ["系统管理员"],
      userId: 1,
      userName: "admin",
    });
    queryClient.setQueryData(["admin", "profile"], {
      posts: [],
      roles: [{ roleId: 1, roleKey: "admin", roleName: "系统管理员" }],
      user: {
        avatar: {
          path: "/static/uploadfile/avatar/avatar-old.webp",
          size: 512,
          variants: [
            { path: "/static/uploadfile/avatar/avatar-old@64.webp", size: 64 },
            { path: "/static/uploadfile/avatar/avatar-old@128.webp", size: 128 },
            { path: "/static/uploadfile/avatar/avatar-old@256.webp", size: 256 },
          ],
        },
        deptId: 1,
        email: "",
        nickName: "管理员",
        phone: "",
        remark: "",
        roleId: 1,
        userId: 1,
        username: "admin",
      },
    });

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <ProfilePage
            api={api}
            info={{
              avatar: {
                path: "/static/uploadfile/avatar/avatar-old.webp",
                size: 512,
                variants: [
                  { path: "/static/uploadfile/avatar/avatar-old@64.webp", size: 64 },
                  { path: "/static/uploadfile/avatar/avatar-old@128.webp", size: 128 },
                  { path: "/static/uploadfile/avatar/avatar-old@256.webp", size: 256 },
                ],
              },
              buttons: [],
              code: 200,
              deptId: 1,
              introduction: "",
              name: "管理员",
              permissions: [],
              roles: ["系统管理员"],
              userId: 1,
              userName: "admin",
            }}
            profile={{
              posts: [],
              roles: [{ roleId: 1, roleKey: "admin", roleName: "系统管理员" }],
              user: {
                avatar: {
                  path: "/static/uploadfile/avatar/avatar-old.webp",
                  size: 512,
                  variants: [
                    { path: "/static/uploadfile/avatar/avatar-old@64.webp", size: 64 },
                    { path: "/static/uploadfile/avatar/avatar-old@128.webp", size: 128 },
                    { path: "/static/uploadfile/avatar/avatar-old@256.webp", size: 256 },
                  ],
                },
                deptId: 1,
                email: "",
                nickName: "管理员",
                phone: "",
                remark: "",
                roleId: 1,
                userId: 1,
                username: "admin",
              },
            }}
          />
        </QueryClientProvider>,
      );
    });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement | null;
    expect(input).toBeTruthy();

    const file = new File(["avatar"], "avatar.png", { type: "image/png" });
    await act(async () => {
      Object.defineProperty(input, "files", {
        configurable: true,
        value: [file],
      });
      input?.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await flushPromises(8);

    expect(api.system.uploadAvatar).toHaveBeenCalledWith(file);
    expect(queryClient.getQueryData(["admin", "info"])).toMatchObject({
      avatar: nextAvatar,
    });
    expect(queryClient.getQueryData(["admin", "profile"])).toMatchObject({
      user: {
        avatar: nextAvatar,
      },
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["admin", "info"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["admin", "profile"] });
  });
});
