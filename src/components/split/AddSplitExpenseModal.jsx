import { useState, useEffect, useRef } from "react";
import { X, Calendar, CircleDollarSign } from "lucide-react";

function AddSplitExpenseModal({
  isOpen,
  onClose,
  onSubmit,
  members,
  currentUserId,
}) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [paidBy, setPaidBy] = useState(currentUserId); // 支払者
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [splitType, setSplitType] = useState("equal"); // equal or custom
  const [customShares, setCustomShares] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const titleInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && members) {
      setTitle("");
      setAmount("");
      setExpenseDate(new Date().toISOString().split("T")[0]);
      setPaidBy(currentUserId);
      // デフォルトで全員を選択
      const allMemberIds = members.map((m) => m.user_id);
      setSelectedParticipants(allMemberIds);
      setSplitType("equal");
      // カスタム金額を初期化
      const initialShares = {};
      allMemberIds.forEach((id) => {
        initialShares[id] = "";
      });
      setCustomShares(initialShares);
      setTimeout(() => titleInputRef.current?.focus(), 100);
    }
  }, [isOpen, members, currentUserId]);

  const toggleParticipant = (userId) => {
    setSelectedParticipants((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCustomShareChange = (userId, value) => {
    setCustomShares((prev) => ({
      ...prev,
      [userId]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !amount || selectedParticipants.length === 0 || !paidBy) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    // カスタム分割の場合、合計が一致するかチェック
    if (splitType === "custom") {
      const customTotal = selectedParticipants.reduce((sum, userId) => {
        return sum + (parseFloat(customShares[userId]) || 0);
      }, 0);
      if (Math.abs(customTotal - numAmount) > 1) {
        alert(`各自の負担額の合計（¥${customTotal.toLocaleString()}）が総額（¥${numAmount.toLocaleString()}）と一致しません。`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      let participants;
      if (splitType === "equal") {
        const shareAmount = Math.round((numAmount / selectedParticipants.length) * 100) / 100;
        participants = selectedParticipants.map((userId, index) => {
          // 端数は最後の人に調整
          if (index === selectedParticipants.length - 1) {
            const previousTotal = shareAmount * (selectedParticipants.length - 1);
            return {
              userId,
              shareAmount: Math.round((numAmount - previousTotal) * 100) / 100,
            };
          }
          return { userId, shareAmount };
        });
      } else {
        participants = selectedParticipants.map((userId) => ({
          userId,
          shareAmount: parseFloat(customShares[userId]) || 0,
        }));
      }

      await onSubmit({
        title: title.trim(),
        amount: numAmount,
        expenseDate,
        paidBy,
        participants,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const numAmount = parseFloat(amount) || 0;
  const perPersonAmount =
    selectedParticipants.length > 0
      ? Math.round((numAmount / selectedParticipants.length) * 100) / 100
      : 0;

  // カスタム分割時の合計
  const customTotal = selectedParticipants.reduce((sum, userId) => {
    return sum + (parseFloat(customShares[userId]) || 0);
  }, 0);
  const customDifference = numAmount - customTotal;

  // メンバー表示用ヘルパー
  const getMemberDisplay = (member) => {
    return member.email || member.user_id.slice(0, 8) + "...";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">支出を追加</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* タイトル */}
          <div className="mb-4">
            <label
              htmlFor="expense-title"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              タイトル <span className="text-red-500">*</span>
            </label>
            <input
              ref={titleInputRef}
              id="expense-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: 夕食代"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          {/* 金額 */}
          <div className="mb-4">
            <label
              htmlFor="expense-amount"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              金額 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <CircleDollarSign
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                id="expense-amount"
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* 日付 */}
          <div className="mb-4">
            <label
              htmlFor="expense-date"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              日付
            </label>
            <div className="relative">
              <Calendar
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                id="expense-date"
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 支払者 */}
          <div className="mb-4">
            <label
              htmlFor="paid-by"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              支払った人 <span className="text-red-500">*</span>
            </label>
            <select
              id="paid-by"
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {members?.map((member) => (
                <option key={member.user_id} value={member.user_id}>
                  {getMemberDisplay(member)}
                  {member.user_id === currentUserId ? " (自分)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* 分割方法 */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              分割方法
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSplitType("equal")}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  splitType === "equal"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                均等割り
              </button>
              <button
                type="button"
                onClick={() => setSplitType("custom")}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  splitType === "custom"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                金額を指定
              </button>
            </div>
          </div>

          {/* 参加者 */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              参加者（割り勘対象）
            </label>
            <div className="space-y-2 rounded-lg border border-gray-200 p-3">
              {members?.map((member) => (
                <div
                  key={member.user_id}
                  className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    id={`participant-${member.user_id}`}
                    checked={selectedParticipants.includes(member.user_id)}
                    onChange={() => toggleParticipant(member.user_id)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor={`participant-${member.user_id}`}
                    className="flex-1 cursor-pointer text-gray-800"
                  >
                    {getMemberDisplay(member)}
                    {member.user_id === currentUserId && (
                      <span className="ml-2 text-xs text-gray-500">(自分)</span>
                    )}
                  </label>
                  {/* カスタム分割時の金額入力 */}
                  {splitType === "custom" && selectedParticipants.includes(member.user_id) && (
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">¥</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={customShares[member.user_id] || ""}
                        onChange={(e) => handleCustomShareChange(member.user_id, e.target.value)}
                        placeholder="0"
                        className="w-20 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 均等割りの場合：1人あたりの金額 */}
          {splitType === "equal" && selectedParticipants.length > 0 && numAmount > 0 && (
            <div className="mb-6 rounded-lg bg-gray-100 p-3">
              <p className="text-sm text-gray-600">
                1人あたり:{" "}
                <span className="font-semibold text-gray-800">
                  ¥{perPersonAmount.toLocaleString("ja-JP")}
                </span>
                <span className="text-gray-500">
                  {" "}
                  × {selectedParticipants.length}人
                </span>
              </p>
            </div>
          )}

          {/* カスタム分割の場合：合計確認 */}
          {splitType === "custom" && numAmount > 0 && (
            <div className={`mb-6 rounded-lg p-3 ${
              Math.abs(customDifference) <= 1 ? "bg-green-100" : "bg-yellow-100"
            }`}>
              <p className="text-sm">
                合計: <span className="font-semibold">¥{customTotal.toLocaleString("ja-JP")}</span>
                {" / "}
                <span className="text-gray-600">¥{numAmount.toLocaleString("ja-JP")}</span>
                {Math.abs(customDifference) > 1 && (
                  <span className="ml-2 text-yellow-700">
                    (差額: ¥{Math.abs(customDifference).toLocaleString("ja-JP")})
                  </span>
                )}
                {Math.abs(customDifference) <= 1 && (
                  <span className="ml-2 text-green-700">✓ OK</span>
                )}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-gray-600 transition-colors hover:bg-gray-100"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={
                !title.trim() ||
                !amount ||
                !paidBy ||
                selectedParticipants.length === 0 ||
                isSubmitting ||
                (splitType === "custom" && Math.abs(customDifference) > 1)
              }
              className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "追加中..." : "追加"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddSplitExpenseModal;
