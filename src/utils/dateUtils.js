/**
 * 日付関連のユーティリティ関数
 */

/**
 * 今日の日付を年/月/日の形式で取得する
 * @returns {string} YYYY/MM/DD形式の文字列
 */
export const getTodayDateJP = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
};

/**
 * 指定した日付を年/月/日の形式でフォーマットする
 * @param {Date} date - フォーマットする日付
 * @returns {string} YYYY/MM/DD形式の文字列
 */
export const formatDateJP = (date) => {
  if (!(date instanceof Date) || isNaN(date)) {
    throw new Error("有効な日付オブジェクトを渡してください");
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
};

/**
 * 現在の日時を詳細な形式で取得する
 * @returns {string} YYYY/MM/DD HH:mm:ss形式の文字列
 */
export const getCurrentDateTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
};
