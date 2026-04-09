import {
  Button,
  ConfirmActionDialog,
  ConfirmDialog,
  DetailDialog,
  DetailGrid,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  Drawer,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  EmptyBlock,
  EmptyLogState,
  EmptyState,
  FormActions,
  FormDialog,
  FormField,
  InlineNotice,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  RowActions,
  Skeleton,
  Textarea,
  ToastViewport,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  toast,
} from "@suiyuan/ui-admin";
import { useState } from "react";
import {
  ShowcaseDocPage,
  detailItems,
  type ShowcaseCategory,
  type ShowcaseRoute,
} from "./shared";

function InlineNoticePage() {
  return (
    <ShowcaseDocPage
      apiItems={[
        { defaultValue: '"info"', description: "提示类型。", name: "type", type: '"info" | "success" | "warning" | "danger" | "error"' },
        { defaultValue: '"light"', description: "提示效果。", name: "effect", type: '"light" | "solid"' },
        { description: "右侧操作区。", name: "actions", type: "ReactNode" },
      ]}
      categoryLabel="反馈与浮层"
      demos={[
        {
          code: `<InlineNotice title="信息提示" type="info">展示页中的所有示例都来自共享 UI 包。</InlineNotice>`,
          content: (
            <InlineNotice title="信息提示" type="info">
              展示页中的所有示例都来自共享 UI 包。
            </InlineNotice>
          ),
          description: "最轻量的页内提示，适合说明当前区域的上下文。",
          title: "基础用法",
        },
        {
          code: `<div className="grid gap-3">
  <InlineNotice title="校验通过" type="success" effect="solid" />
  <InlineNotice title="发布窗口即将关闭" type="warning" />
  <InlineNotice title="校验失败" type="error" />
</div>`,
          content: (
            <div className="grid gap-3">
              <InlineNotice effect="solid" title="校验通过" type="success">
                当前环境配置完整，可以继续下一步发布。
              </InlineNotice>
              <InlineNotice title="发布窗口即将关闭" type="warning">
                当前版本需要在 20 分钟内完成审批和灰度验证。
              </InlineNotice>
              <InlineNotice title="校验失败" type="error">
                当前环境缺少审批人，请先补齐流程配置。
              </InlineNotice>
            </div>
          ),
          description: "按语义区分 success / warning / error，统一信息密度。",
          title: "状态与效果",
        },
        {
          code: `<InlineNotice
  title="审批未完成"
  type="warning"
  actions={<Button outlined size="small" type="button" variant="danger">查看详情</Button>}
/>`,
          content: (
            <InlineNotice
              actions={
                <Button outlined size="small" type="button" variant="danger">
                  查看详情
                </Button>
              }
              title="审批未完成"
              type="warning"
            >
              关键提示可以配一个明确操作，避免用户自行寻找入口。
            </InlineNotice>
          ),
          description: "用于“提示 + 一个明确动作”的组合场景。",
          title: "带操作区",
        },
      ]}
      description="InlineNotice 对齐 Element Plus 风格的页内提示条，适合信息、成功、警告和错误等轻量反馈，并统一支持 light / solid 两种效果。"
      notes={["说明和提醒优先走 InlineNotice，不要动不动弹窗。", "危险级提示只保留必要信息，详细说明放帮助链接或说明区。"]}
      title="InlineNotice"
    />
  );
}

function ConfirmDialogPage() {
  const [basicOpen, setBasicOpen] = useState(false);
  const [dangerOpen, setDangerOpen] = useState(false);

  return (
    <ShowcaseDocPage
      apiItems={[
        { description: "是否打开弹层。", name: "open", required: true, type: "boolean" },
        { description: "弹层显隐变化回调。", name: "setOpen", required: true, type: "(open: boolean) => void" },
        { description: "确认操作回调。", name: "onConfirm", type: "() => void | Promise<void>" },
        { defaultValue: '"确认"', description: "确认按钮文案。", name: "actionLabel", type: "ReactNode" },
      ]}
      categoryLabel="反馈与浮层"
      demos={[
        {
          code: `<ConfirmDialog
  open={open}
  setOpen={setOpen}
  title="确认发布到生产环境？"
  onConfirm={handleConfirm}
/>`,
          content: (
            <>
              <Button onClick={() => setBasicOpen(true)} type="button">
                打开确认框
              </Button>
              <ConfirmDialog
                description="这个动作只用于演示反馈，不会真正发起请求。"
                onConfirm={() => {
                  toast.success("已确认发布");
                  setBasicOpen(false);
                }}
                open={basicOpen}
                setOpen={setBasicOpen}
                title="确认发布到生产环境？"
              />
            </>
          ),
          description: "标准确认场景只保留一个问题和一个结果。",
          title: "基础确认",
        },
        {
          code: `<ConfirmDialog
  open={open}
  setOpen={setOpen}
  title="确认清空全部缓存？"
  actionLabel="立即清空"
/>`,
          content: (
            <>
              <Button onClick={() => setDangerOpen(true)} type="button" variant="destructive">
                危险操作确认
              </Button>
              <ConfirmDialog
                actionLabel="立即清空"
                description="清空后需要重新预热，预计影响 3-5 分钟。"
                onConfirm={() => {
                  toast.success("已提交清空任务");
                  setDangerOpen(false);
                }}
                open={dangerOpen}
                setOpen={setDangerOpen}
                title="确认清空全部缓存？"
              />
            </>
          ),
          description: "危险动作建议强调说明与清晰动作文案。",
          title: "危险动作",
        },
      ]}
      description="ConfirmDialog 用于危险操作的二次确认，语义明确且实现轻量。"
      notes={["只有真正不可逆或高风险操作才需要确认框。", "确认框里不要堆表单，复杂输入改成 FormDialog。"]}
      title="ConfirmDialog"
    />
  );
}

function FormDialogPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  return (
    <ShowcaseDocPage
      apiItems={[
        { description: "是否打开。", name: "open", required: true, type: "boolean" },
        { description: "显隐回调。", name: "onOpenChange", required: true, type: "(open: boolean) => void" },
        { description: "弹窗标题。", name: "title", required: true, type: "ReactNode" },
        { description: "弹窗说明。", name: "description", type: "ReactNode" },
        { description: "弹窗内容。", name: "children", required: true, type: "ReactNode" },
      ]}
      categoryLabel="反馈与浮层"
      demos={[
        {
          code: `<FormDialog open={open} onOpenChange={setOpen} title="新建发布计划">...</FormDialog>`,
          content: (
            <>
              <Button onClick={() => setCreateOpen(true)} type="button" variant="outline">
                打开新建弹窗
              </Button>
              <FormDialog description="这种封装更适合复杂表单。" onOpenChange={setCreateOpen} open={createOpen} title="新建发布计划">
                <div className="grid gap-4">
                  <FormField label="计划名称">
                    <Input placeholder="例如：夜间灰度发布" />
                  </FormField>
                  <FormField label="说明">
                    <Textarea placeholder="补充发布范围与回滚策略" />
                  </FormField>
                  <FormActions>
                    <Button onClick={() => setCreateOpen(false)} type="button" variant="outline">
                      取消
                    </Button>
                    <Button
                      onClick={() => {
                        setCreateOpen(false);
                        toast.success("发布计划已创建");
                      }}
                      type="button"
                    >
                      提交
                    </Button>
                  </FormActions>
                </div>
              </FormDialog>
            </>
          ),
          description: "新增场景通常包含必填字段和底部操作区。",
          title: "基础表单弹窗",
        },
        {
          code: `<FormDialog open={open} onOpenChange={setOpen} title="编辑发布计划">...</FormDialog>`,
          content: (
            <>
              <Button onClick={() => setEditOpen(true)} type="button">
                打开编辑弹窗
              </Button>
              <FormDialog description="示例中展示更完整的字段组合。" onOpenChange={setEditOpen} open={editOpen} title="编辑发布计划">
                <div className="grid gap-4">
                  <FormField label="负责人">
                    <Input defaultValue="张三" />
                  </FormField>
                  <FormField label="发布策略">
                    <Input defaultValue="灰度 20%" />
                  </FormField>
                  <FormField label="补充说明">
                    <Textarea defaultValue="预计 22:30 开始，失败自动回滚。" />
                  </FormField>
                  <FormActions>
                    <Button onClick={() => setEditOpen(false)} type="button" variant="outline">
                      取消
                    </Button>
                    <Button
                      onClick={() => {
                        setEditOpen(false);
                        toast.success("配置已更新");
                      }}
                      type="button"
                    >
                      保存修改
                    </Button>
                  </FormActions>
                </div>
              </FormDialog>
            </>
          ),
          description: "编辑场景通常需要预填值和更清晰的保存语义。",
          title: "编辑场景",
        },
      ]}
      description="FormDialog 是表单弹窗封装，适合新增、编辑和轻量配置流程。"
      notes={["对话框内主要是表单时优先用 FormDialog。", "表单字段过多时应该跳转独立页面，而不是无限拉长弹窗。"]}
      title="FormDialog"
    />
  );
}

