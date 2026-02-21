/**
 * 精算計算ユーティリティ
 * Splitwiseと同様のアルゴリズムで最適な精算方法を計算
 */

/**
 * 各メンバーの残高を計算
 * @param {Array} expenses - 支出リスト { paidBy, participants: [{ userId, shareAmount }] }
 * @param {Array} settlements - 既存の精算記録 { fromUser, toUser, amount }
 * @returns {Object} { userId: balance } - 正の値は受け取り、負の値は支払い
 */
export const calculateBalances = (expenses, settlements = []) => {
  const balances = {};

  // ゲスト用のキーを生成するヘルパー
  const getParticipantKey = (userId, guestName) => {
    if (userId) return userId;
    if (guestName) return `guest:${guestName}`;
    return null;
  };

  // 各支出について残高を計算
  expenses.forEach((expense) => {
    const paidBy = expense.paid_by || expense.paidBy;
    const amount = Number(expense.amount) || 0;

    // 支払った人は金額分プラス
    balances[paidBy] = (balances[paidBy] || 0) + amount;

    // 参加者は負担分マイナス
    const participants = expense.participants || expense.expense_participants || [];
    participants.forEach((participant) => {
      const userId = participant.user_id || participant.userId;
      const guestName = participant.guest_name || participant.guestName;
      const key = getParticipantKey(userId, guestName);
      if (!key) return;
      const shareAmount = Number(participant.share_amount || participant.shareAmount) || 0;
      balances[key] = (balances[key] || 0) - shareAmount;
    });
  });

  // 既存の精算を反映
  settlements.forEach((settlement) => {
    const fromKey = getParticipantKey(
      settlement.from_user || settlement.fromUser,
      settlement.from_guest_name || settlement.fromGuestName
    );
    const toKey = getParticipantKey(
      settlement.to_user || settlement.toUser,
      settlement.to_guest_name || settlement.toGuestName
    );
    const amount = Number(settlement.amount) || 0;

    if (fromKey) balances[fromKey] = (balances[fromKey] || 0) + amount;
    if (toKey) balances[toKey] = (balances[toKey] || 0) - amount;
  });

  return balances;
};

/**
 * 最適な精算方法を計算（最小取引回数）
 * @param {Object} balances - { userId: balance }
 * @returns {Array} 精算リスト [{ from, to, amount }]
 */
export const calculateOptimalSettlements = (balances) => {
  const settlements = [];

  // 債権者（受け取る人）と債務者（支払う人）に分類
  const creditors = []; // balance > 0
  const debtors = [];   // balance < 0

  Object.entries(balances).forEach(([userId, balance]) => {
    const roundedBalance = Math.round(balance * 100) / 100;
    if (roundedBalance > 0.01) {
      creditors.push({ userId, amount: roundedBalance });
    } else if (roundedBalance < -0.01) {
      debtors.push({ userId, amount: Math.abs(roundedBalance) });
    }
  });

  // 金額でソート（大きい順）
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  // 貪欲法で精算を計算
  let i = 0;
  let j = 0;

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    const settleAmount = Math.min(creditor.amount, debtor.amount);

    if (settleAmount > 0.01) {
      settlements.push({
        from: debtor.userId,
        to: creditor.userId,
        amount: Math.round(settleAmount * 100) / 100,
      });
    }

    creditor.amount -= settleAmount;
    debtor.amount -= settleAmount;

    if (creditor.amount < 0.01) i++;
    if (debtor.amount < 0.01) j++;
  }

  return settlements;
};

/**
 * 支出を均等に分割した参加者リストを生成
 * @param {number} totalAmount - 総額
 * @param {Array} participantIds - 参加者のUserID配列
 * @returns {Array} [{ userId, shareAmount }]
 */
export const splitEqually = (totalAmount, participantIds) => {
  if (!participantIds || participantIds.length === 0) {
    return [];
  }

  const shareAmount = Math.round((totalAmount / participantIds.length) * 100) / 100;
  
  // 端数処理: 最後の人に調整
  const participants = participantIds.map((userId, index) => {
    if (index === participantIds.length - 1) {
      const previousTotal = shareAmount * (participantIds.length - 1);
      return {
        userId,
        shareAmount: Math.round((totalAmount - previousTotal) * 100) / 100,
      };
    }
    return { userId, shareAmount };
  });

  return participants;
};

/**
 * ユーザー間の個別残高を取得
 * @param {Object} balances - 全体の残高
 * @param {string} userId - 対象ユーザー
 * @returns {number} 残高（正: 受け取り、負: 支払い）
 */
export const getUserBalance = (balances, userId) => {
  return Math.round((balances[userId] || 0) * 100) / 100;
};

/**
 * 金額をフォーマット（日本円）
 * @param {number} amount - 金額
 * @returns {string} フォーマット済み文字列
 */
export const formatCurrency = (amount) => {
  const absAmount = Math.abs(amount);
  return `¥${absAmount.toLocaleString("ja-JP")}`;
};

/**
 * 残高表示用のフォーマット
 * @param {number} balance - 残高
 * @returns {Object} { text, className }
 */
export const formatBalance = (balance) => {
  const rounded = Math.round(balance * 100) / 100;
  
  if (rounded > 0) {
    return {
      text: `+${formatCurrency(rounded)}`,
      className: "text-green-600",
      description: "受け取り",
    };
  } else if (rounded < 0) {
    return {
      text: `-${formatCurrency(rounded)}`,
      className: "text-red-600",
      description: "支払い",
    };
  }
  
  return {
    text: "±¥0",
    className: "text-gray-500",
    description: "精算済み",
  };
};
