import { DayPicker, type DateRange as DayPickerDateRange, type Matcher } from "react-day-picker";
import { enUS, zhCN } from "react-day-picker/locale";
import { CalendarDays, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X } from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState, type ButtonHTMLAttributes, type KeyboardEvent } from "react";

import { Popover, PopoverAnchor, PopoverContent } from "./overlays";
import { cn } from "../lib/utils";
import { controlSizeClasses, type ControlSize, type ControlStatus } from "./shared";

type DateLike = Date | number | string;
type CloseAction = "cancel" | "clear" | "confirm" | "outside";
type PanelKind = "end" | "single" | "start";
type PickerLocale = "en-US" | "zh-CN";
type PanelViewMode = "date" | "month" | "year";

const DEFAULT_FORMAT = "YYYY-MM-DD";
const DEFAULT_RANGE_SEPARATOR = "-";

const FORMAT_TOKENS = ["YYYY", "MM", "DD", "HH", "mm", "ss", "M", "D", "H", "m", "s"] as const;
const TOKEN_REGEX: Record<(typeof FORMAT_TOKENS)[number], string> = {
  YYYY: "(\\d{4})",
  MM: "(\\d{2})",
  DD: "(\\d{2})",
  HH: "(\\d{2})",
  mm: "(\\d{2})",
  ss: "(\\d{2})",
  M: "(\\d{1,2})",
  D: "(\\d{1,2})",
  H: "(\\d{1,2})",
  m: "(\\d{1,2})",
  s: "(\\d{1,2})",
};

const PICKER_TEXT = {
  "en-US": {
    cancel: "Cancel",
    clear: "Clear date",
    confirm: "OK",
    datePlaceholder: "Select date",
    endPlaceholder: "End date",
    monthPanelLabel: "Choose month",
    monthsLong: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    nextDecadeLabel: "Next decade",
    nextMonthLabel: "Next month",
    nextYearLabel: "Next year",
    openCalendar: "Open calendar",
    prevDecadeLabel: "Previous decade",
    prevMonthLabel: "Previous month",
    prevYearLabel: "Previous year",
    startPlaceholder: "Start date",
    weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    yearPanelLabel: "Choose year",
  },
  "zh-CN": {
    cancel: "取消",
    clear: "清空日期",
    confirm: "确定",
    datePlaceholder: "请选择日期",
    endPlaceholder: "结束日期",
    monthPanelLabel: "切换月份面板",
    monthsLong: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
    monthsShort: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
    nextDecadeLabel: "下一年代",
    nextMonthLabel: "下个月",
    nextYearLabel: "下一年",
    openCalendar: "打开日期面板",
    prevDecadeLabel: "上一年代",
    prevMonthLabel: "上个月",
    prevYearLabel: "上一年",
    startPlaceholder: "开始日期",
    weekdays: ["日", "一", "二", "三", "四", "五", "六"],
    yearPanelLabel: "切换年份面板",
  },
} as const;

export type DatePickerModelValue = DateLike | undefined;
export type DateRangePickerValue = [DateLike | undefined, DateLike | undefined] | undefined;

export type DatePickerPanelChangeEvent = {
  month: Date;
  panel: PanelKind;
};

export type DateShortcut<TValue> = {
  text: string;
  value: TValue | (() => TValue);
};

export type DatePickerRef = {
  blur: () => void;
  focus: () => void;
  handleClose: () => void;
  handleOpen: () => void;
};

type PickerBaseProps = {
  automaticDropdown?: boolean;
  className?: string;
  clearable?: boolean;
  disabled?: boolean;
  disabledDate?: Matcher | Matcher[];
  editable?: boolean;
  format?: string;
  onClear?: () => void;
  onPanelChange?: (event: DatePickerPanelChangeEvent) => void;
  onVisibleChange?: (visible: boolean) => void;
  placeholder?: string;
  popoverClassName?: string;
  readonly?: boolean;
  showConfirm?: boolean;
  showFooter?: boolean;
  shortcuts?: DateShortcut<unknown>[];
  size?: ControlSize;
  status?: ControlStatus;
  valueFormat?: string;
};

export type DatePickerProps = PickerBaseProps & {
  defaultTime?: DateLike;
  defaultValue?: DateLike;
  onChange?: (value?: DatePickerModelValue) => void;
  value?: DatePickerModelValue;
};

export type DateRangePickerProps = Omit<PickerBaseProps, "placeholder" | "shortcuts"> & {
  defaultTime?: [DateLike | undefined, DateLike | undefined];
  defaultValue?: [DateLike | undefined, DateLike | undefined];
  endPlaceholder?: string;
  onCalendarChange?: (value?: DateRangePickerValue) => void;
  onChange?: (value?: DateRangePickerValue) => void;
  rangeSeparator?: string;
  shortcuts?: DateShortcut<[DateLike | undefined, DateLike | undefined]>[];
  startPlaceholder?: string;
  unlinkPanels?: boolean;
  value?: DateRangePickerValue;
};

