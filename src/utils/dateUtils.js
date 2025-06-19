import { toTwoDigits } from "./toTwoDigits";

export const getTodayDateJP = () => {
  const date = new Date();
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString();
  const day = date.getDate().toString();

  const yyyy = toTwoDigits(year, 4);
  const mm = toTwoDigits(month, 2);
  const dd = toTwoDigits(day, 2);
  const ymd = yyyy + "-" + mm + "-" + dd;

  return ymd;
};
