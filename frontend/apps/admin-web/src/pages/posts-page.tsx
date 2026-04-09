import { CrudDataPage } from "../components/crud-data-page";
import { createApiClient } from "@suiyuan/api";
import type { SysPostRecord } from "@suiyuan/types";

export function PostsPage({ api }: { api: ReturnType<typeof createApiClient> }) {
  return (
    <CrudDataPage<SysPostRecord>
      columns={[
        { label: "岗位名称", render: (row) => row.postName as string },
        { label: "岗位编码", render: (row) => row.postCode as string },
        { label: "排序", render: (row) => String(row.sort ?? "-") },
        { label: "状态", render: (row) => (Number(row.status) === 2 ? "正常" : "停用") },
        { label: "备注", render: (row) => (row.remark as string) || "-" },
      ]}
      createDraft={() => ({
        postName: "",
        postCode: "",
        sort: 1,
        status: 2,
        remark: "",
      })}
      createItem={(payload) => api.admin.createPost(payload)}
      deleteItem={(payload) => api.admin.deletePosts(payload)}
      description="管理系统岗位信息。"
      fetcher={(params) => api.admin.listPosts(params)}
      formFields={[
        { key: "postName", label: "岗位名称" },
        { key: "postCode", label: "岗位编码" },
        { key: "sort", label: "排序", type: "number" },
        {
          key: "status",
          label: "状态",
          type: "select",
          options: [
            { label: "正常", value: 2 },
            { label: "停用", value: 1 },
          ],
        },
        { key: "remark", label: "备注", type: "textarea" },
      ]}
      getRowId={(item) => Number(item.postId)}
      queryKey="posts"
      searchFields={[
        { key: "postName", label: "岗位名称", placeholder: "按岗位名称过滤" },
        { key: "postCode", label: "岗位编码", placeholder: "按岗位编码过滤" },
      ]}
      title="岗位管理"
      updateItem={(payload) => api.admin.updatePost(payload as { postId: number })}
    />
  );
}
