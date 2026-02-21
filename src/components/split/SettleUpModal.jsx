import { X, ArrowRight } from "lucide-react";
import { formatCurrency } from "../../utils/settlementCalculator";

function SettleUpModal({
  isOpen,
  onClose,
  settlement,
  settlements,
  getMemberDisplay,
  onConfirm,
  currentUserId,
}) {
  const handleConfirm = () => {
    if (settlements && settlements.length > 0) {
      onConfirm(settlements);
      return;
    }
    if (settlement) {
      onConfirm(settlement);
    }
  };

  const shouldShow =
    isOpen && (Boolean(settlement) || (settlements && settlements.length > 0));
  const isBulk = Boolean(settlements && settlements.length > 0);
  
  // ユーザーのプラスマイナスを計算
  const netAmount = isBulk && currentUserId
    ? settlements.reduce((sum, s) => {
        if (s.to === currentUserId) return sum + (Number(s.amount) || 0);
        if (s.from === currentUserId) return sum - (Number(s.amount) || 0);
        return sum;
      }, 0)
    : 0;

  const isPositive = netAmount > 0;
  const isNegative = netAmount < 0;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gray-500/80 transition-opacity duration-300 ${
        shouldShow ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-sm rounded-lg bg-white p-6 shadow-xl transition-transform duration-300 ease-out ${
          shouldShow ? "scale-100" : "scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {(settlement || isBulk) && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">精算を確認</h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-6 rounded-lg bg-gray-100 p-4">
              {isBulk ? (
                <>
                  <div className="mb-3 text-center">
                    <p className="text-sm text-gray-500 mb-1">
                      {isPositive ? "あなたが受け取る金額" : isNegative ? "あなたが支払う金額" : "あなたの合計収支"}
                    </p>
                    <p className={`text-3xl font-bold ${isPositive ? "text-green-600" : isNegative ? "text-red-500" : "text-gray-600"}`}>
                      {isNegative ? "- " : isPositive ? "+ " : ""}{formatCurrency(Math.abs(netAmount))}
                    </p>
                  </div>

                  <div className="max-h-56 space-y-2 overflow-auto rounded-lg bg-white p-3">
                    {settlements.map((s, idx) => (
                      <div
                        key={`${s.expenseId || s.expense_id || "no-expense"}-${idx}`}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-gray-700">
                            {s.title ? s.title : "支出"}
                          </p>
                          <p className="truncate text-xs text-gray-500">
                            {getMemberDisplay(s.from, s.fromGuestName)}
                            <ArrowRight className="mx-1 inline text-gray-400" size={14} />
                            {getMemberDisplay(s.to, s.toGuestName)}
                          </p>
                        </div>
                        <p className="shrink-0 font-medium text-gray-800">
                          {formatCurrency(s.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">支払い元</p>
                      <p className="font-semibold text-gray-800">
                        {getMemberDisplay(settlement.from, settlement.fromGuestName)}
                      </p>
                    </div>
                    <ArrowRight className="text-gray-400" size={24} />
                    <div className="text-center">
                      <p className="text-sm text-gray-500">受取人</p>
                      <p className="font-semibold text-gray-800">
                        {getMemberDisplay(settlement.to, settlement.toGuestName)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-3xl font-bold text-green-600">
                      {formatCurrency(settlement.amount)}
                    </p>
                  </div>
                </>
              )}
            </div>

            <p className="mb-6 text-sm text-gray-600">
              この精算を記録しますか？実際の送金は各自で行ってください。
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-gray-600 transition-colors hover:bg-gray-100"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
              >
                精算完了
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default SettleUpModal;
