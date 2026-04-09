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
import type { SysOperaLogRecord } from "@go-admin/types";

const statusOptions = [
  { value: "", label: "全部状态" },
  { value: "1", label: "正常" },
  { value: "2", label: "关闭" },
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

export function OperaLogsPage({ api }: { api: ReturnType<typeof createApiClient> }) {
  const queryClient = useQueryClient();
  const [pageIndex, setPageIndex] = useState(1);
  const [title, setTitle] = useState("");
  const [operUrl, setOperUrl] = useState("");
  const [status, setStatus] = useState("");
  const [dateRange, setDateRange] = useState<DateRangePickerValue>();
  const [detailId, setDetailId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SysOperaLogRecord | null>(null);

  const listQuery = useQuery({
    queryKey: ["admin-page", "opera-logs", title, operUrl, status, dateRange?.[0], dateRange?.[1], pageIndex],
    queryFn: () =>
      api.admin.listOperaLogs({
        pageIndex,
        pageSize: 20,
        title: title || undefined,
        operUrl: operUrl || undefined,
        status: status ? Number(status) : undefined,
        ...toRangeParams(dateRange),
      }),
  });
  const detailQuery = useQuery({
    enabled: detailId !== null,
    queryKey: ["admin-page", "opera-log-detail", detailId],
    queryFn: () => api.admin.getOperaLog(detailId as number),
  });
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.admin.deleteOperaLogs({ ids: [id] }),
    onSuccess: async () => {
      toast.success("操作日志已删除");
      await queryClient.invalidateQueries({ queryKey: ["admin-page", "opera-logs"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "操作日志删除失败");
    },
  });

  const rows = listQuery.data?.list || [];
  const total = listQuery.data?.count || 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));
  const detail = detailQuery.data;

  return (
    <AdminPageStack>
      <PageHeader description="查询系统操作日志记录。" kicker="Admin Module" title="操作日志" />

      <FilterPanel description="支持按模块、操作类型和时间范围筛选。">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FormField label="模块">
            <Input onChange={(event) => {
              setPageIndex(1);
              setTitle(event.target.value);
            }} placeholder="按模块过滤" value={title} />
          </FormField>
          <FormField label="访问地址">
            <Input onChange={(event) => {
              setPageIndex(1);
              setOperUrl(event.target.value);
            }} placeholder="按访问地址过滤" value={operUrl} />
          </FormField>
          <FormField label="状态">
            <Select onValueChange={(value) => {
              setPageIndex(1);
              setStatus(value);
            }} options={statusOptions} value={status} />
          </FormField>
          <FormField label="操作时间">
            <DateRangePicker onChange={(value) => {
              setPageIndex(1);
              setDateRange(value);
            }} shortcuts={createCommonShortcuts()} value={dateRange} valueFormat="YYYY-MM-DD HH:mm:ss" defaultTime={RANGE_DEFAULT_TIME} />
          </FormField>
        </div>
        <Toolbar>
          <Button onClick={() => void queryClient.invalidateQueries({ queryKey: ["admin-page", "opera-logs"] })} type="button" variant="outline">
            刷新数据
          </Button>
        </Toolbar>
      </FilterPanel>

      <DataTableSection description={`当前共 ${total} 条记录。`} title="日志列表">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>模块</TableHead>
              <TableHead>请求方式</TableHead>
              <TableHead>访问地址</TableHead>
              <TableHead>操作人</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>耗时</TableHead>
              <TableHead>操作时间</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.title || "-"}</TableCell>
                <TableCell>{row.requestMethod || "-"}</TableCell>
                <TableCell>{row.operUrl || "-"}</TableCell>
                <TableCell>{row.operName || "-"}</TableCell>
                <TableCell>
                  <StatusBadge status={row.status === "1" ? "正常" : "关闭"} />
                </TableCell>
                <TableCell>{row.latencyTime || "-"}</TableCell>
                <TableCell>{formatDateTime(row.operTime as string)}</TableCell>
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

      <DetailDialog description="请求元数据、请求参数和返回结果统一放入详情弹层。" onOpenChange={(open) => !open && setDetailId(null)} open={detailId !== null} title="操作日志详情">
        {detail ? (
          <div className="grid gap-4">
            <DetailGrid
              items={[
                { label: "请求地址", value: detail.operUrl || "-" },
                { label: "登录信息", value: `${detail.operName || "-"} / ${detail.operIp || "-"} / ${detail.operLocation || "-"}` },
                { label: "请求方式", value: detail.requestMethod || "-" },
                { label: "耗时", value: detail.latencyTime || "-" },
                { label: "操作状态", value: detail.status === "1" ? "正常" : "关闭" },
                { label: "操作时间", value: formatDateTime(detail.operTime as string) },
                { label: "部门", value: detail.deptName || "-" },
                { label: "UA", value: detail.userAgent || "-" },
              ]}
            />
            <ReadonlyCodeBlock title="请求参数">{detail.operParam || "-"}</ReadonlyCodeBlock>
            <ReadonlyCodeBlock title="返回结果">{detail.jsonResult || "-"}</ReadonlyCodeBlock>
          </div>
        ) : (
          <div className="py-4 text-sm text-muted-foreground">正在加载详情...</div>
        )}
      </DetailDialog>

      <ConfirmDialog
        description={deleteTarget ? `操作日志「${deleteTarget.title || "-"}」将被删除。` : ""}
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
        title="确认删除该操作日志？"
      />
    </AdminPageStack>
  );
}
