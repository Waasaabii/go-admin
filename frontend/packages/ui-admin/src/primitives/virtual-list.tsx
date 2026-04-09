import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type Key,
  type ReactNode,
} from "react";

import { cn } from "../lib/utils";
import { AppScrollbar, type AppScrollbarProps } from "./scroll-area";

function upperBound(values: readonly number[], target: number) {
  let low = 0;
  let high = values.length;

  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (values[middle] <= target) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }

  return low;
}

function findAnchorIndex(scrollTop: number, positions: readonly number[], sizes: readonly number[]) {
  if (positions.length === 0) {
    return -1;
  }

  let index = Math.max(0, upperBound(positions, scrollTop) - 1);
  while (index < sizes.length - 1 && positions[index] + sizes[index] <= scrollTop) {
    index += 1;
  }

  return index;
}

function parsePixelSize(value?: string) {
  if (!value) {
    return 0;
  }

  const normalized = value.trim();
  if (!normalized.endsWith("px")) {
    return 0;
  }

  const parsed = Number.parseFloat(normalized.slice(0, -2));
  return Number.isFinite(parsed) ? parsed : 0;
}

function measureElementHeight(element: HTMLDivElement) {
  const rectHeight = element.getBoundingClientRect().height;
  if (rectHeight > 0) {
    return rectHeight;
  }

  if (element.offsetHeight > 0) {
    return element.offsetHeight;
  }

  const firstChild = element.firstElementChild as HTMLElement | null;
  const childRectHeight = firstChild?.getBoundingClientRect().height ?? 0;
  if (childRectHeight > 0) {
    return childRectHeight;
  }

  if ((firstChild?.offsetHeight ?? 0) > 0) {
    return firstChild?.offsetHeight ?? 0;
  }

  return parsePixelSize(element.style.height) || parsePixelSize(firstChild?.style.height);
}

type VirtualListItemProps = {
  children: ReactNode;
  className?: string;
  index: number;
  onHeightChange: (height: number) => void;
  style: CSSProperties;
};

function VirtualListItem({ children, className, index, onHeightChange, style }: VirtualListItemProps) {
  const elementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) {
      return;
    }

    const updateHeight = () => {
      onHeightChange(measureElementHeight(element));
    };

    updateHeight();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });
    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [onHeightChange]);

  return (
    <div className={className} data-virtual-index={index} ref={elementRef} style={style}>
      {children}
    </div>
  );
}

export type AppVirtualListProps<Item> = Omit<AppScrollbarProps, "children"> & {
  children: (item: Item, index: number) => ReactNode;
  contentClassName?: string;
  contentProps?: HTMLAttributes<HTMLDivElement>;
  empty?: ReactNode;
  estimatedItemSize?: number;
  gap?: number;
  getEstimatedItemSize?: (item: Item, index: number) => number;
  getItemKey?: (item: Item, index: number) => Key;
  itemClassName?: string;
  itemStyle?: CSSProperties;
  items: readonly Item[];
  overscan?: number;
};

