import { useEffect, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

const loginSchema = z.object({
  username: z.string().min(1, "请输入账号"),
  password: z.string().min(1, "请输入密码"),
  code: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage({
  getCaptcha,
  onSubmit,
  tenantCode,
}: {
  getCaptcha: () => Promise<{ image: string; uuid: string }>;
  onSubmit: (values: LoginFormValues & { uuid?: string }) => Promise<void>;
  tenantCode: string;
}) {
  const [captchaImage, setCaptchaImage] = useState("");
  const [captchaId, setCaptchaId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<LoginFormValues>({
    defaultValues: {
      username: "admin",
      password: "123456",
      code: "",
    },
    resolver: zodResolver(loginSchema),
  });

  async function refreshCaptcha() {
    try {
      const captcha = await getCaptcha();
      setCaptchaImage(captcha.image);
      setCaptchaId(captcha.uuid);
    } catch {
      setCaptchaImage("");
      setCaptchaId("");
    }
  }

  useEffect(() => {
    void refreshCaptcha();
  }, []);

  return (
    <div className="mobile-auth">
      <section className="mobile-auth-card">
        <small>Tenant {tenantCode}</small>
        <h1>把用户端迁到新的移动应用</h1>
        <p>第一阶段先共用现有登录体系，确保租户识别、认证恢复和移动端页面壳稳定运行。</p>
        <form
          className="mobile-auth-form"
          onSubmit={form.handleSubmit(async (values) => {
            setSubmitting(true);
            setErrorMessage("");
            try {
              await onSubmit({
                ...values,
                uuid: captchaId || undefined,
              });
            } catch (error) {
              setErrorMessage(error instanceof Error ? error.message : "登录失败");
              await refreshCaptcha();
            } finally {
              setSubmitting(false);
            }
          })}
        >
          <label>
            <span>账号</span>
            <input {...form.register("username")} placeholder="请输入移动端账号" />
          </label>
          <label>
            <span>密码</span>
            <input {...form.register("password")} placeholder="请输入密码" type="password" />
          </label>
          <label>
            <span>验证码</span>
            <div className="mobile-auth-captcha">
              <input {...form.register("code")} placeholder="开发环境可留空" />
              {captchaImage ? (
                <button className="mobile-auth-preview" onClick={() => void refreshCaptcha()} type="button">
                  <img alt="captcha" src={captchaImage} />
                </button>
              ) : (
                <button className="mobile-auth-preview" onClick={() => void refreshCaptcha()} type="button">
                  刷新
                </button>
              )}
            </div>
          </label>
          {errorMessage ? <div className="mobile-auth-error">{errorMessage}</div> : null}
          <button className="mobile-primary" disabled={submitting} type="submit">
            {submitting ? "正在进入..." : "进入移动端"}
          </button>
        </form>
      </section>
    </div>
  );
}