function DialogPage() {
  const [basicOpen, setBasicOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);

  return (
    <ShowcaseDocPage
      apiItems={[
        { description: "弹窗根节点。", name: "Dialog", type: "Radix Root" },
        { description: "弹窗内容容器。", name: "DialogContent", type: "Radix Content wrapper" },
        { description: "标题区容器。", name: "DialogHeader", type: "div" },
        { description: "弹窗标题。", name: "DialogTitle", type: "Radix Title wrapper" },
        { description: "弹窗描述。", name: "DialogDescription", type: "Radix Description wrapper" },
      ]}
      categoryLabel="反馈与浮层"
      demos={[
        {
          code: `<Dialog onOpenChange={setOpen} open={open}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>基础 Dialog</DialogTitle>
    </DialogHeader>
  </DialogContent>
</Dialog>`,
          content: (
            <>
              <Button onClick={() => setBasicOpen(true)} type="button" variant="secondary">
                打开基础 Dialog
              </Button>
              <Dialog onOpenChange={setBasicOpen} open={basicOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>基础 Dialog</DialogTitle>
                    <DialogDescription>更灵活，适合完全自定义内容。</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 text-sm leading-7 text-muted-foreground">
                    <p>如果某个业务页不适合直接用 FormDialog，可以退回基础 Dialog 自己拼。</p>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          ),
          description: "最小结构：标题、描述、内容区。",
          title: "基础结构",
        },
        {
          code: `<Dialog onOpenChange={setOpen} open={open}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>发布结果</DialogTitle>
    </DialogHeader>
    <InlineNotice type="success" />
    <RowActions>...</RowActions>
  </DialogContent>
</Dialog>`,
          content: (
            <>
              <Button onClick={() => setCustomOpen(true)} type="button" variant="outline">
                打开组合弹窗
              </Button>
              <Dialog onOpenChange={setCustomOpen} open={customOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>发布结果</DialogTitle>
                    <DialogDescription>这是一个组合内容示例。</DialogDescription>
                  </DialogHeader>
                  <InlineNotice effect="solid" title="发布成功" type="success">
                    3 台实例均已完成灰度，未检测到错误率抬升。
                  </InlineNotice>
                  <RowActions>
                    <Button onClick={() => setCustomOpen(false)} type="button" variant="outline">
                      稍后处理
                    </Button>
                    <Button
                      onClick={() => {
                        setCustomOpen(false);
                        toast.success("已进入详情页");
                      }}
                      type="button"
                    >
                      查看详情
                    </Button>
                  </RowActions>
                </DialogContent>
              </Dialog>
            </>
          ),
          description: "当弹窗需要多组件拼装时，Dialog 是最直接的承载容器。",
          title: "组合场景",
        },
      ]}
      description="基础 Dialog 提供最自由的弹层容器，适合完全自定义内容结构。"
      notes={["当 ConfirmDialog 和 FormDialog 都不合适时，再退回 Dialog。", "弹层内部信息量过大时，优先独立页面而不是无限加内容。"]}
      title="Dialog"
    />
  );
}

function TooltipPage() {
  return (
    <ShowcaseDocPage
      apiItems={[
        { description: "提示容器。", name: "Tooltip", type: "Radix Root" },
        { description: "触发器，通常配合 asChild。", name: "TooltipTrigger", type: "Radix Trigger" },
        { description: "提示内容。", name: "TooltipContent", type: "Radix Content" },
        { defaultValue: "6", description: "触发器与浮层的默认间距。", name: "sideOffset", type: "number" },
      ]}
      categoryLabel="反馈与浮层"
      demos={[
        {
          code: `<Tooltip>
  <TooltipTrigger asChild><Button variant="outline">Hover</Button></TooltipTrigger>
  <TooltipContent>查看额外说明</TooltipContent>
</Tooltip>`,
          content: (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="outline">
                    Hover 查看提示
                  </Button>
                </TooltipTrigger>
                <TooltipContent>这里适合放精简说明。</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ),
          description: "最常见场景：为按钮补充一行短说明。",
          title: "基础提示",
        },
        {
          code: `<div className="flex gap-3">
  <Tooltip><TooltipTrigger asChild><Button variant="secondary">状态说明</Button></TooltipTrigger><TooltipContent>灰度进行中</TooltipContent></Tooltip>
  <Tooltip><TooltipTrigger asChild><Button variant="destructive">风险项</Button></TooltipTrigger><TooltipContent>会重启实例</TooltipContent></Tooltip>
</div>`,
          content: (
            <TooltipProvider>
              <div className="flex flex-wrap gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" variant="secondary">
                      状态说明
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>当前灰度进行中，预计 3 分钟完成。</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" variant="destructive">
                      风险项
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>该操作会触发实例重启。</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          ),
          description: "同一块区域可以并列多个 Tooltip，但每条信息保持单行语义。",
          title: "状态提示",
        },
      ]}
      description="Tooltip 用来补充极简说明，不适合承载复杂业务规则。"
      notes={["Tooltip 内容必须简短，长文案会打断阅读。", "移动端依赖 Tooltip 的关键信息是错误设计。"]}
      title="Tooltip"
    />
  );
}

function DropdownMenuPage() {
  return (
    <ShowcaseDocPage
      apiItems={[
        { description: "菜单容器。", name: "DropdownMenu", type: "Radix Root" },
        { description: "触发器，通常配合 asChild。", name: "DropdownMenuTrigger", type: "Radix Trigger" },
        { description: "菜单内容区。", name: "DropdownMenuContent", type: "Radix Content" },
        { description: "菜单项。", name: "DropdownMenuItem", type: "Radix Item" },
        { defaultValue: "8", description: "触发器与菜单的默认间距。", name: "sideOffset", type: "number" },
      ]}
      categoryLabel="反馈与浮层"
      demos={[
        {
          code: `<DropdownMenu>
  <DropdownMenuTrigger asChild><Button>打开菜单</Button></DropdownMenuTrigger>
  <DropdownMenuContent align="start">...</DropdownMenuContent>
</DropdownMenu>`,
          content: (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="secondary">
                  打开菜单
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => toast.success("已复制配置模板")}>复制模板</DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.message("这里可以接更多快捷操作")}>更多操作</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ),
          description: "聚合低频动作，保持主界面克制。",
          title: "基础菜单",
        },
        {
          code: `<DropdownMenu>
  <DropdownMenuTrigger asChild><Button variant="outline">批量操作</Button></DropdownMenuTrigger>
  <DropdownMenuContent align="end">...</DropdownMenuContent>
</DropdownMenu>`,
          content: (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline">
                  批量操作
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => toast.success("已导出 CSV")}>导出结果</DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.message("已加入执行队列")}>加入任务队列</DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.error("需要二次确认后执行")}>批量停用</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ),
          description: "危险项与普通项并存时，用文案和顺序做区分。",
          title: "组合操作",
        },
      ]}
      description="DropdownMenu 适合聚合低频次的辅助操作，让主界面保持克制。"
      notes={["高频主动作不要塞进下拉菜单。", "危险操作要么单独高亮，要么二次确认。"]}
      title="DropdownMenu"
    />
  );
}

