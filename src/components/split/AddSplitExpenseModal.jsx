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
      // デフォルトで全員を選択
      const allMemberIds = members.map((m) => m.user_id);
      setSelectedParticipants(allMemberIds);
      setSplitType("equal");
      setCustomShares({});
      setTimeout(() => titleInputRef.current?.focus(), 100);
    }
  }, [isOpen, members]);

  const toggleParticipant = (userId) => {
    setSelectedParticipants((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !amount || selectedParticipants.length === 0) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

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
        paidBy: currentUserId,
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

          {/* 参加者 */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              参加者（割り勘対象）
            </label>
            <div className="space-y-2 rounded-lg border border-gray-200 p-3">
              {members?.map((member) => (
                <label
                  key={member.user_id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedParticipants.includes(member.user_id)}
                    onChange={() => toggleParticipant(member.user_id)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="flex-1 text-gray-800">
                    {member.email || member.user_id}
                    {member.user_id === currentUserId && (
                      <span className="ml-2 text-xs text-gray-500">(自分)</span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 1人あたりの金額 */}
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
                selectedParticipants.length === 0 ||
                isSubmitting
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
