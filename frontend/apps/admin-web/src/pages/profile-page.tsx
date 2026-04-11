import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toUserFacingErrorMessage } from "@go-admin/api";
import { Avatar, AdminPageStack, AdminTwoColumn, AsyncActionButton, Button, DetailGrid, FormField, Input, PageHeader, SectionCard, Textarea, toast } from "@go-admin/ui-admin";
import type { ImageAsset, InfoResponse, ProfileResponse, UpdateProfilePayload } from "@go-admin/types";

const AVATAR_MAX_SIZE = 25 * 1024 * 1024;
const profileSchema = z.object({
  nickName: z.string().trim().min(1, "请输入显示名").max(128, "显示名不能超过 128 个字符"),
  phone: z.string().max(20, "手机号不能超过 20 个字符"),
  email: z
    .string()
    .max(128, "邮箱不能超过 128 个字符")
    .refine((value) => value.trim() === "" || z.string().email().safeParse(value).success, "邮箱格式不正确"),
  remark: z.string().max(255, "备注不能超过 255 个字符"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

function applyAvatarToInfo(info: InfoResponse | undefined, avatar: ImageAsset) {
  if (!info) {
    return info;
  }
  return {
    ...info,
    avatar,
  };
}

function applyAvatarToProfile(profile: ProfileResponse | undefined, avatar: ImageAsset) {
  if (!profile) {
    return profile;
  }
  return {
    ...profile,
    user: {
      ...profile.user,
      avatar,
    },
  };
}

function applyProfileToInfo(info: InfoResponse | undefined, values: UpdateProfilePayload) {
  if (!info) {
    return info;
  }
  return {
    ...info,
    name: values.nickName,
  };
}

function applyProfileToProfile(profile: ProfileResponse | undefined, values: UpdateProfilePayload) {
  if (!profile) {
    return profile;
  }
  return {
    ...profile,
    user: {
      ...profile.user,
      nickName: values.nickName,
      phone: values.phone,
      email: values.email,
      remark: values.remark,
    },
  };
}

function createProfileFormValues(profile: ProfileResponse): ProfileFormValues {
  return {
    nickName: profile.user.nickName || "",
    phone: profile.user.phone || "",
    email: profile.user.email || "",
    remark: profile.user.remark || "",
  };
}

export function ProfilePage({
  api,
  info,
  profile,
}: {
  api: {
    system: {
      uploadAvatar: (file: File) => Promise<ImageAsset>;
      updateProfile: (payload: UpdateProfilePayload) => Promise<number>;
    };
  };
  info: InfoResponse;
  profile: ProfileResponse;
}) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [avatarOverride, setAvatarOverride] = useState<ImageAsset | null>(null);
  const [uploading, setUploading] = useState(false);
  const form = useForm<ProfileFormValues>({
    defaultValues: createProfileFormValues(profile),
    resolver: zodResolver(profileSchema),
  });
  const saveProfileMutation = useMutation({
    mutationFn: async (values: UpdateProfilePayload) => api.system.updateProfile(values),
    onSuccess: async (_, values) => {
      const nextInfo = applyProfileToInfo(queryClient.getQueryData<InfoResponse>(["admin", "info"]), values);
      const nextProfile = applyProfileToProfile(queryClient.getQueryData<ProfileResponse>(["admin", "profile"]), values);

      queryClient.setQueryData<InfoResponse | undefined>(["admin", "info"], nextInfo);
      queryClient.setQueryData<ProfileResponse | undefined>(["admin", "profile"], nextProfile);

      form.reset({
        nickName: values.nickName,
        phone: values.phone,
        email: values.email,
        remark: values.remark,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "info"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "profile"] }),
      ]);
      toast.success("个人资料已保存");
    },
    onError: (error) => {
      toast.error(toUserFacingErrorMessage(error, "个人资料保存失败"));
    },
  });
  const avatarSource = avatarOverride || profile.user.avatar || info.avatar;
  const displayName = form.watch("nickName") || info.name || profile.user.nickName || info.userName;
  const roleText = profile.roles.map((role) => role.roleName).join(" / ") || info.roles.join(" / ") || "未配置";
  const postText = profile.posts.map((post) => post.postName).join(" / ") || "未配置";

  useEffect(() => {
    form.reset(createProfileFormValues(profile));
  }, [form, profile]);

  function openPicker() {
    if (uploading) {
      return;
    }
    inputRef.current?.click();
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("请选择 JPG、PNG、WebP 等图片文件");
      return;
    }

    if (file.size > AVATAR_MAX_SIZE) {
      toast.error("头像大小不能超过 25 MB");
      return;
    }

    setUploading(true);
    try {
      const nextSource = await api.system.uploadAvatar(file);
      setAvatarOverride(nextSource);
      queryClient.setQueryData<InfoResponse | undefined>(["admin", "info"], (current) => applyAvatarToInfo(current, nextSource));
      queryClient.setQueryData<ProfileResponse | undefined>(["admin", "profile"], (current) => applyAvatarToProfile(current, nextSource));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "info"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "profile"] }),
      ]);
      toast.success("头像已更新");
    } catch (error) {
      toast.error(toUserFacingErrorMessage(error, "头像上传失败"));
    } finally {
      setUploading(false);
    }
  }

  async function handleProfileSubmit(values: ProfileFormValues) {
    await saveProfileMutation.mutateAsync({
      nickName: values.nickName.trim(),
      phone: values.phone.trim(),
      email: values.email.trim(),
      remark: values.remark,
    });
  }

  return (
    <AdminPageStack>
      <PageHeader description="在这里更新昵称、手机号、邮箱和备注，账号归属与权限信息仍由管理员维护。" kicker="个人账号" title="个人中心" />

      <AdminTwoColumn>
        <SectionCard description="上传后会同步刷新侧栏与个人中心展示。" title="头像设置">
          <div className="grid gap-5 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
            <div className="justify-self-start">
              <button
                aria-label={uploading ? "头像上传中" : "更换头像"}
                className="group relative block rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
                disabled={uploading}
                onClick={openPicker}
                type="button"
              >
                <Avatar bordered name={displayName} size={96} src={avatarSource} />
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-950/10 text-white transition-all md:bg-slate-950/0 md:group-hover:bg-slate-950/58 md:group-focus-visible:bg-slate-950/58">
                  <span className="flex flex-col items-center gap-1 rounded-full border border-white/15 bg-slate-950/45 px-3 py-2 backdrop-blur-sm transition-all md:translate-y-1 md:border-white/0 md:bg-white/0 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:border-white/20 md:group-hover:bg-slate-950/24 md:group-hover:opacity-100 md:group-focus-visible:translate-y-0 md:group-focus-visible:border-white/20 md:group-focus-visible:bg-slate-950/24 md:group-focus-visible:opacity-100">
                    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <path
                        d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.086a1.5 1.5 0 0 0 1.06-.44l.708-.706A1.5 1.5 0 0 1 10.414 4h3.172a1.5 1.5 0 0 1 1.06.44l.708.706a1.5 1.5 0 0 0 1.06.44H17.5A2.5 2.5 0 0 1 20 8.5v7A2.5 2.5 0 0 1 17.5 18h-11A2.5 2.5 0 0 1 4 15.5v-7Z"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.7"
                      />
                      <circle cx="12" cy="12" r="3.25" stroke="currentColor" strokeWidth="1.7" />
                    </svg>
                    <span className="text-[11px] font-semibold leading-none">{uploading ? "上传中" : "更换头像"}</span>
                  </span>
                </span>
              </button>
            </div>
            <div className="grid gap-3">
              <div className="grid gap-1">
                <div className="text-base font-semibold text-foreground">{displayName}</div>
                <div className="text-sm text-muted-foreground">建议使用正方形 JPG / PNG / WebP / GIF 图片，大小不超过 25 MB。</div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <input accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" onChange={handleFileChange} ref={inputRef} type="file" />
                <span className="text-xs text-muted-foreground">支持 JPG、PNG、WebP、GIF，图片大小不超过 25 MB。</span>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard description="昵称会同步到侧栏和个人中心展示，手机号、邮箱和备注支持自助维护。" title="基本资料">
          <form className="grid gap-4" onSubmit={form.handleSubmit(handleProfileSubmit)}>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField error={form.formState.errors.nickName?.message} label="显示名" required>
                <Input {...form.register("nickName")} placeholder="请输入显示名" />
              </FormField>
              <FormField error={form.formState.errors.phone?.message} label="手机号">
                <Input {...form.register("phone")} placeholder="请输入手机号" />
              </FormField>
              <FormField error={form.formState.errors.email?.message} label="邮箱">
                <Input {...form.register("email")} placeholder="请输入邮箱" type="email" />
              </FormField>
              <div className="hidden md:block" />
            </div>
            <FormField error={form.formState.errors.remark?.message} label="备注">
              <Textarea {...form.register("remark")} placeholder="可填写个人备注" rows={4} />
            </FormField>
            <div className="flex flex-wrap items-center gap-3">
              <AsyncActionButton loading={saveProfileMutation.isPending} type="submit">
                保存资料
              </AsyncActionButton>
              <Button
                disabled={saveProfileMutation.isPending || !form.formState.isDirty}
                onClick={() => form.reset(createProfileFormValues(profile))}
                type="button"
                variant="outline"
              >
                恢复当前资料
              </Button>
            </div>
          </form>
        </SectionCard>
      </AdminTwoColumn>

      <SectionCard description="这些字段由系统组织架构和权限配置决定，个人中心仅展示当前结果。" title="账号与组织信息">
        <DetailGrid
          items={[
            { label: "用户名", value: info.userName },
            { label: "角色", value: roleText },
            { label: "部门 ID", value: String(profile.user.deptId || info.deptId || "未配置") },
            { label: "岗位", value: postText },
          ]}
        />
      </SectionCard>
    </AdminPageStack>
  );
}