function EmptyStatePage() {
  return (
    <ShowcaseDocPage
      apiItems={[
        { defaultValue: '"default"', description: "空态场景。", name: "scene", type: '"default" | "empty" | "search" | "error"' },
        { description: "补充操作。", name: "action", type: "ReactNode" },
      ]}
      categoryLabel="反馈与浮层"
      demos={[
        {
          code: `<EmptyState title="暂无数据" description="当前没有可展示的内容。" />`,
          content: <EmptyState description="当前没有可展示的内容。" title="暂无数据" />,
          description: "默认空态用于首次进入或尚未创建数据。",
          title: "基础空态",
        },
        {
          code: `<div className="grid gap-4">
  <EmptyState scene="search" title="搜索结果为空" />
  <EmptyState scene="error" title="加载失败" />
</div>`,
          content: (
            <div className="grid gap-4">
              <EmptyState
                action={
                  <Button outlined type="button" variant="primary">
                    调整筛选
                  </Button>
                }
                description="你设置的筛选条件没有命中任何发布计划。"
                scene="search"
                title="搜索结果为空"
              />
              <EmptyState description="当前接口请求失败，请检查权限和网络连接。" scene="error" title="加载失败" />
            </div>
          ),
          description: "搜索态和错误态建议分开建模，减少误导。",
          title: "状态空态",
        },
        {
          code: `<div className="grid gap-4">
  <EmptyBlock title="未创建发布计划" />
  <EmptyLogState />
</div>`,
          content: (
            <div className="grid gap-4">
              <EmptyBlock
                action={
                  <Button type="button" variant="outline">
                    立即创建
                  </Button>
                }
                description="当前环境还没有任何发布计划。"
                title="未创建发布计划"
              />
              <EmptyLogState description="任务尚未开始执行，因此没有产生任何日志。" />
            </div>
          ),
          description: "用于卡片区块和日志区域的专用空态。",
          title: "完整布局",
        },
      ]}
      description="EmptyState、EmptyBlock 和 EmptyLogState 用于统一页面空态和无日志态的表达。"
      notes={["空态应该明确告诉用户当前为什么为空。", "空态除了默认态，还应覆盖搜索空态和异常空态。"]}
      title="EmptyState"
    />
  );
}

function SkeletonPage() {
  return (
    <ShowcaseDocPage
      apiItems={[
        { defaultValue: '"rect"', description: "骨架形态。", name: "variant", type: '"rect" | "circle" | "text"' },
        { defaultValue: "true", description: "是否播放脉冲动画。", name: "animated", type: "boolean" },
      ]}
      categoryLabel="反馈与浮层"
      demos={[
        {
          code: `<div className="grid gap-3">
  <Skeleton className="h-10 w-32" />
  <Skeleton className="w-64" variant="text" />
</div>`,
          content: (
            <div className="grid gap-3">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="w-64" variant="text" />
            </div>
          ),
          description: "标题与短文本骨架的最小组合。",
          title: "基础骨架",
        },
        {
          code: `<div className="grid gap-3 rounded-2xl border p-4">
  <Skeleton className="h-12 w-12" variant="circle" />
  <Skeleton className="h-20 w-full" />
</div>`,
          content: (
            <div className="grid gap-3 rounded-2xl border border-border/70 p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12" variant="circle" />
                <div className="grid gap-2">
                  <Skeleton className="w-32" variant="text" />
                  <Skeleton className="w-20" variant="text" />
                </div>
              </div>
              <Skeleton className="h-20 w-full" />
            </div>
          ),
          description: "典型卡片加载态，尺寸贴近最终内容。",
          title: "卡片布局",
        },
        {
          code: `<div className="grid gap-2">
  <Skeleton className="h-10 w-full" />
  <Skeleton className="h-10 w-full" />
  <Skeleton animated={false} className="h-10 w-full" />
</div>`,
          content: (
            <div className="grid gap-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton animated={false} className="h-10 w-full" />
            </div>
          ),
          description: "可根据场景切换动效，避免页面闪烁过强。",
          title: "表格行骨架",
        },
      ]}
      description="Skeleton 用于数据加载前的骨架占位，展示文本、卡片和表格等典型骨架形态。"
      notes={["只在异步内容块上使用 Skeleton，不要整页泛滥。", "骨架尺寸要贴近真实内容尺寸。"]}
      title="Skeleton"
    />
  );
}