export function AppVirtualList<Item>({
  children,
  contentClassName,
  contentProps,
  empty = null,
  estimatedItemSize,
  gap = 0,
  getEstimatedItemSize,
  getItemKey,
  itemClassName,
  itemStyle,
  items,
  overscan = 4,
  viewportClassName,
  ...props
}: AppVirtualListProps<Item>) {
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportElement, setViewportElement] = useState<HTMLDivElement | null>(null);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [measurementVersion, setMeasurementVersion] = useState(0);
  const measuredHeightsRef = useRef(new Map<Key, number>());
  const anchorSnapshotRef = useRef<{ key: Key; offset: number } | null>(null);

  const itemKeys = useMemo(() => items.map((item, index) => getItemKey?.(item, index) ?? index), [getItemKey, items]);
  const estimatedSizes = useMemo(
    () =>
      items.map((item, index) => {
        const nextEstimatedSize = getEstimatedItemSize?.(item, index) ?? estimatedItemSize ?? 56;
        return Math.max(1, nextEstimatedSize);
      }),
    [estimatedItemSize, getEstimatedItemSize, items],
  );
  const keyToIndex = useMemo(() => new Map(itemKeys.map((key, index) => [key, index])), [itemKeys]);

  useEffect(() => {
    let changed = false;
    const activeKeys = new Set(itemKeys);

    for (const key of measuredHeightsRef.current.keys()) {
      if (!activeKeys.has(key)) {
        measuredHeightsRef.current.delete(key);
        changed = true;
      }
    }

    if (changed) {
      setMeasurementVersion((version) => version + 1);
    }
  }, [itemKeys]);

  useEffect(() => {
    if (!viewportElement) {
      return;
    }

    const updateMetrics = () => {
      setScrollTop(viewportElement.scrollTop);
      setViewportHeight(viewportElement.clientHeight);
    };

    updateMetrics();

    viewportElement.addEventListener("scroll", updateMetrics, { passive: true });

    if (typeof ResizeObserver === "undefined") {
      return () => {
        viewportElement.removeEventListener("scroll", updateMetrics);
      };
    }

    const resizeObserver = new ResizeObserver(() => {
      updateMetrics();
    });
    resizeObserver.observe(viewportElement);

    return () => {
      viewportElement.removeEventListener("scroll", updateMetrics);
      resizeObserver.disconnect();
    };
  }, [viewportElement]);

  const resolvedGap = Math.max(0, gap);
  const normalizedOverscan = Math.max(0, Math.floor(overscan));

  const layout = useMemo(() => {
    const positions: number[] = [];
    const sizes: number[] = [];
    let offset = 0;

    for (const key of itemKeys) {
      positions.push(offset);
      const size = measuredHeightsRef.current.get(key) ?? estimatedSizes[positions.length - 1] ?? 56;
      sizes.push(size);
      offset += size + resolvedGap;
    }

    const totalSize = items.length > 0 ? Math.max(0, offset - resolvedGap) : 0;
    const fallbackViewport = (estimatedSizes[0] ?? 56) * Math.max(1, normalizedOverscan * 2 + 1);
    const visibleBottom = scrollTop + (viewportHeight > 0 ? viewportHeight : fallbackViewport);
    const startIndex = Math.max(0, upperBound(positions, scrollTop) - 1 - normalizedOverscan);
    const endIndex = Math.min(items.length, Math.max(startIndex + 1, upperBound(positions, visibleBottom) + normalizedOverscan));

    return {
      endIndex,
      positions,
      sizes,
      startIndex,
      totalSize,
    };
  }, [estimatedSizes, itemKeys, items.length, measurementVersion, normalizedOverscan, resolvedGap, scrollTop, viewportHeight]);

  useLayoutEffect(() => {
    if (!viewportElement || !anchorSnapshotRef.current) {
      return;
    }

    const snapshot = anchorSnapshotRef.current;
    anchorSnapshotRef.current = null;

    const anchorIndex = keyToIndex.get(snapshot.key);
    if (anchorIndex === undefined) {
      return;
    }

    const desiredScrollTop = Math.max(0, (layout.positions[anchorIndex] ?? 0) + snapshot.offset);
    if (Math.abs(viewportElement.scrollTop - desiredScrollTop) <= 0.5) {
      return;
    }

    viewportElement.scrollTop = desiredScrollTop;
    setScrollTop(desiredScrollTop);
  }, [keyToIndex, layout.positions, viewportElement]);

  return (
    <AppScrollbar
      {...props}
      viewportClassName={cn("relative", viewportClassName)}
      viewportRef={setViewportElement}
    >
      {items.length === 0 ? (
        empty
      ) : (
        <div
          {...contentProps}
          className={cn("relative min-w-full", contentClassName, contentProps?.className)}
          style={{
            ...contentProps?.style,
            height: layout.totalSize,
            minHeight: layout.totalSize,
            position: "relative",
          }}
        >
          {items.slice(layout.startIndex, layout.endIndex).map((item, offset) => {
            const index = layout.startIndex + offset;
            const key = itemKeys[index] ?? index;
            const top = layout.positions[index] ?? 0;
            const measuredHeight = layout.sizes[index] ?? estimatedSizes[index] ?? 56;

            return (
              <VirtualListItem
                className={cn("absolute left-0 top-0 w-full", itemClassName)}
                index={index}
                key={key}
                onHeightChange={(height) => {
                  if (height <= 0) {
                    return;
                  }

                  if (measuredHeightsRef.current.get(key) === height) {
                    return;
                  }

                  const anchorIndex = findAnchorIndex(viewportElement?.scrollTop ?? scrollTop, layout.positions, layout.sizes);
                  if (viewportElement && anchorIndex >= 0) {
                    anchorSnapshotRef.current = {
                      key: itemKeys[anchorIndex] ?? anchorIndex,
                      offset: (viewportElement.scrollTop ?? 0) - (layout.positions[anchorIndex] ?? 0),
                    };
                  }

                  measuredHeightsRef.current.set(key, height);
                  setMeasurementVersion((version) => version + 1);
                }}
                style={{
                  ...itemStyle,
                  left: 0,
                  minHeight: measuredHeight,
                  position: "absolute",
                  right: 0,
                  top: 0,
                  transform: `translateY(${top}px)`,
                }}
              >
                {children(item, index)}
              </VirtualListItem>
            );
          })}
        </div>
      )}
    </AppScrollbar>
  );
}