function addMonths(value: Date, offset: number) {
  return new Date(value.getFullYear(), value.getMonth() + offset, 1);
}

function addYears(value: Date, offset: number) {
  return new Date(value.getFullYear() + offset, value.getMonth(), 1);
}

function startOfMonth(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

function setMonthOfDate(value: Date, monthIndex: number) {
  return new Date(value.getFullYear(), monthIndex, 1);
}

function setYearOfDate(value: Date, year: number) {
  return new Date(year, value.getMonth(), 1);
}

function getYearPanelStart(value: Date) {
  return Math.floor(value.getFullYear() / 10) * 10;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatDateValue(value: Date, format: string) {
  if (format === "x") {
    return String(value.getTime());
  }

  if (format === "X") {
    return String(Math.floor(value.getTime() / 1000));
  }

  const replacements: Record<(typeof FORMAT_TOKENS)[number], string> = {
    YYYY: String(value.getFullYear()),
    MM: String(value.getMonth() + 1).padStart(2, "0"),
    DD: String(value.getDate()).padStart(2, "0"),
    HH: String(value.getHours()).padStart(2, "0"),
    mm: String(value.getMinutes()).padStart(2, "0"),
    ss: String(value.getSeconds()).padStart(2, "0"),
    M: String(value.getMonth() + 1),
    D: String(value.getDate()),
    H: String(value.getHours()),
    m: String(value.getMinutes()),
    s: String(value.getSeconds()),
  };

  return FORMAT_TOKENS.reduce((result, token) => result.replaceAll(token, replacements[token]), format);
}

function parseDateValue(value: string, format: string) {
  const source = value.trim();
  if (!source) {
    return undefined;
  }

  if (format === "x" || format === "X") {
    const numeric = Number(source);
    if (Number.isNaN(numeric)) {
      return undefined;
    }
    const date = new Date(format === "X" ? numeric * 1000 : numeric);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  const tokens: string[] = [];
  let pattern = "^";
  let cursor = 0;

  while (cursor < format.length) {
    const token = FORMAT_TOKENS.find((item) => format.startsWith(item, cursor));
    if (token) {
      tokens.push(token);
      pattern += TOKEN_REGEX[token];
      cursor += token.length;
      continue;
    }
    pattern += escapeRegex(format[cursor]);
    cursor += 1;
  }

  pattern += "$";
  const match = new RegExp(pattern).exec(source);
  if (!match) {
    const fallback = new Date(source);
    return Number.isNaN(fallback.getTime()) ? undefined : fallback;
  }

  let year = 1970;
  let month = 1;
  let day = 1;
  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  tokens.forEach((token, index) => {
    const segment = Number(match[index + 1]);
    switch (token) {
      case "YYYY":
        year = segment;
        break;
      case "MM":
      case "M":
        month = segment;
        break;
      case "DD":
      case "D":
        day = segment;
        break;
      case "HH":
      case "H":
        hours = segment;
        break;
      case "mm":
      case "m":
        minutes = segment;
        break;
      case "ss":
      case "s":
        seconds = segment;
        break;
      default:
        break;
    }
  });

  const date = new Date(year, month - 1, day, hours, minutes, seconds, 0);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hours ||
    date.getMinutes() !== minutes ||
    date.getSeconds() !== seconds
  ) {
    return undefined;
  }

  return date;
}

function normalizeDateValue(value: DateLike | undefined, format?: string) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : new Date(value.getTime());
  }

  if (typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  if (typeof value === "string" && format) {
    return parseDateValue(value, format);
  }

  if (typeof value === "string") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  return typeof value === "string" && format ? parseDateValue(value, format) : undefined;
}

function hasTimeTokens(format: string) {
  return /H|m|s/.test(format);
}

function applyTimeParts(target: Date, source?: DateLike) {
  if (!source) {
    return target;
  }

  const resolved = normalizeDateValue(source);
  if (!resolved) {
    return target;
  }

  const next = new Date(target.getTime());
  next.setHours(resolved.getHours(), resolved.getMinutes(), resolved.getSeconds(), resolved.getMilliseconds());
  return next;
}

function applyDateDefaults(value: Date, defaultTime: DateLike | undefined, format: string) {
  if (hasTimeTokens(format)) {
    return value;
  }

  return applyTimeParts(value, defaultTime);
}

function isSameDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
}

function matchesDisabled(date: Date, matcher?: Matcher | Matcher[]): boolean {
  if (!matcher) {
    return false;
  }

  if (Array.isArray(matcher)) {
    return matcher.some((item) => matchesDisabled(date, item));
  }

  if (typeof matcher === "boolean") {
    return matcher;
  }

  if (matcher instanceof Date) {
    return isSameDay(date, matcher);
  }

  if (typeof matcher === "function") {
    return matcher(date);
  }

  if ("before" in matcher && matcher.before && date < matcher.before) {
    return true;
  }

  if ("after" in matcher && matcher.after && date > matcher.after) {
    return true;
  }

  if ("from" in matcher && "to" in matcher && matcher.from && matcher.to && date >= matcher.from && date <= matcher.to) {
    return true;
  }

  if ("dayOfWeek" in matcher && Array.isArray(matcher.dayOfWeek)) {
    return matcher.dayOfWeek.includes(date.getDay());
  }

  return false;
}

