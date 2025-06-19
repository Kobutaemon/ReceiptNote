export const toTwoDigits = (num, digit) => {
  num += "";
  if (num.length < digit) {
    num = "0" + num;
  }
  return num;
};
