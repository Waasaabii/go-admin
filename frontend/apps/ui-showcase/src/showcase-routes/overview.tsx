import { Search } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { Link } from "react-router-dom";

import { useI18n } from "@go-admin/i18n";
import { Input } from "@go-admin/ui-admin";

import {
  getShowcaseCategoryDescription,
  getShowcaseCategoryLabel,
  getShowcaseRouteSummary,
} from "../i18n/showcase";
import { actionsCategory } from "./actions";
import { dataCategory } from "./data";
import { feedbackCategory } from "./feedback";
import { formsCategory } from "./forms";
import { docsCategory, layoutCategory } from "./layouts";
import { type ShowcaseCategory, type ShowcaseRoute } from "./shared";
import { OverviewPreview } from "./overview-previews";

const overviewSourceCategories: ShowcaseCategory[] = [
  actionsCategory,
  formsCategory,
  feedbackCategory,
  dataCategory,
  layoutCategory,
  docsCategory,
];

function normalizeKeyword(value: string) {
  return value.trim().toLowerCase();
}

function OverviewPage() {
  const { t } = useI18n();
  const [keyword, setKeyword] = useState("");
  const deferredKeyword = useDeferredValue(keyword);
  const normalizedKeyword = normalizeKeyword(deferredKeyword);
  const totalComponents = overviewSourceCategories.reduce((sum, category) => sum + category.items.length, 0);

  const filteredCategories = overviewSourceCategories
    .map((category) => {
      const categoryLabel = getShowcaseCategoryLabel(category, t);
      const categoryDescription = getShowcaseCategoryDescription(category, t);
      const searchableCategoryText = `${categoryLabel} ${categoryDescription}`.toLowerCase();
      const items = normalizedKeyword
        ? category.items.filter((item) => {
            const searchableItemText = [
              item.label,
              item.shortLabel,
              item.path,
              getShowcaseRouteSummary(item, t),
              categoryLabel,
              categoryDescription,
            ]
              .join(" ")
              .toLowerCase();

            return searchableCategoryText.includes(normalizedKeyword) || searchableItemText.includes(normalizedKeyword);
          })
        : category.items;

      return {
        category,
        categoryDescription,
        categoryLabel,
        items,
      };
    })
    .filter((category) => category.items.length > 0);

  const filteredCount = filteredCategories.reduce((sum, category) => sum + category.items.length, 0);

  return (
    <article className="showcase-doc-page showcase-overview-page">
      <header className="showcase-doc-page__header showcase-overview-page__header">
        <p className="showcase-doc-page__eyebrow">{t("showcase.category.overview.label")}</p>
        <h1 className="showcase-doc-page__title">{t("showcase.overview.title")}</h1>
        <div className="showcase-doc-page__description">
          <p>{t("showcase.overview.description.lead")}</p>
        </div>
        <div className="showcase-overview-search">
          <Input
            clearable
            className="showcase-overview-search__input"
            onChange={(event) => setKeyword(event.target.value)}
            onClear={() => setKeyword("")}
            placeholder={t("showcase.overview.search.placeholder")}
            prefix={<Search className="h-4 w-4" />}
            size="large"
            value={keyword}
          />
          <p className="showcase-overview-search__meta">
            {normalizedKeyword
              ? t("showcase.overview.search.result", undefined, { count: filteredCount, total: totalComponents })
              : t("showcase.overview.search.idle", undefined, { count: totalComponents })}
          </p>
        </div>
      </header>

      {filteredCategories.length ? (
        <div className="showcase-overview-groups">
          {filteredCategories.map(({ category, categoryDescription, categoryLabel, items }) => (
            <section className="showcase-doc-block showcase-overview-group" key={category.key}>
              <div className="showcase-overview-group__header">
                <h2 className="showcase-overview-group__title" title={categoryDescription}>{categoryLabel}</h2>
                <span className="showcase-overview-group__count">{items.length}</span>
              </div>
              <div className="showcase-overview-link-grid">
                {items.map((item) => (
                  <OverviewEntry categoryLabel={categoryLabel} item={item} key={item.path} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <section className="showcase-doc-block showcase-overview-empty">
          <h2 className="showcase-overview-empty__title">{t("showcase.overview.empty.title")}</h2>
          <p className="showcase-overview-empty__description">{t("showcase.overview.empty.description")}</p>
        </section>
      )}
    </article>
  );
}

function OverviewEntry({ categoryLabel, item }: { categoryLabel: string; item: ShowcaseRoute }) {
  const { t } = useI18n();
  const summary = getShowcaseRouteSummary(item, t);

  return (
    <Link aria-label={`${categoryLabel} ${item.label}`} className="showcase-overview-entry" to={item.path}>
      <div className="showcase-overview-entry__preview">
        <OverviewPreview path={item.path} />
      </div>
      <div className="showcase-overview-entry__body">
        <strong className="showcase-overview-entry__title">{item.label}</strong>
        <p className="showcase-overview-entry__summary">{summary}</p>
      </div>
    </Link>
  );
}

export const overviewRoute: ShowcaseRoute = {
  component: OverviewPage,
  label: "Overview",
  path: "/overview",
  shortLabel: "OVR",
  summaryKey: "showcase.overview.summary",
};

export const overviewCategory: ShowcaseCategory = {
  descriptionKey: "showcase.category.overview.description",
  key: "overview",
  labelKey: "showcase.category.overview.label",
  items: [overviewRoute],
};
