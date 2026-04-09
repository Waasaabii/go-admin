import { ArrowRight, Compass, Layers3, LayoutGrid, Search } from "lucide-react";
import { Link } from "react-router-dom";

import { useI18n } from "@suiyuan/i18n";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  MetricCard,
  MetricGrid,
  SectionCard,
} from "@suiyuan/ui-admin";

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

const overviewSourceCategories: ShowcaseCategory[] = [
  actionsCategory,
  formsCategory,
  feedbackCategory,
  dataCategory,
  layoutCategory,
  docsCategory,
];

function OverviewPage() {
  const { t } = useI18n();
  const totalComponents = overviewSourceCategories.reduce((sum, category) => sum + category.items.length, 0);
  const featuredRoutes = overviewSourceCategories.flatMap((category) =>
    category.items.slice(0, 2).map((item) => ({ ...item, categoryLabelKey: category.labelKey })),
  );

  return (
    <article className="showcase-doc-page showcase-overview-page">
      <header className="showcase-doc-page__header">
        <p className="showcase-doc-page__eyebrow">{t("showcase.category.overview.label")}</p>
        <h1 className="showcase-doc-page__title">{t("showcase.overview.title")}</h1>
        <div className="showcase-doc-page__description">
          <p>{t("showcase.overview.description.lead")}</p>
          <p>{t("showcase.overview.description.sub")}</p>
        </div>
        <div className="showcase-doc-page__meta">
          <span>{t("showcase.overview.meta.categories", undefined, { count: overviewSourceCategories.length })}</span>
          <span>{t("showcase.overview.meta.routes", undefined, { count: totalComponents })}</span>
          <span>{t("showcase.overview.meta.support")}</span>
        </div>
        <div className="showcase-overview-hero">
          <div className="showcase-overview-hero__copy">
            <Badge>{t("showcase.overview.hero.badge")}</Badge>
            <h2>{t("showcase.overview.hero.title")}</h2>
            <p>{t("showcase.overview.hero.description")}</p>
          </div>
          <div className="showcase-overview-hero__actions">
            <Button asChild type="button">
              <Link to={overviewSourceCategories[0]?.items[0]?.path ?? "/actions/button"}>
                {t("showcase.overview.actions.primary")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild outlined type="button" variant="default">
              <Link to="/docs/global-search">
                {t("showcase.overview.actions.search")}
                <Search className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="showcase-doc-block">
        <div className="showcase-doc-section">
          <h2 className="showcase-doc-section__title">{t("showcase.overview.scale.title")}</h2>
          <p className="showcase-doc-section__description">{t("showcase.overview.scale.description")}</p>
        </div>
        <MetricGrid>
          <MetricCard detail={t("showcase.overview.metrics.routes.detail")} label={t("showcase.overview.metrics.routes.label")} value={String(totalComponents)} />
          <MetricCard detail={t("showcase.overview.metrics.categories.detail")} label={t("showcase.overview.metrics.categories.label")} value={String(overviewSourceCategories.length)} />
          <MetricCard detail={t("showcase.overview.metrics.search.detail")} label={t("showcase.overview.metrics.search.label")} value={t("showcase.overview.metrics.search.value")} />
          <MetricCard detail={t("showcase.overview.metrics.shells.detail")} label={t("showcase.overview.metrics.shells.label")} value={t("showcase.overview.metrics.shells.value")} />
        </MetricGrid>
      </section>

      <section className="showcase-doc-block">
        <div className="showcase-doc-section">
          <h2 className="showcase-doc-section__title">{t("showcase.overview.section.categoryTitle")}</h2>
          <p className="showcase-doc-section__description">{t("showcase.overview.section.categoryDescription")}</p>
        </div>
        <div className="showcase-overview-category-grid">
          {overviewSourceCategories.map((category) => (
            <Card className="showcase-overview-category-card" elevated key={category.key}>
              <CardHeader>
                <div className="showcase-overview-category-card__head">
                  <Badge>{getShowcaseCategoryLabel(category, t)}</Badge>
                  <span className="showcase-overview-category-card__count">{t("showcase.overview.category.count", undefined, { count: category.items.length })}</span>
                </div>
                <CardTitle>{getShowcaseCategoryLabel(category, t)}</CardTitle>
                <CardDescription>{getShowcaseCategoryDescription(category, t)}</CardDescription>
              </CardHeader>
              <CardContent className="showcase-overview-category-card__body">
                <div className="showcase-overview-category-card__links">
                  {category.items.slice(0, 5).map((item) => (
                    <Link className="showcase-overview-link-pill" key={item.path} to={item.path}>
                      <span>{item.label}</span>
                      <small>{item.shortLabel}</small>
                    </Link>
                  ))}
                </div>
                <Button asChild className="w-full justify-between" outlined type="button" variant="default">
                  <Link to={category.items[0]?.path ?? "/"}>
                    {t("showcase.overview.category.enter", undefined, { name: getShowcaseCategoryLabel(category, t) })}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="showcase-doc-block">
        <div className="showcase-doc-section">
          <h2 className="showcase-doc-section__title">{t("showcase.overview.featured.title")}</h2>
          <p className="showcase-doc-section__description">{t("showcase.overview.featured.description")}</p>
        </div>
        <div className="showcase-overview-featured-grid">
          {featuredRoutes.map((route) => (
            <Link className="showcase-overview-featured-card" key={route.path} to={route.path}>
              <span className="showcase-overview-featured-card__section">{t(route.categoryLabelKey)}</span>
              <strong>{route.label}</strong>
              <p>{getShowcaseRouteSummary(route, t)}</p>
              <span className="showcase-overview-featured-card__meta">
                <ArrowRight className="h-4 w-4" />
                {t("showcase.overview.featured.meta")}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="showcase-doc-block">
        <SectionCard description={t("showcase.overview.section.guideDescription")} title={t("showcase.overview.section.guideTitle")}>
          <div className="showcase-overview-guides">
            <div className="showcase-overview-guide">
              <Compass className="h-5 w-5" />
              <div>
                <strong>{t("showcase.overview.guide.browse.title")}</strong>
                <p>{t("showcase.overview.guide.browse.description")}</p>
              </div>
            </div>
            <div className="showcase-overview-guide">
              <Search className="h-5 w-5" />
              <div>
                <strong>{t("showcase.overview.guide.search.title")}</strong>
                <p>{t("showcase.overview.guide.search.description")}</p>
              </div>
            </div>
            <div className="showcase-overview-guide">
              <Layers3 className="h-5 w-5" />
              <div>
                <strong>{t("showcase.overview.guide.layout.title")}</strong>
                <p>{t("showcase.overview.guide.layout.description")}</p>
              </div>
            </div>
            <div className="showcase-overview-guide">
              <LayoutGrid className="h-5 w-5" />
              <div>
                <strong>{t("showcase.overview.guide.routes.title")}</strong>
                <p>{t("showcase.overview.guide.routes.description")}</p>
              </div>
            </div>
          </div>
        </SectionCard>
      </section>
    </article>
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
