import React from "react";

function MonthSelector({ selectedMonth, onMonthChange }) {
  const months = [
    { value: 1, label: "1月" },
    { value: 2, label: "2月" },
    { value: 3, label: "3月" },
    { value: 4, label: "4月" },
    { value: 5, label: "5月" },
    { value: 6, label: "6月" },
    { value: 7, label: "7月" },
    { value: 8, label: "8月" },
    { value: 9, label: "9月" },
    { value: 10, label: "10月" },
    { value: 11, label: "11月" },
    { value: 12, label: "12月" },
  ];

  return (
    <div className="flex justify-center mx-auto">
      <div className="w-[70%] md:w-[30%]">
        <label
          htmlFor="month-selector"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          月を選択
        </label>
        <select
          id="month-selector"
          value={selectedMonth}
          onChange={(e) => onMonthChange(parseInt(e.target.value))}
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
  );
}

export default MonthSelector;
