const formatter = new Intl.NumberFormat("ja-JP");

export const formatCurrencyJPY = (value) => {
  if (!Number.isFinite(value)) {
    return "0円";
  }

  const roundedValue = Math.round(value);
  const signAdjustedValue = Object.is(roundedValue, -0) ? 0 : roundedValue;
  return `${formatter.format(signAdjustedValue)}円`;
};