function ConfirmActionDialogPage() {
  const [basicOpen, setBasicOpen] = useState(false);
  const [riskOpen, setRiskOpen] = useState(false);

  return (
    <ShowcaseDocPage
      apiItems={[
        { description: "是否打开。", name: "open", required: true, type: "boolean" },
        { description: "显隐回调。", name: "setOpen", required: true, type: "(open: boolean) => void" },
        { description: "确认回调。", name: "onConfirm", required: true, type: "() => void | Promise<void>" },
        { defaultValue: '"destructive"', description: "确认按钮类型。", name: "actionVariant", type: 'ButtonProps["variant"]' },
        { description: "自定义确认说明内容。", name: "children", type: "ReactNode" },
      ]}
      categoryLabel="反馈与浮层"
      demos={[
        {
          code: `<ConfirmActionDialog open={open} setOpen={setOpen} title="确认执行批量停用？">...</ConfirmActionDialog>`,
          content: (
            <>
              <Button onClick={() => setBasicOpen(true)} type="button" variant="destructive">
                打开增强确认框
              </Button>
              <ConfirmActionDialog
                description="该操作会停用选中的服务实例，并终止新请求进入。"
                onConfirm={() => {
                  toast.success("已执行批量停用");
                  setBasicOpen(false);
                }}
                open={basicOpen}
                setOpen={setBasicOpen}
                title="确认执行批量停用？"
              >
                <InlineNotice tone="warning" title="影响范围">
                  当前共 3 个实例会被同时停用。
                </InlineNotice>
              </ConfirmActionDialog>
            </>
          ),
          description: "在确认框里嵌入结构化风险信息。",
          title: "风险确认",
        },
        {
          code: `<ConfirmActionDialog
  open={open}
  setOpen={setOpen}
  title="确认回滚版本？"
  actionVariant="outline"
/>`,
          content: (
            <>
              <Button onClick={() => setRiskOpen(true)} type="button" variant="outline">
                打开回滚确认
              </Button>
              <ConfirmActionDialog
                actionVariant="outline"
                description="回滚会恢复到上一稳定版本，但会中断当前灰度。"
                onConfirm={() => {
                  toast.message("已发起回滚任务");
                  setRiskOpen(false);
                }}
                open={riskOpen}
                setOpen={setRiskOpen}
                title="确认回滚版本？"
              >
                <InlineNotice title="执行前检查" type="warning">
                  请确认观察窗口内没有新增告警。
                </InlineNotice>
              </ConfirmActionDialog>
            </>
          ),
          description: "同样结构可复用于非 destructive 的确认动作。",
          title: "自定义动作样式",
        },
      ]}
      description="ConfirmActionDialog 适合比 ConfirmDialog 更复杂的确认场景，可插入自定义内容。"
      notes={["需要展示风险摘要、影响项时优先使用 ConfirmActionDialog。", "如果已经变成完整表单，就应该切回 FormDialog。"]}
      title="ConfirmActionDialog"
    />
  );
}

