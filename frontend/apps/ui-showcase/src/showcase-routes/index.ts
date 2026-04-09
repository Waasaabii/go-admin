import type { ShowcaseCategory } from "./shared";

import { actionsCategory } from "./actions";
import { dataCategory } from "./data";
import { feedbackCategory } from "./feedback";
import { formsCategory } from "./forms";
import { docsCategory, layoutCategory } from "./layouts";
import { overviewCategory } from "./overview";

export const showcaseCategories: ShowcaseCategory[] = [
  overviewCategory,
  actionsCategory,
  formsCategory,
  feedbackCategory,
  dataCategory,
  layoutCategory,
  docsCategory,
];

export const showcaseRoutes = showcaseCategories.flatMap((category) => category.items);

export type { ShowcaseApiItem, ShowcaseCategory, ShowcaseRoute } from "./shared";