function formatForInput(value: Date | undefined, format: string) {
  return value ? formatDateValue(value, format) : "";
}

function getInitialMonth(value: Date | undefined, fallback?: DateLike) {
  const resolved = value ?? normalizeDateValue(fallback);
  if (resolved) {
    return new Date(resolved.getFullYear(), resolved.getMonth(), 1);
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function emitDateValue(value: Date | undefined, valueFormat?: string, currentValue?: DateLike) {
  if (!value) {
    return undefined;
  }

  if (!valueFormat) {
    return value;
  }

  const formatted = formatDateValue(value, valueFormat);
  if ((valueFormat === "x" || valueFormat === "X") && typeof currentValue === "number") {
    return Number(formatted);
  }
  return formatted;
}

function emitRangeValue(value: [Date | undefined, Date | undefined], valueFormat?: string, currentValue?: DateRangePickerValue) {
  if (!value[0] || !value[1]) {
    return undefined;
  }

  return [
    emitDateValue(value[0], valueFormat, currentValue?.[0]),
    emitDateValue(value[1], valueFormat, currentValue?.[1]),
  ] as [DateLike, DateLike];
}

function emitDraftRangeValue(value: [Date | undefined, Date | undefined], valueFormat?: string, currentValue?: DateRangePickerValue) {
  if (!value[0] && !value[1]) {
    return undefined;
  }

  return [
    emitDateValue(value[0], valueFormat, currentValue?.[0]),
    emitDateValue(value[1], valueFormat, currentValue?.[1]),
  ] as [DateLike | undefined, DateLike | undefined];
}

function normalizePickerLocale(value?: string | null): PickerLocale {
  const normalized = value?.trim().toLowerCase() ?? "";
  return normalized.startsWith("en") ? "en-US" : "zh-CN";
}

function resolveCurrentLocale() {
  if (typeof document !== "undefined") {
    const documentLocale = document.documentElement.lang;
    if (documentLocale) {
      return normalizePickerLocale(documentLocale);
    }
  }

  if (typeof navigator !== "undefined") {
    return normalizePickerLocale(navigator.language);
  }

  return "zh-CN";
}

function usePickerLocale() {
  const [locale, setLocale] = useState<PickerLocale>(() => resolveCurrentLocale());

  useEffect(() => {
    if (typeof document === "undefined" || typeof MutationObserver === "undefined") {
      return;
    }

    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      setLocale(resolveCurrentLocale());
    });

    observer.observe(root, { attributeFilter: ["lang"], attributes: true });
    return () => observer.disconnect();
  }, []);

  return {
    dayPickerLocale: locale === "en-US" ? enUS : zhCN,
    locale,
    text: PICKER_TEXT[locale],
  };
}

function getInputShellClass(size: ControlSize, status: ControlStatus, hasClear: boolean) {
  return cn(
    "ui-admin-field-surface relative flex w-full items-center text-foreground transition-colors",
    controlSizeClasses[size],
    status === "error"
      ? "border-destructive/60 focus-within:border-destructive focus-within:ring-1 focus-within:ring-destructive/15"
      : "border-input hover:border-muted-foreground/60 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/15",
    hasClear ? "pr-16" : "pr-10",
  );
}

function getRangeInputShellClass(size: ControlSize, status: ControlStatus, hasClear: boolean) {
  return cn(
    "ui-admin-field-surface relative grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] items-center gap-1 text-foreground transition-colors",
    controlSizeClasses[size],
    status === "error"
      ? "border-destructive/60 focus-within:border-destructive focus-within:ring-1 focus-within:ring-destructive/15"
      : "border-input hover:border-muted-foreground/60 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/15",
    hasClear ? "pr-9" : "pr-1",
  );
}

function getInputClass(size: ControlSize, editable: boolean) {
  return cn(
    "min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
    controlSizeClasses[size],
    size === "large" || size === "lg" ? "px-4" : "px-3",
    !editable && "cursor-pointer",
  );
}

