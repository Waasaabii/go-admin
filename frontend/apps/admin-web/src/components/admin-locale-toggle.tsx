import { useI18n } from "@go-admin/i18n";

import { Button } from "@go-admin/ui-admin";

export function AdminLocaleToggle() {
  const { locale, setLocale, t } = useI18n();

  return (
    <Button
      aria-label={t("admin.shell.localeAria")}
      className="admin-locale-toggle"
      onClick={() => setLocale(locale === "zh-CN" ? "en-US" : "zh-CN")}
      size="sm"
      type="button"
      variant="outline"
    >
      {t("admin.language.switch")}
    </Button>
  );
}
