import { ArrowRight, CheckCircle } from "lucide-react";
import { formatBalance, formatCurrency } from "../../utils/settlementCalculator";

function SettlementCalculator({
  balances,
  optimalSettlements,
  getMemberDisplay,
  currentUserId,
  onSettle,
  pastSettlements,
}) {
  const userBalance = balances[currentUserId] || 0;
  const balanceInfo = formatBalance(userBalance);

  return (
    <div>
      {/* 自分の残高 */}
      <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
        <h3 className="mb-2 text-sm font-medium text-gray-500">あなたの残高</h3>
        <p className={`text-3xl font-bold ${balanceInfo.className}`}>
          {balanceInfo.text}
        </p>
        <p className="text-sm text-gray-500">{balanceInfo.description}</p>
      </div>

      {/* 精算提案 */}
      <div className="mb-6">
        <h3 className="mb-3 text-lg font-semibold text-gray-800">精算提案</h3>
        {optimalSettlements.length === 0 ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
            <CheckCircle className="mx-auto mb-2 text-green-600" size={32} />
            <p className="font-medium text-green-800">全員精算済みです！</p>
          </div>
        ) : (
          <div className="space-y-3">
            {optimalSettlements.map((settlement, index) => {
              const isMySettlement =
                settlement.from === currentUserId ||
                settlement.to === currentUserId;

              return (
                <div
                  key={`${settlement.from}-${settlement.to}-${index}`}
                  className={`flex items-center justify-between rounded-lg p-4 ${
                    isMySettlement ? "bg-blue-50" : "bg-white"
                  } shadow-sm`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-800">
                        {getMemberDisplay(settlement.from)}
                      </p>
                      {settlement.from === currentUserId && (
                        <span className="text-xs text-blue-600">(自分)</span>
                      )}
                    </div>
                    <ArrowRight className="text-gray-400" size={20} />
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-800">
                        {getMemberDisplay(settlement.to)}
                      </p>
                      {settlement.to === currentUserId && (
                        <span className="text-xs text-blue-600">(自分)</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-semibold text-gray-800">
                      {formatCurrency(settlement.amount)}
                    </p>
                    {isMySettlement && (
                      <button
                        type="button"
                        onClick={() => onSettle(settlement)}
                        className="rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-green-700"
                      >
                        精算する
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 全員の残高 */}
      <div className="mb-6">
        <h3 className="mb-3 text-lg font-semibold text-gray-800">全員の残高</h3>
        <div className="space-y-2">
          {Object.entries(balances)
            .sort(([, a], [, b]) => b - a)
            .map(([memberId, balance]) => {
              const info = formatBalance(balance);
              return (
                <div
                  key={memberId}
                  className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm"
                >
                  <span className="text-gray-800">
                    {getMemberDisplay(memberId)}
                    {memberId === currentUserId && (
                      <span className="ml-2 text-xs text-gray-500">(自分)</span>
                    )}
                  </span>
                  <span className={`font-medium ${info.className}`}>
                    {info.text}
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      {/* 精算履歴 */}
      {pastSettlements && pastSettlements.length > 0 && (
        <div>
          <h3 className="mb-3 text-lg font-semibold text-gray-800">精算履歴</h3>
          <div className="space-y-2">
            {pastSettlements.map((settlement) => (
              <div
                key={settlement.id}
                className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
              >
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>{getMemberDisplay(settlement.from_user)}</span>
                  <ArrowRight size={16} />
                  <span>{getMemberDisplay(settlement.to_user)}</span>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-800">
                    {formatCurrency(settlement.amount)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(settlement.settled_at).toLocaleDateString("ja-JP")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SettlementCalculator;
