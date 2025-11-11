import { toTwoDigits } from "./toTwoDigits";

// 共通の日付取得関数
const getCurrentDate = () => {
  const date = new Date();
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
};

export const getTodayDateJP = () => {
  const { year, month, day } = getCurrentDate();

  const yyyy = toTwoDigits(year.toString(), 4);
  const mm = toTwoDigits(month.toString(), 2);
  const dd = toTwoDigits(day.toString(), 2);

  return `${yyyy}-${mm}-${dd}`;
};

export const getCurrentMonth = () => {
  const { month } = getCurrentDate();
  return toTwoDigits(month.toString(), 2);
};

export const getMonthBoundaries = (year, monthString) => {
  const parsedMonth = Number.parseInt(monthString, 10);

  if (!Number.isFinite(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
    throw new Error(`Invalid month value received: ${monthString}`);
  }

  const normalizedMonth = toTwoDigits(parsedMonth.toString(), 2);
  const nextMonth = parsedMonth === 12 ? 1 : parsedMonth + 1;
  const nextYear = parsedMonth === 12 ? year + 1 : year;
  const normalizedNextMonth = toTwoDigits(nextMonth.toString(), 2);

  return {
    startDate: `${year}-${normalizedMonth}-01`,
    exclusiveEndDate: `${nextYear}-${normalizedNextMonth}-01`,
  };
};
