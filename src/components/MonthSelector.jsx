import React, { useMemo } from "react";

function MonthSelector({
  selectedYear,
  selectedMonth,
  onYearChange,
  onMonthChange,
  yearOptions,
}) {
  const months = [
    { value: "01", label: "1月" },
    { value: "02", label: "2月" },
    { value: "03", label: "3月" },
    { value: "04", label: "4月" },
    { value: "05", label: "5月" },
    { value: "06", label: "6月" },
    { value: "07", label: "7月" },
    { value: "08", label: "8月" },
    { value: "09", label: "9月" },
    { value: "10", label: "10月" },
    { value: "11", label: "11月" },
    { value: "12", label: "12月" },
  ];

  const fallbackYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const rangeStart = currentYear - 5;
    const rangeEnd = currentYear + 1;
    const items = [];

    for (let year = rangeEnd; year >= rangeStart; year -= 1) {
      items.push(year.toString());
    }

    if (selectedYear && !items.includes(selectedYear)) {
      items.unshift(selectedYear);
    }

    return items;
  }, [selectedYear]);

  const years =
    Array.isArray(yearOptions) && yearOptions.length > 0
      ? yearOptions
      : fallbackYears;

  return (
    <div className="flex justify-center mx-auto mt-10">
      <div className="w-[90%] md:w-[60%] lg:w-[40%]">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="year-selector"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              年を選択
            </label>
            <select
              id="year-selector"
              value={selectedYear}
              onChange={(event) => onYearChange(event.target.value)}
              className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {`${year}年`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="month-selector"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              月を選択
            </label>
            <select
              id="month-selector"
              value={selectedMonth}
              onChange={(event) => onMonthChange(event.target.value)}
              className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none"
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MonthSelector;
