import { useState, useEffect, useRef } from "react";
import { X, Calendar, CircleDollarSign, UserPlus, Trash2 } from "lucide-react";

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

  // New states for the simpler "A pays B" mode
  const [expenseMode, setExpenseMode] = useState("split"); // "split" | "transfer"
  const [transferFrom, setTransferFrom] = useState(""); // 払う人
  const [transferTo, setTransferTo] = useState(""); // もらう人

  // ゲスト関連
  const [guests, setGuests] = useState([]); // [{ id: "guest-xxx", name: "名前" }]
  const [guestNameInput, setGuestNameInput] = useState("");
  
  const previousBodyOverflowRef = useRef("");

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    const { style } = document.body;

    if (isOpen) {
      previousBodyOverflowRef.current = style.overflow;
      style.overflow = "hidden";
    } else {
      style.overflow = previousBodyOverflowRef.current || "";
    }

    return () => {
      style.overflow = previousBodyOverflowRef.current || "";
    };
  }, [isOpen]);

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
      
      // ゲストリセット
      setGuests([]);
      setGuestNameInput("");

      setExpenseMode("transfer"); // ユーザーの希望に合わせてデフォルトを「誰かから誰かへ」にすることも可能。今回は一旦 "transfer" を初期値にしてみる。
      setTransferFrom(currentUserId);
      const otherMember = members.find((m) => m.user_id !== currentUserId);
      setTransferTo(otherMember ? otherMember.user_id : "");

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

  const handleCustomShareChange = (id, value) => {
    setCustomShares((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // ゲスト追加
  const handleAddGuest = () => {
    const trimmedName = guestNameInput.trim();
    if (!trimmedName) return;
    // 重複チェック
    if (guests.some((g) => g.name === trimmedName)) {
      alert("同じ名前のゲストが既に追加されています。");
      return;
    }
    const guestId = `guest-${Date.now()}`;
    setGuests((prev) => [...prev, { id: guestId, name: trimmedName }]);
    setSelectedParticipants((prev) => [...prev, guestId]);
    setCustomShares((prev) => ({ ...prev, [guestId]: "" }));
    setGuestNameInput("");
  };

  // ゲスト削除
  const handleRemoveGuest = (guestId) => {
    setGuests((prev) => prev.filter((g) => g.id !== guestId));
    setSelectedParticipants((prev) => prev.filter((id) => id !== guestId));
    setCustomShares((prev) => {
      const next = { ...prev };
      delete next[guestId];
      return next;
    });
  };

  // ゲストかどうか判定
  const isGuest = (id) => id.startsWith("guest-");

  // 参加者のID一覧（メンバー＋ゲスト）で選択されているもの
  const allParticipantIds = selectedParticipants;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (expenseMode === "transfer") {
      if (!title.trim() || !amount || !transferFrom || !transferTo) return;
      if (transferFrom === transferTo) {
        alert("払う人とともらう人には別のユーザーを選択してください。");
        return;
      }
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) return;

      setIsSubmitting(true);
      try {
        await onSubmit({
          title: title.trim(),
          amount: numAmount,
          expenseDate,
          paidBy: transferTo, // もらう人が元々立て替えた人
          participants: [
            { userId: transferFrom, shareAmount: numAmount }, // 払う人が全額負担
          ],
          guests: [], // transferモードではゲストなし
        });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!title.trim() || !amount || allParticipantIds.length === 0 || !paidBy) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    // カスタム分割の場合、合計が一致するかチェック
    if (splitType === "custom") {
      const customTotal = allParticipantIds.reduce((sum, id) => {
        return sum + (parseFloat(customShares[id]) || 0);
      }, 0);
      if (customTotal !== numAmount) {
        alert(`各自の負担額の合計（¥${customTotal.toLocaleString()}）が総額（¥${numAmount.toLocaleString()}）と一致しません。`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // メンバーとゲストを分離
      const memberParticipantIds = allParticipantIds.filter((id) => !isGuest(id));
      const guestParticipantIds = allParticipantIds.filter((id) => isGuest(id));

      let memberParticipants;
      let guestParticipants;

      if (splitType === "equal") {
        const totalCount = allParticipantIds.length;
        const shareAmount = Math.round((numAmount / totalCount) * 100) / 100;
        
        // メンバー分
        memberParticipants = memberParticipantIds.map((userId, index) => {
          // 最後の人に端数調整（メンバーもゲストも含めた全体の最後）
          const isLast = index === memberParticipantIds.length - 1 && guestParticipantIds.length === 0;
          if (isLast) {
            const previousTotal = shareAmount * (totalCount - 1);
            return {
              userId,
              shareAmount: Math.round((numAmount - previousTotal) * 100) / 100,
            };
          }
          return { userId, shareAmount };
        });

        // ゲスト分
        guestParticipants = guestParticipantIds.map((guestId, index) => {
          const guest = guests.find((g) => g.id === guestId);
          const isLast = index === guestParticipantIds.length - 1;
          if (isLast) {
            const previousTotal = shareAmount * (totalCount - 1);
            return {
              guestName: guest.name,
              shareAmount: Math.round((numAmount - previousTotal) * 100) / 100,
            };
          }
          return { guestName: guest.name, shareAmount };
        });
      } else {
        memberParticipants = memberParticipantIds.map((userId) => ({
          userId,
          shareAmount: parseFloat(customShares[userId]) || 0,
        }));
        guestParticipants = guestParticipantIds.map((guestId) => {
          const guest = guests.find((g) => g.id === guestId);
          return {
            guestName: guest.name,
            shareAmount: parseFloat(customShares[guestId]) || 0,
          };
        });
      }

      await onSubmit({
        title: title.trim(),
        amount: numAmount,
        expenseDate,
        paidBy,
        participants: memberParticipants,
        guests: guestParticipants,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  // isOpenがfalseの場合でもDOMをレンダリングしてアニメーションを適用

  const numAmount = parseFloat(amount) || 0;
  const perPersonAmount =
    allParticipantIds.length > 0
      ? Math.round((numAmount / allParticipantIds.length) * 100) / 100
      : 0;

  // カスタム分割時の合計
  const customTotal = allParticipantIds.reduce((sum, id) => {
    return sum + (parseFloat(customShares[id]) || 0);
  }, 0);
  const customDifference = numAmount - customTotal;

  // メンバー表示用ヘルパー（ユーザー名 > メール > ID）
  const getMemberDisplay = (member) => {
    if (member.display_name) return member.display_name;
    return member.email || member.user_id.slice(0, 8) + "...";
  };

  // ゲスト名を取得するヘルパー
  const getGuestDisplay = (guestId) => {
    const guest = guests.find((g) => g.id === guestId);
    return guest ? guest.name : "ゲスト";
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gray-500/80 p-4 transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={handleClose}
    >
      <div
        className={`max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-xl transition-transform duration-300 ease-out ${
          isOpen ? "scale-100" : "scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
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

        <div className="mb-6 flex rounded-lg bg-gray-100 p-1">
          <button
            type="button"
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              expenseMode === "transfer" ? "bg-white text-gray-800 shadow" : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setExpenseMode("transfer")}
          >
            誰かから誰かへ
          </button>
          <button
            type="button"
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              expenseMode === "split" ? "bg-white text-gray-800 shadow" : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setExpenseMode("split")}
          >
            複数人で割り勘
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

          {expenseMode === "split" ? (
            <>
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
              {/* 登録メンバー */}
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

              {/* ゲスト参加者 */}
              {guests.map((guest) => (
                <div
                  key={guest.id}
                  className="flex items-center gap-3 rounded-lg bg-amber-50 p-2 transition-colors hover:bg-amber-100"
                >
                  <input
                    type="checkbox"
                    id={`participant-${guest.id}`}
                    checked={selectedParticipants.includes(guest.id)}
                    onChange={() => toggleParticipant(guest.id)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor={`participant-${guest.id}`}
                    className="flex-1 cursor-pointer text-gray-800"
                  >
                    {guest.name}
                    <span className="ml-2 inline-flex items-center rounded-full bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-800">
                      ゲスト
                    </span>
                  </label>
                  {/* カスタム分割時の金額入力 */}
                  {splitType === "custom" && selectedParticipants.includes(guest.id) && (
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">¥</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={customShares[guest.id] || ""}
                        onChange={(e) => handleCustomShareChange(guest.id, e.target.value)}
                        placeholder="0"
                        className="w-20 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveGuest(guest.id)}
                    className="rounded p-1 text-red-400 transition-colors hover:bg-red-100 hover:text-red-600"
                    title="ゲストを削除"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              {/* ゲスト追加入力 */}
              <div className="flex items-center gap-2 border-t border-gray-200 pt-3 mt-2">
                <UserPlus size={16} className="text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={guestNameInput}
                  onChange={(e) => setGuestNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddGuest();
                    }
                  }}
                  placeholder="ゲスト名を入力…"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddGuest}
                  disabled={!guestNameInput.trim()}
                  className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  追加
                </button>
              </div>
            </div>
          </div>

          {/* 均等割りの場合：1人あたりの金額 */}
          {splitType === "equal" && allParticipantIds.length > 0 && numAmount > 0 && (
            <div className="mb-6 rounded-lg bg-gray-100 p-3">
              <p className="text-sm text-gray-600">
                1人あたり:{" "}
                <span className="font-semibold text-gray-800">
                  ¥{perPersonAmount.toLocaleString("ja-JP")}
                </span>
                <span className="text-gray-500">
                  {" "}
                  × {allParticipantIds.length}人
                </span>
              </p>
            </div>
          )}

          {/* カスタム分割の場合：合計確認 */}
          {splitType === "custom" && numAmount > 0 && (
            <div className={`mb-6 rounded-lg p-3 ${
              customDifference === 0 ? "bg-green-100" : "bg-yellow-100"
            }`}>
              <p className="text-sm">
                合計: <span className="font-semibold">¥{customTotal.toLocaleString("ja-JP")}</span>
                {" / "}
                <span className="text-gray-600">¥{numAmount.toLocaleString("ja-JP")}</span>
                {customDifference !== 0 && (
                  <span className="ml-2 text-yellow-700">
                    (差額: ¥{Math.abs(customDifference).toLocaleString("ja-JP")})
                  </span>
                )}
                {customDifference === 0 && (
                  <span className="ml-2 text-green-700">✓ OK</span>
                )}
              </p>
              </div>
            )}
          </>
          ) : (
            <>
              {/* 誰から誰へ (Transfer Mode) */}
              <div className="mb-4 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    払う人 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={transferFrom}
                    onChange={(e) => setTransferFrom(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">選択してください</option>
                    {members?.map((member) => (
                      <option key={`from-${member.user_id}`} value={member.user_id}>
                        {getMemberDisplay(member)}
                        {member.user_id === currentUserId ? " (自分)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="pt-6 font-bold text-gray-400">→</div>
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    もらう人 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={transferTo}
                    onChange={(e) => setTransferTo(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">選択してください</option>
                    {members?.map((member) => (
                      <option key={`to-${member.user_id}`} value={member.user_id}>
                        {getMemberDisplay(member)}
                        {member.user_id === currentUserId ? " (自分)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-6 rounded-lg bg-gray-100 p-4 text-sm text-gray-800">
                {transferFrom && transferTo && transferFrom !== transferTo ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 text-lg">
                      <strong className="text-gray-900 border-b border-gray-300 pb-0.5">
                        {getMemberDisplay(members?.find(m => m.user_id === transferFrom) || {})}
                      </strong>
                      <span className="text-gray-400 font-bold">→</span>
                      <strong className="text-gray-900 border-b border-gray-300 pb-0.5">
                        {getMemberDisplay(members?.find(m => m.user_id === transferTo) || {})}
                      </strong>
                    </div>
                    <span className="font-bold text-2xl text-gray-900">
                      ¥{numAmount > 0 ? numAmount.toLocaleString() : "0"}
                    </span>
                  </div>
                ) : (
                  <p>払う人とともらう人を選択してください。</p>
                )}
              </div>
            </>
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
                expenseMode === "split"
                  ? (!title.trim() || !amount || !paidBy || allParticipantIds.length === 0 || isSubmitting || (splitType === "custom" && customDifference !== 0))
                  : (!title.trim() || !amount || !transferFrom || !transferTo || transferFrom === transferTo || isSubmitting)
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