function PopoverActionButton({
  children,
  primary = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { primary?: boolean }) {
  return (
    <button
      className={cn(
        "ui-admin-field-surface inline-flex h-8 items-center justify-center px-4 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        primary
          ? "border-primary bg-primary text-primary-foreground hover:border-primary/90 hover:bg-primary/92"
          : "bg-[var(--ui-admin-surface-field)] text-foreground hover:border-primary hover:text-primary",
      )}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}

function ShortcutList<TValue>({
  items,
  onSelect,
}: {
  items: DateShortcut<TValue>[];
  onSelect: (value: TValue) => void;
}) {
  return (
    <div className="ui-date-picker-shortcuts">
      {items.map((item) => (
        <button
          className="ui-date-picker-shortcut"
          key={item.text}
          onClick={() => onSelect(typeof item.value === "function" ? (item.value as () => TValue)() : item.value)}
          type="button"
        >
          {item.text}
        </button>
      ))}
    </div>
  );
}

function PanelIconButton({
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className="ui-date-picker-panel__icon-button" type="button" {...props}>
      {children}
    </button>
  );
}

function PanelModeButton({
  active = false,
  muted = false,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean; muted?: boolean }) {
  return (
    <button
      className={cn("ui-date-picker-panel__mode-button", active && "is-active", muted && "is-muted")}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}

function DateCalendarBody({
  disabled,
  locale,
  localeText,
  mode,
  month,
  onSelect,
  selected,
}: {
  disabled?: Matcher | Matcher[];
  locale: ReturnType<typeof usePickerLocale>["dayPickerLocale"];
  localeText: (typeof PICKER_TEXT)[PickerLocale];
  mode: "range" | "single";
  month: Date;
  onSelect: ((value?: Date) => void) | ((value?: DayPickerDateRange) => void);
  selected?: Date | DayPickerDateRange;
}) {
  return (
    <div className="ui-date-picker-panel__body">
      <DayPicker
        className="ui-date-picker-panel__calendar"
        disabled={disabled}
        fixedWeeks
        formatters={{
          formatWeekdayName: (date) => localeText.weekdays[date.getDay()] ?? "",
        }}
        hideNavigation
        locale={locale}
        mode={mode}
        month={month}
        onSelect={onSelect as never}
        required={false}
        selected={selected as never}
        showOutsideDays
        weekStartsOn={0}
      />
    </div>
  );
}

function CalendarPanel({
  active = false,
  disabled,
  locale,
  localeText,
  mode,
  month,
  onMonthChange,
  onSelect,
  onViewModeChange,
  selected,
  viewMode,
}: {
  active?: boolean;
  disabled?: Matcher | Matcher[];
  locale: ReturnType<typeof usePickerLocale>["dayPickerLocale"];
  localeText: (typeof PICKER_TEXT)[PickerLocale];
  mode: "range" | "single";
  month: Date;
  onMonthChange: (value: Date) => void;
  onSelect: ((value?: Date) => void) | ((value?: DayPickerDateRange) => void);
  onViewModeChange: (value: PanelViewMode) => void;
  selected?: Date | DayPickerDateRange;
  viewMode: PanelViewMode;
}) {
  const yearPanelStart = getYearPanelStart(month);
  const yearItems = Array.from({ length: 12 }, (_, index) => yearPanelStart - 1 + index);

  return (
    <div className={cn("ui-date-picker-panel", active && "is-active")}>
      <div className="ui-date-picker-panel__header">
        <div className="ui-date-picker-panel__nav">
          {viewMode === "date" ? (
            <>
              <PanelIconButton aria-label={localeText.prevYearLabel} onClick={() => onMonthChange(addYears(month, -1))}>
                <ChevronsLeft className="h-4 w-4" />
              </PanelIconButton>
              <PanelIconButton aria-label={localeText.prevMonthLabel} onClick={() => onMonthChange(addMonths(month, -1))}>
                <ChevronLeft className="h-4 w-4" />
              </PanelIconButton>
            </>
          ) : viewMode === "month" ? (
            <PanelIconButton aria-label={localeText.prevYearLabel} onClick={() => onMonthChange(addYears(month, -1))}>
              <ChevronLeft className="h-4 w-4" />
            </PanelIconButton>
          ) : (
            <PanelIconButton aria-label={localeText.prevDecadeLabel} onClick={() => onMonthChange(addYears(month, -10))}>
              <ChevronLeft className="h-4 w-4" />
            </PanelIconButton>
          )}
        </div>
        <div className="ui-date-picker-panel__titles">
          {viewMode === "date" ? (
            <>
              <button
                aria-label={localeText.yearPanelLabel}
                className="ui-date-picker-panel__title"
                onClick={() => onViewModeChange("year")}
                type="button"
              >
                {month.getFullYear()}
              </button>
              <button
                aria-label={localeText.monthPanelLabel}
                className="ui-date-picker-panel__title"
                onClick={() => onViewModeChange("month")}
                type="button"
              >
                {localeText.monthsLong[month.getMonth()]}
              </button>
            </>
          ) : viewMode === "month" ? (
            <span className="ui-date-picker-panel__label">{month.getFullYear()}</span>
          ) : (
            <span className="ui-date-picker-panel__label">{`${yearPanelStart} - ${yearPanelStart + 9}`}</span>
          )}
        </div>
        <div className="ui-date-picker-panel__nav">
          {viewMode === "date" ? (
            <>
              <PanelIconButton aria-label={localeText.nextMonthLabel} onClick={() => onMonthChange(addMonths(month, 1))}>
                <ChevronRight className="h-4 w-4" />
              </PanelIconButton>
              <PanelIconButton aria-label={localeText.nextYearLabel} onClick={() => onMonthChange(addYears(month, 1))}>
                <ChevronsRight className="h-4 w-4" />
              </PanelIconButton>
            </>
          ) : viewMode === "month" ? (
            <PanelIconButton aria-label={localeText.nextYearLabel} onClick={() => onMonthChange(addYears(month, 1))}>
              <ChevronRight className="h-4 w-4" />
            </PanelIconButton>
          ) : (
            <PanelIconButton aria-label={localeText.nextDecadeLabel} onClick={() => onMonthChange(addYears(month, 10))}>
              <ChevronRight className="h-4 w-4" />
            </PanelIconButton>
          )}
        </div>
      </div>

      {viewMode === "date" ? (
        <DateCalendarBody disabled={disabled} locale={locale} localeText={localeText} mode={mode} month={month} onSelect={onSelect} selected={selected} />
      ) : viewMode === "month" ? (
        <div className="ui-date-picker-panel__mode-grid">
          {localeText.monthsShort.map((label, index) => (
            <PanelModeButton
              active={month.getMonth() === index}
              key={label}
              onClick={() => {
                onMonthChange(setMonthOfDate(month, index));
                onViewModeChange("date");
              }}
            >
              {label}
            </PanelModeButton>
          ))}
        </div>
      ) : (
        <div className="ui-date-picker-panel__mode-grid">
          {yearItems.map((year) => (
            <PanelModeButton
              active={month.getFullYear() === year}
              key={year}
              muted={year < yearPanelStart || year > yearPanelStart + 9}
              onClick={() => {
                onMonthChange(setYearOfDate(month, year));
                onViewModeChange("date");
              }}
            >
              {year}
            </PanelModeButton>
          ))}
        </div>
      )}
    </div>
  );
}

export const DatePicker = forwardRef<DatePickerRef, DatePickerProps>(function DatePicker(
  {
    automaticDropdown = true,
    className,
    clearable = true,
    defaultTime,
    defaultValue,
    disabled = false,
    disabledDate,
    editable = true,
    format = DEFAULT_FORMAT,
    onChange,
    onClear,
    onPanelChange,
    onVisibleChange,
    placeholder,
    popoverClassName,
    readonly = false,
    shortcuts = [],
    showConfirm = true,
    showFooter = true,
    size = "default",
    status = "default",
    value,
    valueFormat,
  },
  ref,
) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [draftValue, setDraftValue] = useState<Date | undefined>();
  const [month, setMonth] = useState(() => getInitialMonth(undefined, defaultValue));
  const [viewMode, setViewMode] = useState<PanelViewMode>("date");
  const normalizedValue = useMemo(() => normalizeDateValue(value, valueFormat), [value, valueFormat]);
  const { dayPickerLocale, text } = usePickerLocale();
  const resolvedPlaceholder = placeholder ?? text.datePlaceholder;

  function syncDraftFromCommitted() {
    setDraftValue(normalizedValue);
    setDraftText(formatForInput(normalizedValue, format));
    setMonth(getInitialMonth(normalizedValue, defaultValue));
    setViewMode("date");
  }

  function updateMonth(nextMonth: Date) {
    const resolvedMonth = startOfMonth(nextMonth);
    setMonth(resolvedMonth);
    onPanelChange?.({ month: resolvedMonth, panel: "single" });
  }

  function openPopover() {
    if (disabled) {
      return;
    }
    if (open) {
      return;
    }
    syncDraftFromCommitted();
    setOpen(true);
    onVisibleChange?.(true);
  }

  function closePopover(action: CloseAction) {
    if (!open) {
      return;
    }

    if (action === "outside") {
      commitDraft(false);
      setOpen(false);
      onVisibleChange?.(false);
      return;
    }

    if (action === "cancel") {
      syncDraftFromCommitted();
    }

    setOpen(false);
    onVisibleChange?.(false);
  }

  function commitDraft(closeAfterCommit = true) {
    const trimmed = draftText.trim();
    if (!trimmed) {
      onChange?.(undefined);
      onClear?.();
      if (closeAfterCommit) {
        setOpen(false);
        onVisibleChange?.(false);
      }
      return;
    }

    let parsed = parseDateValue(trimmed, format);
    if (!parsed && draftValue) {
      parsed = draftValue;
    }
    if (!parsed) {
      syncDraftFromCommitted();
      if (closeAfterCommit) {
        setOpen(false);
        onVisibleChange?.(false);
      }
      return;
    }

    const resolved = applyDateDefaults(parsed, defaultTime, format);
    if (matchesDisabled(resolved, disabledDate)) {
      syncDraftFromCommitted();
      if (closeAfterCommit) {
        setOpen(false);
        onVisibleChange?.(false);
      }
      return;
    }

    onChange?.(emitDateValue(resolved, valueFormat, value));
    setDraftValue(resolved);
    setDraftText(formatForInput(resolved, format));
    if (closeAfterCommit) {
      setOpen(false);
      onVisibleChange?.(false);
    }
  }

  function handleSelect(next?: Date) {
    if (!next) {
      return;
    }

    const resolved = applyDateDefaults(next, defaultTime, format);
    setDraftValue(resolved);
    setDraftText(formatForInput(resolved, format));
    onChange?.(emitDateValue(resolved, valueFormat, value));
    setOpen(false);
    onVisibleChange?.(false);
  }

  function handleShortcutSelect(nextValue: unknown) {
    const resolved = applyDateDefaults(normalizeDateValue(nextValue as DateLike, valueFormat) ?? new Date(), defaultTime, format);
    setDraftValue(resolved);
    setDraftText(formatForInput(resolved, format));
    onChange?.(emitDateValue(resolved, valueFormat, value));
    setOpen(false);
    onVisibleChange?.(false);
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      commitDraft(true);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closePopover("cancel");
    }
  }

  useImperativeHandle(ref, () => ({
    blur: () => inputRef.current?.blur(),
    focus: () => inputRef.current?.focus(),
    handleClose: () => closePopover("cancel"),
    handleOpen: () => openPopover(),
  }));

  useEffect(() => {
    if (!open) {
      syncDraftFromCommitted();
    }
  }, [defaultValue, format, normalizedValue, open]);

  return (
    <div className={cn("relative", className)}>
      <Popover
        onOpenChange={(nextOpen) => {
          if (nextOpen) {
            openPopover();
            return;
          }
          closePopover("outside");
        }}
        open={open}
      >
        <PopoverAnchor asChild>
          <div className={getInputShellClass(size, status, clearable && Boolean(normalizedValue))} onClick={() => openPopover()}>
            <input
              className={getInputClass(size, editable && !readonly)}
              disabled={disabled}
              onChange={(event) => setDraftText(event.target.value)}
              onFocus={() => {
                if (automaticDropdown) {
                  openPopover();
                }
              }}
              onKeyDown={handleInputKeyDown}
              placeholder={resolvedPlaceholder}
              readOnly={!editable || readonly}
              ref={inputRef}
              value={open ? draftText : formatForInput(normalizedValue, format)}
            />
            <button
              aria-label={text.openCalendar}
              className="absolute right-2 inline-flex h-7 w-7 items-center justify-center rounded-control text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              onClick={(event) => {
                event.stopPropagation();
                openPopover();
              }}
              type="button"
            >
              <CalendarDays className="h-4 w-4" />
            </button>
          </div>
        </PopoverAnchor>
        <PopoverContent
          align="start"
          className={cn("ui-date-picker-popover w-[min(92vw,322px)] p-0", popoverClassName)}
          onEscapeKeyDown={(event) => {
            event.preventDefault();
            closePopover("cancel");
          }}
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <div className={cn("ui-date-picker-layout", shortcuts.length && "ui-date-picker-layout--with-shortcuts")}>
            {shortcuts.length ? <ShortcutList items={shortcuts as DateShortcut<unknown>[]} onSelect={handleShortcutSelect} /> : null}
            <div className="ui-date-picker-main">
              <CalendarPanel
                disabled={disabledDate}
                locale={dayPickerLocale}
                localeText={text}
                mode="single"
                month={month}
                onMonthChange={updateMonth}
                onSelect={handleSelect}
                onViewModeChange={setViewMode}
                selected={draftValue}
                viewMode={viewMode}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {clearable && normalizedValue && !disabled ? (
        <button
          aria-label={text.clear}
          className="absolute right-9 top-1/2 z-10 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          onClick={(event) => {
            event.stopPropagation();
            onChange?.(undefined);
            onClear?.();
            closePopover("clear");
          }}
          type="button"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
});

