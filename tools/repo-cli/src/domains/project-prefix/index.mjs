import { removeProfile, saveProfile } from "../runtime/state.mjs";
import { normalizeProjectPrefix } from "../runtime/context.mjs";

export function setProjectPrefix(context, next, reset) {
  if (reset) {
    removeProfile(context);
    console.log(`已清除本地项目前缀覆盖，恢复默认值：${normalizeProjectPrefix(context.packageName)}`);
    return;
  }
  const prefix = normalizeProjectPrefix(next);
  saveProfile(context, prefix);
  console.log(`已设置本地默认项目前缀：${prefix}`);
  console.log("后续未显式传入 --project-prefix 时将默认使用该值");
}
