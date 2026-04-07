import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { CrudDataPage } from "../components/crud-data-page";
import { SectionCard } from "@suiyuan/ui-admin";
import { createApiClient } from "@suiyuan/api";
import type { SysDeptRecord, SysPostRecord, SysRoleRecord, SysUserRecord } from "@suiyuan/types";

type SelectOption = {
  label: string;
  value: number;
};

type FlattenedDeptOption = {
  deptId: number;
  title: string;
};

export function UsersPage({ api }: { api: ReturnType<typeof createApiClient> }) {
  const queryClient = useQueryClient();
  const [passwordTarget, setPasswordTarget] = useState<SysUserRecord | null>(null);
  const [nextPassword, setNextPassword] = useState("");
  const rolesQuery = useQuery({
    queryKey: ["admin-page", "role-options"],
    queryFn: async () => {
      const result = await api.admin.listRoles({ pageIndex: 1, pageSize: 100 });
      return result.list.map((item: SysRoleRecord): SelectOption => ({
        label: item.roleName,
        value: item.roleId,
      }));
    },
  });
  const postsQuery = useQuery({
    queryKey: ["admin-page", "post-options"],
    queryFn: async () => {
      const result = await api.admin.listPosts({ pageIndex: 1, pageSize: 100 });
      return result.list.map((item: SysPostRecord): SelectOption => ({
        label: item.postName,
        value: item.postId,
      }));
    },
  });
  const deptQuery = useQuery({
    queryKey: ["admin-page", "dept-options"],
    queryFn: async () => {
      const result = await api.admin.getDeptTree();
      return flattenDepts(result).map((item: FlattenedDeptOption): SelectOption => ({
        label: item.title,
        value: item.deptId,
      }));
    },
  });
  const roleMap = useMemo(
    () => new Map((rolesQuery.data || []).map((item) => [item.value, item.label])),
    [rolesQuery.data],
  );
  const postMap = useMemo(
    () => new Map((postsQuery.data || []).map((item) => [item.value, item.label])),
    [postsQuery.data],
  );
  const deptMap = useMemo(
    () =>
      new Map(
        (deptQuery.data || []).map((item) => [
          item.value,
          item.label.replaceAll("　", "").trim(),
        ]),
      ),
    [deptQuery.data],
  );
  const statusMutation = useMutation({
    mutationFn: async (payload: { userId: number; status: string }) => api.admin.updateUserStatus(payload.userId, payload.status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-page", "users"] });
    },
  });
  const passwordMutation = useMutation({
    mutationFn: async (payload: { userId: number; password: string }) => api.admin.resetUserPassword(payload.userId, payload.password),
    onSuccess: async () => {
      setPasswordTarget(null);
      setNextPassword("");
      await queryClient.invalidateQueries({ queryKey: ["admin-page", "users"] });
    },
  });

  async function handleStatusToggle(item: SysUserRecord) {
    const nextStatus = item.status === "2" ? "1" : "2";
    const nextLabel = nextStatus === "2" ? "启用" : "停用";
    if (!window.confirm(`确认${nextLabel}用户「${item.username}」吗？`)) {
      return;
    }

    try {
      await statusMutation.mutateAsync({ userId: item.userId, status: nextStatus });
    } catch (error) {
      const message = error instanceof Error ? error.message : "用户状态更新失败";
      window.alert(message);
    }
  }

  async function handleResetPassword() {
    if (!passwordTarget) {
      return;
    }
    if (!nextPassword.trim()) {
      window.alert("请输入新密码");
      return;
    }

    try {
      await passwordMutation.mutateAsync({ userId: passwordTarget.userId, password: nextPassword.trim() });
      window.alert(`用户「${passwordTarget.username}」密码已重置`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "密码重置失败";
      window.alert(message);
    }
  }

  return (
    <>
      <CrudDataPage<SysUserRecord>
        columns={[
        { label: "账号", render: (row) => row.username as string },
        { label: "昵称", render: (row) => row.nickName as string },
        { label: "手机号", render: (row) => row.phone as string },
        { label: "邮箱", render: (row) => row.email as string },
        { label: "角色", render: (row) => roleMap.get(row.roleId) || String(row.roleId ?? "-") },
        { label: "部门", render: (row) => deptMap.get(row.deptId) || String(row.deptId ?? "-") },
        { label: "岗位", render: (row) => postMap.get(row.postId) || String(row.postId ?? "-") },
        { label: "状态", render: (row) => (row.status === "2" ? "正常" : "停用") },
      ]}
        createDraft={() => ({
        username: "",
        password: "",
        nickName: "",
        phone: "",
        email: "",
        roleId: "",
        deptId: "",
        postId: "",
        sex: "0",
        status: "2",
        remark: "",
        })}
        createItem={(payload) => api.admin.createUser(payload)}
        deleteItem={(payload) => api.admin.deleteUsers(payload)}
        description="用户管理已经进入第二阶段，补齐状态切换、密码重置和名称映射，优先打通真实操作链路。"
        fetcher={(params) => api.admin.listUsers(params)}
        formFields={[
        { key: "username", label: "账号" },
        { key: "password", label: "密码", type: "password" },
        { key: "nickName", label: "昵称" },
        { key: "phone", label: "手机号" },
        { key: "email", label: "邮箱" },
        { key: "roleId", label: "角色", type: "select", options: rolesQuery.data || [] },
        { key: "deptId", label: "部门", type: "select", options: deptQuery.data || [] },
        { key: "postId", label: "岗位", type: "select", options: postsQuery.data || [] },
        {
          key: "sex",
          label: "性别",
          type: "select",
          options: [
            { label: "未知", value: "0" },
            { label: "男", value: "1" },
            { label: "女", value: "2" },
          ],
        },
        {
          key: "status",
          label: "状态",
          type: "select",
          options: [
            { label: "正常", value: "2" },
            { label: "停用", value: "1" },
          ],
        },
        { key: "remark", label: "备注", type: "textarea" },
        ]}
        getRowId={(item) => Number(item.userId)}
        queryKey="users"
        renderAside={() => (
        <SectionCard title="迁移说明" description="这一页对应官方 sys-user，沿用原后端字段，不在第一阶段重塑权限分配交互。">
          <ul className="detail-list">
            <li>角色、部门、岗位列已经使用后台选项映射为名称，不再只显示 ID。</li>
            <li>状态切换和密码重置已接入真实接口，仍不做批量操作。</li>
            <li>角色权限分配仍保持原后端规则，不在这一轮扩展成复杂授权器。</li>
          </ul>
        </SectionCard>
        )}
        rowActions={(item) => (
          <>
            <button
              className="tiny-action"
              disabled={statusMutation.isPending}
              onClick={() => void handleStatusToggle(item)}
              type="button"
            >
              {item.status === "2" ? "停用" : "启用"}
            </button>
            <button
              className="tiny-action"
              onClick={() => {
                setPasswordTarget(item);
                setNextPassword("");
              }}
              type="button"
            >
              重置密码
            </button>
          </>
        )}
        searchFields={[
        { key: "username", label: "账号", placeholder: "按账号过滤" },
        { key: "phone", label: "手机号", placeholder: "按手机号过滤" },
        { key: "status", label: "状态", placeholder: "输入 1 或 2" },
        ]}
        title="用户管理"
        toDraft={(item) => ({ ...item, password: "" })}
        updateItem={(payload) => api.admin.updateUser(payload as { userId: number })}
      />
      {passwordTarget ? (
        <div className="modal-mask">
          <div className="modal-card compact-modal">
            <h3>重置密码</h3>
            <p className="dialog-description">当前用户：{passwordTarget.username}</p>
            <label className="form-field">
              <span>新密码</span>
              <input onChange={(event) => setNextPassword(event.target.value)} type="password" value={nextPassword} />
            </label>
            <div className="inline-actions">
              <button className="primary-action" disabled={passwordMutation.isPending} onClick={() => void handleResetPassword()} type="button">
                {passwordMutation.isPending ? "提交中..." : "确认重置"}
              </button>
              <button
                className="soft-link"
                onClick={() => {
                  setPasswordTarget(null);
                  setNextPassword("");
                }}
                type="button"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function flattenDepts(items: SysDeptRecord[], level = 0): FlattenedDeptOption[] {
  return items.flatMap((item) => [
    {
      deptId: item.deptId,
      title: `${"　".repeat(level)}${item.deptName}`,
    },
    ...flattenDepts(item.children || [], level + 1),
  ]);
}
