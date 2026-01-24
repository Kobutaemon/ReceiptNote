import { X, ArrowRight } from "lucide-react";
import { formatCurrency } from "../../utils/settlementCalculator";

function SettleUpModal({
  isOpen,
  onClose,
  settlement,
  getMemberDisplay,
  onConfirm,
}) {
  const handleConfirm = () => {
    if (settlement) {
      onConfirm(settlement);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gray-500/80 transition-opacity duration-300 ${
        isOpen && settlement ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-sm rounded-lg bg-white p-6 shadow-xl transition-transform duration-300 ease-out ${
          isOpen && settlement ? "scale-100" : "scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
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
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">支払い元</p>
              <p className="font-semibold text-gray-800">
                {getMemberDisplay(settlement.from)}
              </p>
            </div>
            <ArrowRight className="text-gray-400" size={24} />
            <div className="text-center">
              <p className="text-sm text-gray-500">受取人</p>
              <p className="font-semibold text-gray-800">
                {getMemberDisplay(settlement.to)}
              </p>
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(settlement.amount)}
            </p>
          </div>
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
      </div>
    </div>
  );
}

export default SettleUpModal;