function DetailDialogPage() {
  const [basicOpen, setBasicOpen] = useState(false);
  const [layoutOpen, setLayoutOpen] = useState(false);

  return (
    <ShowcaseDocPage
      apiItems={[
        { description: "是否打开。", name: "open", required: true, type: "boolean" },
        { description: "显隐回调。", name: "onOpenChange", required: true, type: "(open: boolean) => void" },
        { description: "详情标题。", name: "title", required: true, type: "ReactNode" },
        { description: "详情说明。", name: "description", type: "ReactNode" },
        { description: "详情内容。", name: "children", required: true, type: "ReactNode" },
      ]}
      categoryLabel="反馈与浮层"
      demos={[
        {
          code: `<DetailDialog open={open} onOpenChange={setOpen} title="发布详情">...</DetailDialog>`,
          content: (
            <>
              <Button onClick={() => setBasicOpen(true)} type="button" variant="outline">
                打开详情弹窗
              </Button>
              <DetailDialog description="只读展示一组关键信息。" onOpenChange={setBasicOpen} open={basicOpen} title="发布详情">
                <DetailGrid items={detailItems} />
              </DetailDialog>
            </>
          ),
          description: "只读详情弹窗适合查看对象的核心字段。",
          title: "基础详情",
        },
        {
          code: `<DetailDialog open={open} onOpenChange={setOpen} title="任务详情">
  <div className="grid gap-4">
    <InlineNotice />
    <DetailGrid />
  </div>
</DetailDialog>`,
          content: (
            <>
              <Button onClick={() => setLayoutOpen(true)} type="button">
                打开完整详情
              </Button>
              <DetailDialog
                description="组合提示、键值信息和操作按钮。"
                onOpenChange={setLayoutOpen}
                open={layoutOpen}
                title="任务详情"
              >
                <div className="grid gap-4">
                  <InlineNotice title="当前状态" type="success">
                    任务正在运行中，尚未检测到异常。
                  </InlineNotice>
                  <DetailGrid items={detailItems} />
                  <RowActions>
                    <Button onClick={() => setLayoutOpen(false)} type="button" variant="outline">
                      关闭
                    </Button>
                    <Button onClick={() => toast.success("已复制详情信息")} type="button">
                      复制详情
                    </Button>
                  </RowActions>
                </div>
              </DetailDialog>
            </>
          ),
          description: "详情弹窗也可以承载轻量动作，但不应演变成表单。",
          title: "完整布局",
        },
      ]}
      description="DetailDialog 适合展示只读详情内容，比基础 Dialog 更适合详情面板场景。"
      notes={["只读信息优先用 DetailDialog，而不是用 FormDialog 只是不放表单。", "详情弹窗内容过长时依然要控制信息层级。"]}
      title="DetailDialog"
    />
  );
}

function PopoverPage() {
  return (
    <ShowcaseDocPage
      apiItems={[
        { description: "浮层容器。", name: "Popover", type: "Radix Root" },
        { description: "触发器，通常配合 asChild。", name: "PopoverTrigger", type: "Radix Trigger" },
        { description: "浮层内容。", name: "PopoverContent", type: "Radix Content" },
        { defaultValue: '"start"', description: "默认对齐方式。", name: "align", type: '"start" | "center" | "end"' },
        { defaultValue: "8", description: "触发器与浮层间距。", name: "sideOffset", type: "number" },
      ]}
      categoryLabel="反馈与浮层"
      demos={[
        {
          code: `<Popover>
  <PopoverTrigger asChild><Button variant="outline">打开面板</Button></PopoverTrigger>
  <PopoverContent>...</PopoverContent>
</Popover>`,
          content: (
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline">
                  打开 Popover
                </Button>
              </PopoverTrigger>
              <PopoverContent className="grid gap-3">
                <p className="text-sm font-medium text-foreground">快速操作</p>
                <Input placeholder="输入关键字" />
                <Button type="button">保存筛选</Button>
              </PopoverContent>
            </Popover>
          ),
          description: "最常见的轻量面板模式。",
          title: "基础面板",
        },
        {
          code: `<Popover>
  <PopoverTrigger asChild><Button variant="secondary">批量标签</Button></PopoverTrigger>
  <PopoverContent align="end">...</PopoverContent>
</Popover>`,
          content: (
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="secondary">
                  批量标签
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="grid gap-3">
                <Input placeholder="新增标签" />
                <RowActions>
                  <Button type="button" variant="outline">
                    取消
                  </Button>
                  <Button onClick={() => toast.success("标签已更新")} type="button">
                    保存
                  </Button>
                </RowActions>
              </PopoverContent>
            </Popover>
          ),
          description: "在列表操作区里常见的“输入 + 确认”组合。",
          title: "组合操作",
        },
      ]}
      description="Popover 适合承载轻量面板内容，如筛选补充项、快捷说明或小范围编辑器。"
      notes={["轻量面板优先用 Popover，不要每次都上 Dialog。", "内容复杂度超过一屏时应升级为弹窗或独立页面。"]}
      title="Popover"
    />
  );
}

