import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  AdminPageStack,
  Button,
  ConfirmDialog,
  DataTableSection,
  DateRangePicker,
  type DateRangePickerValue,
  DetailDialog,
  DetailGrid,
  FilterPanel,
  FormField,
  Input,
  PageHeader,
  Pagination,
  ReadonlyCodeBlock,
  RowActions,
  Select,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Toolbar,
  toast,
} from "@go-admin/ui-admin";
import { createApiClient } from "@go-admin/api";
import type { SysLoginLogRecord } from "@go-admin/types";

const statusOptions = [
  { value: "", label: "全部状态" },
  { value: "2", label: "成功" },
  { value: "1", label: "失败" },
];

const RANGE_DEFAULT_TIME: [Date, Date] = [new Date(2000, 0, 1, 0, 0, 0), new Date(2000, 0, 1, 23, 59, 59)];

function addDays(value: Date, amount: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + amount);
  return next;
}

function startOfMonth(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

function createCommonShortcuts() {
  const today = new Date();
  return [
    { text: "今天", value: [today, today] as [Date, Date] },
    { text: "最近 7 天", value: [addDays(today, -6), today] as [Date, Date] },
    { text: "最近 30 天", value: [addDays(today, -29), today] as [Date, Date] },
    { text: "本月", value: [startOfMonth(today), today] as [Date, Date] },
  ];
}

function formatDateTime(value?: string) {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleString("zh-CN", { hour12: false });
}

function toRangeParams(range?: DateRangePickerValue) {
  return {
    beginTime: typeof range?.[0] === "string" ? range[0] : undefined,
    endTime: typeof range?.[1] === "string" ? range[1] : undefined,
  };
}

export function LoginLogsPage({ api }: { api: ReturnType<typeof createApiClient> }) {
  const queryClient = useQueryClient();
  const [pageIndex, setPageIndex] = useState(1);
  const [username, setUsername] = useState("");
  const [ipaddr, setIpaddr] = useState("");
  const [status, setStatus] = useState("");
  const [dateRange, setDateRange] = useState<DateRangePickerValue>();
  const [detailId, setDetailId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SysLoginLogRecord | null>(null);

  const listQuery = useQuery({
    queryKey: ["admin-page", "login-logs", username, ipaddr, status, dateRange?.[0], dateRange?.[1], pageIndex],
    queryFn: () =>
      api.admin.listLoginLogs({
        pageIndex,
        pageSize: 20,
        username: username || undefined,
        ipaddr: ipaddr || undefined,
        status: status || undefined,
        ...toRangeParams(dateRange),
      }),
  });

  const detailQuery = useQuery({
    enabled: detailId !== null,
    queryKey: ["admin-page", "login-log-detail", detailId],
    queryFn: () => api.admin.getLoginLog(detailId as number),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.admin.deleteLoginLogs({ ids: [id] }),
    onSuccess: async () => {
      toast.success("登录日志已删除");
      await queryClient.invalidateQueries({ queryKey: ["admin-page", "login-logs"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "登录日志删除失败");
    },
  });

  const rows = listQuery.data?.list || [];
  const total = listQuery.data?.count || 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));
  const detail = detailQuery.data;

  return (
    <AdminPageStack>
      <PageHeader description="查询系统登录日志记录。" kicker="Admin Module" title="登录日志" />

      <FilterPanel description="支持按用户名、IP、状态和时间范围筛选。">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FormField label="用户名">
            <Input onChange={(event) => {
              setPageIndex(1);
              setUsername(event.target.value);
            }} placeholder="按用户名过滤" value={username} />
          </FormField>
          <FormField label="IP">
            <Input onChange={(event) => {
              setPageIndex(1);
              setIpaddr(event.target.value);
            }} placeholder="按 IP 过滤" value={ipaddr} />
          </FormField>
          <FormField label="状态">
            <Select onValueChange={(value) => {
              setPageIndex(1);
              setStatus(value);
            }} options={statusOptions} value={status} />
          </FormField>
          <FormField label="登录时间">
            <DateRangePicker onChange={(value) => {
              setPageIndex(1);
              setDateRange(value);
            }} shortcuts={createCommonShortcuts()} value={dateRange} valueFormat="YYYY-MM-DD HH:mm:ss" defaultTime={RANGE_DEFAULT_TIME} />
          </FormField>
        </div>
        <Toolbar>
          <Button onClick={() => void queryClient.invalidateQueries({ queryKey: ["admin-page", "login-logs"] })} type="button" variant="outline">
            刷新数据
          </Button>
        </Toolbar>
      </FilterPanel>

      <DataTableSection description={`当前共 ${total} 条记录。`} title="日志列表">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>用户名</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>浏览器</TableHead>
              <TableHead>系统</TableHead>
              <TableHead>登录时间</TableHead>
              <TableHead>消息</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.username || "-"}</TableCell>
                <TableCell>
                  <StatusBadge status={row.status === "2" ? "成功" : "失败"} />
                </TableCell>
                <TableCell>{row.ipaddr || "-"}</TableCell>
                <TableCell>{row.browser || "-"}</TableCell>
                <TableCell>{row.os || "-"}</TableCell>
                <TableCell>{formatDateTime(row.loginTime as string)}</TableCell>
                <TableCell>{row.msg || "-"}</TableCell>
                <TableCell>
                  <RowActions>
                    <Button onClick={() => setDetailId(row.id)} size="sm" type="button" variant="outline">
                      详情
                    </Button>
                    <Button onClick={() => setDeleteTarget(row)} size="sm" type="button" variant="destructive">
                      删除
                    </Button>
                  </RowActions>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Pagination onNext={() => setPageIndex((current) => current + 1)} onPrevious={() => setPageIndex((current) => current - 1)} page={pageIndex} totalPages={totalPages} />
      </DataTableSection>

      <DetailDialog description="查看单条登录记录的环境、归属地和结果信息。" onOpenChange={(open) => !open && setDetailId(null)} open={detailId !== null} title="登录日志详情">
        {detail ? (
          <div className="grid gap-4">
            <DetailGrid
              items={[
                { label: "用户名", value: detail.username || "-" },
                { label: "状态", value: detail.status === "2" ? "成功" : "失败" },
                { label: "IP", value: detail.ipaddr || "-" },
                { label: "归属地", value: detail.loginLocation || "-" },
                { label: "浏览器", value: detail.browser || "-" },
                { label: "系统", value: detail.os || "-" },
                { label: "平台", value: detail.platform || "-" },
                { label: "登录时间", value: formatDateTime(detail.loginTime as string) },
                { label: "备注", value: detail.remark || "-" },
              ]}
            />
            <ReadonlyCodeBlock title="日志消息">{detail.msg || "无详细消息"}</ReadonlyCodeBlock>
          </div>
        ) : (
          <div className="py-4 text-sm text-muted-foreground">正在加载详情...</div>
        )}
      </DetailDialog>

      <ConfirmDialog
        description={deleteTarget ? `登录日志「${deleteTarget.username || "-"} / ${deleteTarget.ipaddr || "-"}」将被删除。` : ""}
        onConfirm={async () => {
          if (!deleteTarget) {
            return;
          }
          await deleteMutation.mutateAsync(deleteTarget.id);
          setDeleteTarget(null);
        }}
        open={deleteTarget !== null}
        setOpen={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title="确认删除该登录日志？"
      />
    </AdminPageStack>
  );
}
