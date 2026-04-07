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

type LoginPageProps = {
  tenantCode: string;
  onSubmit: (values: LoginFormValues & { uuid?: string }) => Promise<void>;
  getCaptcha: () => Promise<{ image: string; uuid: string }>;
};

export function LoginPage({ tenantCode, onSubmit, getCaptcha }: LoginPageProps) {
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
    <div className="auth-layout">
      <section className="auth-card">
        <small className="auth-kicker">Tenant {tenantCode}</small>
        <h1>后台管理切换到现代工作台</h1>
        <p>
          新前端先复用现有登录、权限和动态菜单链路，把后台改造成 React + Vite
          的独立运营台。
        </p>
        <form
          className="auth-form"
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
            <input {...form.register("username")} placeholder="请输入后台账号" />
            <em>{form.formState.errors.username?.message}</em>
          </label>
          <label>
            <span>密码</span>
            <input {...form.register("password")} placeholder="请输入密码" type="password" />
            <em>{form.formState.errors.password?.message}</em>
          </label>
          <label>
            <span>验证码</span>
            <div className="auth-captcha">
              <input {...form.register("code")} placeholder="开发环境可留空" />
              {captchaImage ? (
                <button className="captcha-preview" onClick={() => void refreshCaptcha()} type="button">
                  <img alt="captcha" src={captchaImage} />
                </button>
              ) : (
                <button className="captcha-preview ghost" onClick={() => void refreshCaptcha()} type="button">
                  刷新验证码
                </button>
              )}
            </div>
          </label>
          {errorMessage ? <div className="auth-error">{errorMessage}</div> : null}
          <button className="primary-action" disabled={submitting} type="submit">
            {submitting ? "正在进入工作台..." : "进入后台"}
          </button>
        </form>
      </section>
    </div>
  );
}
