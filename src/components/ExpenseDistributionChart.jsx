import { useMemo } from "react";
import { chartColorHexMap } from "../utils/colorMap";
import { formatCurrencyJPY } from "../utils/currency";

const SVG_CENTER = 100;
const SVG_RADIUS = 88;
const INNER_RADIUS = 58;
const BACKDROP_COLOR = "#F3F4F6";
const DEFAULT_SEGMENT_COLOR = "#94A3B8";

const toCartesian = (centerX, centerY, radius, angleDegrees) => {
  const angleRadians = ((angleDegrees - 90) * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(angleRadians),
    y: centerY + radius * Math.sin(angleRadians),
  };
};

const describeSegment = (centerX, centerY, radius, startAngle, endAngle) => {
  const start = toCartesian(centerX, centerY, radius, endAngle);
  const end = toCartesian(centerX, centerY, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M",
    centerX,
    centerY,
    "L",
    start.x,
    start.y,
    "A",
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
    "Z",
  ].join(" ");
};

const percentageFormatter = new Intl.NumberFormat("ja-JP", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

const resolveColor = (colorKey) =>
  chartColorHexMap[colorKey] ?? DEFAULT_SEGMENT_COLOR;

function ExpenseDistributionChart({
  segments,
  totalAmount,
  isLoading,
  selectedYear,
  selectedMonth,
}) {
  const monthNumber = useMemo(() => {
    const parsed = Number.parseInt(selectedMonth, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }, [selectedMonth]);

  const normalized = useMemo(() => {
    if (!Array.isArray(segments)) {
      return [];
    }

    return segments
      .map((segment) => {
        const rawValue = segment?.value;
        const numericValue = Number.isFinite(rawValue)
          ? rawValue
          : Number.parseFloat(typeof rawValue === "string" ? rawValue : "NaN");
        const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
        const colorKey = segment?.colorKey ?? "";

        return {
          id: segment?.id ?? segment?.label ?? Math.random().toString(36),
          label: segment?.label ?? "不明なカテゴリ",
          value: safeValue,
          color: resolveColor(colorKey),
          colorKey,
        };
      })
      .filter((item) => item.label);
  }, [segments]);

  const chartArcs = useMemo(() => {
    if (!normalized.length || totalAmount <= 0) {
      return [];
    }

    const items = [];
    let cumulativeRatio = 0;

    normalized.forEach((segment, index) => {
      if (segment.value <= 0) {
        return;
      }

      const ratio = segment.value / totalAmount;
      if (ratio <= 0) {
        return;
      }

      const startAngle = cumulativeRatio * 360;
      cumulativeRatio += ratio;
      const isLast = index === normalized.length - 1;
      const endAngle = isLast ? 360 : cumulativeRatio * 360;

      items.push({
        id: segment.id,
        path: describeSegment(
          SVG_CENTER,
          SVG_CENTER,
          SVG_RADIUS,
          startAngle,
          endAngle
        ),
        color: segment.color,
        label: segment.label,
      });
    });

    return items;
  }, [normalized, totalAmount]);

  const chartTitle = useMemo(() => {
    const yearLabel = selectedYear ? `${selectedYear}年` : "";
    const monthLabel = monthNumber ? `${monthNumber}月` : "";
    return `${yearLabel}${monthLabel}の支出割合`;
  }, [selectedYear, monthNumber]);

  const hasData = totalAmount > 0 && normalized.some((item) => item.value > 0);

  return (
    <section
      id="tutorial-expense-chart"
      className="mx-6 mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">支出割合</h2>
          <p className="text-sm text-gray-500">
            カテゴリごとの支出バランスを視覚的に分かりやすく！
          </p>
        </div>
        <span className="text-sm text-gray-400" aria-live="polite">
          {selectedYear ? `${selectedYear}年` : ""}
          {monthNumber ? `${monthNumber}月` : ""}
        </span>
      </header>

      {isLoading ? (
        <div className="mt-8 flex h-60 items-center justify-center">
          <div className="flex w-full max-w-md flex-col items-center gap-4">
            <div className="h-32 w-32 animate-pulse rounded-full bg-gray-200" />
            <div className="h-3 w-48 animate-pulse rounded bg-gray-200" />
            <div className="h-3 w-40 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      ) : !hasData ? (
        <div className="mt-8 flex h-48 flex-col items-center justify-center gap-2 text-center text-gray-500">
          <p className="text-sm font-medium">この月の支出はまだありません</p>
          <p className="text-xs text-gray-400">
            支出を登録するとカテゴリ別の割合が表示されます。
          </p>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-center">
          <figure
            className="relative mx-auto w-full max-w-[260px] shrink-0"
            role="img"
            aria-label={chartTitle}
          >
            <svg viewBox="0 0 200 200" className="h-full w-full">
              <circle
                cx={SVG_CENTER}
                cy={SVG_CENTER}
                r={SVG_RADIUS}
                fill={BACKDROP_COLOR}
              />
              {chartArcs.map((arc) => (
                <path key={arc.id} d={arc.path} fill={arc.color} />
              ))}
              <circle
                cx={SVG_CENTER}
                cy={SVG_CENTER}
                r={INNER_RADIUS}
                fill="white"
              />
            </svg>
            <figcaption className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xs text-gray-400">月間合計</span>
              <span className="text-lg font-semibold text-gray-900">
                {formatCurrencyJPY(totalAmount)}
              </span>
            </figcaption>
          </figure>

          <div className="flex-1">
            <ul className="flex flex-col gap-3" aria-label="カテゴリ別支出詳細">
              {normalized.map((segment) => {
                const percentage =
                  totalAmount > 0 ? (segment.value / totalAmount) * 100 : 0;
                return (
                  <li
                    key={segment.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: segment.color }}
                        aria-hidden="true"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {segment.label}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrencyJPY(segment.value)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {percentageFormatter.format(percentage)}%
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}

export default ExpenseDistributionChart;