function ToastViewportPage() {
  return (
    <ShowcaseDocPage
      apiItems={[
        { description: "全局提示容器。", name: "ToastViewport", type: "Sonner Toaster wrapper" },
        { description: "成功提示。", name: "toast.success", type: "(message: string) => void" },
        { description: "失败提示。", name: "toast.error", type: "(message: string) => void" },
        { description: "普通消息。", name: "toast.message", type: "(message: string) => void" },
      ]}
      categoryLabel="反馈与浮层"
      demos={[
        {
          code: `toast.success("保存成功")
toast.error("保存失败")
toast.message("这是普通消息")`,
          content: (
            <div className="grid gap-4">
              <RowActions>
                <Button onClick={() => toast.success("保存成功")} type="button">
                  成功提示
                </Button>
                <Button onClick={() => toast.error("保存失败")} type="button" variant="destructive">
                  失败提示
                </Button>
                <Button onClick={() => toast.message("这是普通消息")} type="button" variant="outline">
                  普通消息
                </Button>
              </RowActions>
              <ToastViewport />
            </div>
          ),
          description: "覆盖成功、失败和普通消息三种常见反馈。",
          title: "基础反馈",
        },
        {
          code: `<RowActions>
  <Button onClick={() => toast.success("计划已创建")}>提交后提示</Button>
  <Button onClick={() => toast.message("任务已加入队列")}>队列提示</Button>
</RowActions>`,
          content: (
            <RowActions>
              <Button onClick={() => toast.success("计划已创建")} type="button">
                提交后提示
              </Button>
              <Button onClick={() => toast.message("任务已加入队列")} type="button" variant="secondary">
                队列提示
              </Button>
            </RowActions>
          ),
          description: "把 toast 当作“动作已受理”的轻量反馈层。",
          title: "组合触发",
        },
      ]}
      description="ToastViewport 与 toast 组合负责全局顶部反馈提示，适合轻量操作结果通知。"
      notes={["轻量成功反馈优先用 toast，不要全部升级成弹窗。", "全局反馈不应该遮挡核心工作流。"]}
      title="ToastViewport"
    />
  );
}

function DrawerPage() {
  const [basicOpen, setBasicOpen] = useState(false);
  const [layoutOpen, setLayoutOpen] = useState(false);

  return (
    <ShowcaseDocPage
      apiItems={[
        { description: "是否打开。", name: "open", required: true, type: "boolean" },
        { description: "显隐变化回调。", name: "onOpenChange", required: true, type: "(open: boolean) => void" },
        { defaultValue: '"侧边抽屉"', description: "屏幕阅读器标题。", name: "title", type: "ReactNode" },
        { description: "屏幕阅读器描述。", name: "description", type: "ReactNode" },
        { description: "抽屉内容。", name: "children", required: true, type: "ReactNode" },
      ]}
      categoryLabel="反馈与浮层"
      demos={[
        {
          code: `<Drawer open={open} onOpenChange={setOpen}>
  <div>移动端抽屉内容</div>
</Drawer>`,
          content: (
            <>
              <Button onClick={() => setBasicOpen(true)} type="button" variant="outline">
                打开基础 Drawer
              </Button>
              <Drawer onOpenChange={setBasicOpen} open={basicOpen}>
                <div className="grid gap-4">
                  <p className="text-base font-semibold text-foreground">移动导航</p>
                  <Button onClick={() => setBasicOpen(false)} type="button" variant="ghost">
                    关闭抽屉
                  </Button>
                </div>
              </Drawer>
            </>
          ),
          description: "抽屉适合移动端单任务流程。",
          title: "基础抽屉",
        },
        {
          code: `<Drawer open={open} onOpenChange={setOpen}>
  <div className="grid gap-3">
    <InlineNotice />
    <Button variant="outline" />
  </div>
</Drawer>`,
          content: (
            <>
              <Button onClick={() => setLayoutOpen(true)} type="button">
                打开完整布局
              </Button>
              <Drawer onOpenChange={setLayoutOpen} open={layoutOpen}>
                <div className="grid gap-4">
                  <InlineNotice title="当前环境" type="info">
                    你正在预发环境操作，变更不会影响生产流量。
                  </InlineNotice>
                  <Button onClick={() => toast.success("已切换到服务列表")} type="button" variant="outline">
                    服务列表
                  </Button>
                  <Button onClick={() => toast.success("已切换到运行日志")} type="button" variant="outline">
                    运行日志
                  </Button>
                  <Button onClick={() => setLayoutOpen(false)} type="button">
                    完成
                  </Button>
                </div>
              </Drawer>
            </>
          ),
          description: "抽屉内可组织导航 + 状态提示的完整布局。",
          title: "完整布局",
        },
      ]}
      description="Drawer 用于移动端侧边抽屉导航或轻量面板，是共享骨架在小屏下的重要组成部分。"
      notes={["Drawer 主要服务移动端，不建议替代桌面端固定侧栏。", "抽屉内容应聚焦导航或单一任务，不要无限堆叠复杂内容。"]}
      title="Drawer"
    />
  );
}

