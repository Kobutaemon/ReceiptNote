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