export const DateRangePicker = forwardRef<DatePickerRef, DateRangePickerProps>(function DateRangePicker(
  {
    automaticDropdown = true,
    className,
    clearable = true,
    defaultTime,
    defaultValue,
    disabled = false,
    disabledDate,
    editable = true,
    endPlaceholder,
    format = DEFAULT_FORMAT,
    onCalendarChange,
    onChange,
    onClear,
    onPanelChange,
    onVisibleChange,
    popoverClassName,
    rangeSeparator = DEFAULT_RANGE_SEPARATOR,
    readonly = false,
    shortcuts = [],
    showConfirm = true,
    showFooter = true,
    size = "default",
    startPlaceholder,
    status = "default",
    unlinkPanels = false,
    value,
    valueFormat,
  },
  ref,
) {
  const startInputRef = useRef<HTMLInputElement | null>(null);
  const endInputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<"end" | "start">("start");
  const [leftViewMode, setLeftViewMode] = useState<PanelViewMode>("date");
  const [rightViewMode, setRightViewMode] = useState<PanelViewMode>("date");
  const normalizedValue = useMemo<[Date | undefined, Date | undefined]>(
    () => [normalizeDateValue(value?.[0], valueFormat), normalizeDateValue(value?.[1], valueFormat)],
    [value, valueFormat],
  );
  const [draftText, setDraftText] = useState<[string, string]>(["", ""]);
  const [draftValue, setDraftValue] = useState<[Date | undefined, Date | undefined]>([undefined, undefined]);
  const [leftMonth, setLeftMonth] = useState(() => getInitialMonth(undefined, defaultValue?.[0]));
  const [rightMonth, setRightMonth] = useState(() => addMonths(getInitialMonth(undefined, defaultValue?.[0]), 1));
  const { dayPickerLocale, text } = usePickerLocale();
  const resolvedStartPlaceholder = startPlaceholder ?? text.startPlaceholder;
  const resolvedEndPlaceholder = endPlaceholder ?? text.endPlaceholder;

  function syncDraftFromCommitted() {
    setDraftValue(normalizedValue);
    setDraftText([formatForInput(normalizedValue[0], format), formatForInput(normalizedValue[1], format)]);
    const initialLeftMonth = getInitialMonth(normalizedValue[0], defaultValue?.[0]);
    setLeftMonth(initialLeftMonth);
    setRightMonth(
      normalizedValue[1]
        ? getInitialMonth(normalizedValue[1], defaultValue?.[1])
        : unlinkPanels
          ? getInitialMonth(undefined, defaultValue?.[1])
          : addMonths(initialLeftMonth, 1),
    );
    setLeftViewMode("date");
    setRightViewMode("date");
  }

  function updatePanelMonth(panel: "end" | "start", nextMonth: Date) {
    const resolvedMonth = startOfMonth(nextMonth);

    if (panel === "start") {
      setLeftMonth(resolvedMonth);
      onPanelChange?.({ month: resolvedMonth, panel: "start" });
      return;
    }

    setRightMonth(resolvedMonth);
    onPanelChange?.({ month: resolvedMonth, panel: "end" });
  }

  function openPopover() {
    if (disabled) {
      return;
    }
    if (open) {
      return;
    }
    syncDraftFromCommitted();
    setOpen(true);
    onVisibleChange?.(true);
  }

  function closePopover(action: CloseAction) {
    if (!open) {
      return;
    }

    if (action === "outside") {
      commitDraft(false);
      setOpen(false);
      onVisibleChange?.(false);
      return;
    }

    if (action === "cancel") {
      syncDraftFromCommitted();
    }

    setOpen(false);
    onVisibleChange?.(false);
  }

  function normalizeDraftRange(start?: Date, end?: Date) {
    return [
      start ? applyDateDefaults(start, defaultTime?.[0], format) : undefined,
      end ? applyDateDefaults(end, defaultTime?.[1], format) : undefined,
    ] as [Date | undefined, Date | undefined];
  }

  function commitDraft(closeAfterCommit = true) {
    const nextStart = draftText[0].trim() ? parseDateValue(draftText[0], format) : draftValue[0];
    const nextEnd = draftText[1].trim() ? parseDateValue(draftText[1], format) : draftValue[1];
    const resolved = normalizeDraftRange(nextStart, nextEnd);

    if (!resolved[0] && !resolved[1]) {
      onChange?.(undefined);
      onClear?.();
      if (closeAfterCommit) {
        setOpen(false);
        onVisibleChange?.(false);
      }
      return;
    }

    if (!resolved[0] || !resolved[1] || resolved[0] > resolved[1] || matchesDisabled(resolved[0], disabledDate) || matchesDisabled(resolved[1], disabledDate)) {
      syncDraftFromCommitted();
      if (closeAfterCommit) {
        setOpen(false);
        onVisibleChange?.(false);
      }
      return;
    }

    setDraftValue(resolved);
    setDraftText([formatForInput(resolved[0], format), formatForInput(resolved[1], format)]);
    onChange?.(emitRangeValue(resolved, valueFormat, value));
    if (closeAfterCommit) {
      setOpen(false);
      onVisibleChange?.(false);
    }
  }

  function handleRangeSelect(next?: DayPickerDateRange) {
    const resolved = normalizeDraftRange(next?.from, next?.to);
    setDraftValue(resolved);
    setDraftText([formatForInput(resolved[0], format), formatForInput(resolved[1], format)]);
    onCalendarChange?.(emitDraftRangeValue(resolved, valueFormat, value));

    if (resolved[0] && !resolved[1]) {
      setActivePanel("end");
    }

    if (!showConfirm && resolved[0] && resolved[1]) {
      onChange?.(emitRangeValue(resolved, valueFormat, value));
      setOpen(false);
      onVisibleChange?.(false);
    }
  }

  function handleShortcutSelect(nextValue: [DateLike | undefined, DateLike | undefined]) {
    const resolved = normalizeDraftRange(normalizeDateValue(nextValue[0], valueFormat), normalizeDateValue(nextValue[1], valueFormat));
    setDraftValue(resolved);
    setDraftText([formatForInput(resolved[0], format), formatForInput(resolved[1], format)]);
    onCalendarChange?.(emitDraftRangeValue(resolved, valueFormat, value));
    onChange?.(emitRangeValue(resolved, valueFormat, value));
    setOpen(false);
    onVisibleChange?.(false);
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      commitDraft(true);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closePopover("cancel");
    }
  }

  useImperativeHandle(ref, () => ({
    blur: () => {
      startInputRef.current?.blur();
      endInputRef.current?.blur();
    },
    focus: () => startInputRef.current?.focus(),
    handleClose: () => closePopover("cancel"),
    handleOpen: () => openPopover(),
  }));

  useEffect(() => {
    if (!open) {
      syncDraftFromCommitted();
    }
  }, [defaultValue, format, normalizedValue, open, unlinkPanels]);

  return (
    <div className={cn("relative", className)}>
      <Popover
        onOpenChange={(nextOpen) => {
          if (nextOpen) {
            openPopover();
            return;
          }
          closePopover("outside");
        }}
        open={open}
      >
        <PopoverAnchor asChild>
          <div
            className={getRangeInputShellClass(size, status, clearable && Boolean(normalizedValue[0] || normalizedValue[1]))}
            onClick={() => openPopover()}
          >
            <input
              className={getInputClass(size, editable && !readonly)}
              disabled={disabled}
              onChange={(event) => setDraftText((current) => [event.target.value, current[1]])}
              onFocus={() => {
                setActivePanel("start");
                if (automaticDropdown) {
                  openPopover();
                }
              }}
              onKeyDown={handleInputKeyDown}
              placeholder={resolvedStartPlaceholder}
              readOnly={!editable || readonly}
              ref={startInputRef}
              value={open ? draftText[0] : formatForInput(normalizedValue[0], format)}
            />
            <span className="px-1 text-sm text-muted-foreground">{rangeSeparator}</span>
            <input
              className={getInputClass(size, editable && !readonly)}
              disabled={disabled}
              onChange={(event) => setDraftText((current) => [current[0], event.target.value])}
              onFocus={() => {
                setActivePanel("end");
                if (automaticDropdown) {
                  openPopover();
                }
              }}
              onKeyDown={handleInputKeyDown}
              placeholder={resolvedEndPlaceholder}
              readOnly={!editable || readonly}
              ref={endInputRef}
              value={open ? draftText[1] : formatForInput(normalizedValue[1], format)}
            />
            <button
              aria-label={text.openCalendar}
              className="mr-1 inline-flex h-7 w-7 items-center justify-center rounded-control text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              onClick={(event) => {
                event.stopPropagation();
                openPopover();
              }}
              type="button"
            >
              <CalendarDays className="h-4 w-4" />
            </button>
          </div>
        </PopoverAnchor>
        <PopoverContent
          align="start"
          className={cn("ui-date-picker-popover ui-date-picker-popover--range w-[min(96vw,642px)] p-0", popoverClassName)}
          onEscapeKeyDown={(event) => {
            event.preventDefault();
            closePopover("cancel");
          }}
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <div className={cn("ui-date-picker-layout", shortcuts.length && "ui-date-picker-layout--with-shortcuts")}>
            {shortcuts.length ? <ShortcutList items={shortcuts} onSelect={handleShortcutSelect} /> : null}
            <div className="ui-date-picker-main">
              <div className="ui-date-picker-panels ui-date-picker-panels--range">
                <CalendarPanel
                  active={activePanel === "start"}
                  disabled={disabledDate}
                  locale={dayPickerLocale}
                  localeText={text}
                  mode="range"
                  month={leftMonth}
                  onMonthChange={(nextMonth) => updatePanelMonth("start", nextMonth)}
                  onSelect={handleRangeSelect}
                  onViewModeChange={setLeftViewMode}
                  selected={{ from: draftValue[0], to: draftValue[1] }}
                  viewMode={leftViewMode}
                />
                <CalendarPanel
                  active={activePanel === "end"}
                  disabled={disabledDate}
                  locale={dayPickerLocale}
                  localeText={text}
                  mode="range"
                  month={rightMonth}
                  onMonthChange={(nextMonth) => updatePanelMonth("end", nextMonth)}
                  onSelect={handleRangeSelect}
                  onViewModeChange={setRightViewMode}
                  selected={{ from: draftValue[0], to: draftValue[1] }}
                  viewMode={rightViewMode}
                />
              </div>
              {showFooter ? (
                <div className="ui-date-picker-footer">
                  {showConfirm ? (
                    <>
                      <PopoverActionButton onClick={() => closePopover("cancel")}>{text.cancel}</PopoverActionButton>
                      <PopoverActionButton onClick={() => commitDraft(true)} primary>
                        {text.confirm}
                      </PopoverActionButton>
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {clearable && (normalizedValue[0] || normalizedValue[1]) && !disabled ? (
        <button
          aria-label={text.clear}
          className="absolute right-9 top-1/2 z-10 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          onClick={(event) => {
            event.stopPropagation();
            onChange?.(undefined);
            onClear?.();
            closePopover("clear");
          }}
          type="button"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
});