function DialogPrimitivesPage() {
  const [open, setOpen] = useState(false);

  return (
    <ShowcaseDocPage
      apiItems={[
        { description: "触发器。", name: "DialogTrigger", type: "Radix Trigger" },
        { description: "传送门。", name: "DialogPortal", type: "Radix Portal wrapper" },
        { description: "遮罩层。", name: "DialogOverlay", type: "Radix Overlay wrapper" },
        { description: "关闭器。", name: "DialogClose", type: "Radix Close" },
      ]}
      categoryLabel="反馈与浮层"
      demos={[
        {
          code: `<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild><Button>打开</Button></DialogTrigger>
  <DialogPortal>
    <DialogOverlay />
    <DialogContent>...</DialogContent>
  </DialogPortal>
</Dialog>`,
          content: (
            <Dialog onOpenChange={setOpen} open={open}>
              <DialogTrigger asChild>
                <Button type="button">打开低层 Dialog</Button>
              </DialogTrigger>
              <DialogPortal>
                <DialogOverlay />
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>底层 Dialog 结构</DialogTitle>
                    <DialogDescription>这里直接展示 Trigger / Portal / Overlay / Close 的拼装方式。</DialogDescription>
                  </DialogHeader>
                  <div className="text-sm leading-7 text-muted-foreground">
                    如果高层封装不满足需求，可以下沉到这组 primitives。
                  </div>
                  <div className="flex justify-end">
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        关闭
                      </Button>
                    </DialogClose>
                  </div>
                </DialogContent>
              </DialogPortal>
            </Dialog>
          ),
          description: "完整展示 Trigger / Portal / Overlay / Close 的协作方式。",
          title: "基础拼装",
        },
        {
          code: `<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild><Button variant="outline">自定义底部</Button></DialogTrigger>
  <DialogPortal>...</DialogPortal>
</Dialog>`,
          content: (
            <div className="text-sm text-muted-foreground">
              建议仅在高层封装无法覆盖时使用 primitives，常规业务仍优先 ConfirmDialog / FormDialog / DetailDialog。
            </div>
          ),
          description: "第二段强调使用边界，避免业务页过度下沉到底层 API。",
          title: "使用边界",
        },
      ]}
      description="DialogTrigger、DialogPortal、DialogOverlay、DialogClose 是更底层的弹窗拼装能力，适合自定义复杂结构。"
      notes={["只有封装层不够用时才直接下沉到这组 primitives。", "底层能力应服务复杂场景，不应替代标准 Dialog / FormDialog 方案。"]}
      title="Dialog Primitives"
    />
  );
}

export const feedbackRoutes: ShowcaseRoute[] = [
  { component: InlineNoticePage, label: "InlineNotice", path: "/feedback/inline-notice", shortLabel: "MSG", summaryKey: "showcase.route.feedback.inline-notice.summary" },
  { component: EmptyStatePage, label: "EmptyState", path: "/feedback/empty-state", shortLabel: "EMP", summaryKey: "showcase.route.feedback.empty-state.summary" },
  { component: SkeletonPage, label: "Skeleton", path: "/feedback/skeleton", shortLabel: "SKL", summaryKey: "showcase.route.feedback.skeleton.summary" },
  { component: ToastViewportPage, label: "ToastViewport", path: "/feedback/toast-viewport", shortLabel: "TST", summaryKey: "showcase.route.feedback.toast-viewport.summary" },
  { component: ConfirmDialogPage, label: "ConfirmDialog", path: "/feedback/confirm-dialog", shortLabel: "CFM", summaryKey: "showcase.route.feedback.confirm-dialog.summary" },
  { component: ConfirmActionDialogPage, label: "ConfirmActionDialog", path: "/feedback/confirm-action-dialog", shortLabel: "CAD", summaryKey: "showcase.route.feedback.confirm-action-dialog.summary" },
  { component: FormDialogPage, label: "FormDialog", path: "/feedback/form-dialog", shortLabel: "FRM", summaryKey: "showcase.route.feedback.form-dialog.summary" },
  { component: DetailDialogPage, label: "DetailDialog", path: "/feedback/detail-dialog", shortLabel: "DET", summaryKey: "showcase.route.feedback.detail-dialog.summary" },
  { component: DialogPage, label: "Dialog", path: "/feedback/dialog", shortLabel: "DLG", summaryKey: "showcase.route.feedback.dialog.summary" },
  { component: DialogPrimitivesPage, label: "Dialog Primitives", path: "/feedback/dialog-primitives", shortLabel: "DPR", summaryKey: "showcase.route.feedback.dialog-primitives.summary" },
  { component: DrawerPage, label: "Drawer", path: "/feedback/drawer", shortLabel: "DRW", summaryKey: "showcase.route.feedback.drawer.summary" },
  { component: PopoverPage, label: "Popover", path: "/feedback/popover", shortLabel: "POP", summaryKey: "showcase.route.feedback.popover.summary" },
  { component: TooltipPage, label: "Tooltip", path: "/feedback/tooltip", shortLabel: "TIP", summaryKey: "showcase.route.feedback.tooltip.summary" },
  { component: DropdownMenuPage, label: "DropdownMenu", path: "/feedback/dropdown-menu", shortLabel: "MNU", summaryKey: "showcase.route.feedback.dropdown-menu.summary" },
];

export const feedbackCategory: ShowcaseCategory = {
  descriptionKey: "showcase.category.feedback.description",
  key: "feedback",
  labelKey: "showcase.category.feedback.label",
  items: feedbackRoutes,
};
