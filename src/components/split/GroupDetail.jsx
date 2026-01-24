import { useState, useEffect } from "react";
import {
  ArrowLeft,
  UserPlus,
  Plus,
  Users,
  Receipt,
  Calculator,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import InviteMemberModal from "./InviteMemberModal";
import AddSplitExpenseModal from "./AddSplitExpenseModal";
import SettlementCalculator from "./SettlementCalculator";
import SettleUpModal from "./SettleUpModal";
import MemberListModal from "./MemberListModal";
import { supabase } from "../../lib/supabaseClient";
import { useToast } from "../../lib/toastContext";
import { getCurrentMonth, getCurrentYear } from "../../utils/dateUtils";
import {
  calculateBalances,
  calculateOptimalSettlements,
  formatCurrency,
} from "../../utils/settlementCalculator";

function GroupDetail({ group, user, onBack }) {
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState(null);
  const [activeTab, setActiveTab] = useState("expenses"); // expenses | settlements
  const [isMemberListOpen, setIsMemberListOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null); // 編集中の支出
  const [expandedExpenseId, setExpandedExpenseId] = useState(null); // 展開中の支出
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const { showToast } = useToast();

  const userId = user?.id ?? null;
  const userEmail = user?.email ?? null;

  // データを読み込み
  const loadData = async () => {
    if (!group?.id) return;

    setIsLoading(true);
    try {
      // メンバー一覧（emailカラムを直接取得）
      const { data: membersData, error: membersError } = await supabase
        .from("group_members")
        .select("user_id, role, joined_at, email")
        .eq("group_id", group.id);

      if (membersError) throw membersError;

      // 自分のメールが保存されていない場合は補完
      const membersWithEmail = (membersData || []).map((member) => {
        if (member.user_id === userId && !member.email) {
          return { ...member, email: userEmail };
        }
        return member;
      });

      setMembers(membersWithEmail);

      // 支出一覧
      const { data: expensesData, error: expensesError } = await supabase
        .from("split_expenses")
        .select(`
          id,
          title,
          amount,
          paid_by,
          expense_date,
          created_at,
          expense_participants (
            id,
            user_id,
            share_amount,
            is_settled
          )
        `)
        .eq("group_id", group.id)
        .order("expense_date", { ascending: false });

      if (expensesError) throw expensesError;
      setExpenses(expensesData || []);

      // 精算記録
      const { data: settlementsData, error: settlementsError } = await supabase
        .from("settlements")
        .select("*")
        .eq("group_id", group.id)
        .order("settled_at", { ascending: false });

      if (settlementsError) throw settlementsError;
      setSettlements(settlementsData || []);
    } catch (error) {
      console.error("データの取得に失敗しました", error);
      showToast("データの取得に失敗しました", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [group?.id]);

  // 招待送信
  const handleInvite = async (email) => {
    try {
      // 招待を作成（重複チェックはDBのUNIQUE制約に任せる）
      const { error } = await supabase.from("group_invitations").insert({
        group_id: group.id,
        invited_email: email,
        invited_by: userId,
      });

      if (error) {
        // 重複キー制約エラー
        if (error.code === "23505") {
          return { error: "このメールアドレスには既に招待を送信しています" };
        }
        throw error;
      }

      showToast("招待を送信しました", "success");
      setIsInviteModalOpen(false);
      return {};
    } catch (error) {
      console.error("招待の送信に失敗しました", error);
      return { error: "招待の送信に失敗しました" };
    }
  };

  // 支出追加
  const handleAddExpense = async (expenseData) => {
    try {
      // 支出を作成
      const { data: newExpense, error: expenseError } = await supabase
        .from("split_expenses")
        .insert({
          group_id: group.id,
          title: expenseData.title,
          amount: expenseData.amount,
          paid_by: expenseData.paidBy,
          expense_date: expenseData.expenseDate,
        })
        .select()
        .single();

      if (expenseError) throw expenseError;

      // 参加者を追加
      const participantsPayload = expenseData.participants.map((p) => ({
        expense_id: newExpense.id,
        user_id: p.userId,
        share_amount: p.shareAmount,
      }));

      const { error: participantsError } = await supabase
        .from("expense_participants")
        .insert(participantsPayload);

      if (participantsError) throw participantsError;

      showToast("支出を追加しました", "success");
      setIsExpenseModalOpen(false);
      await loadData();
    } catch (error) {
      console.error("支出の追加に失敗しました", error);
      showToast("支出の追加に失敗しました", "error");
    }
  };

  // 精算を実行
  const handleSettle = async (settlement) => {
    try {
      const { error } = await supabase.from("settlements").insert({
        group_id: group.id,
        from_user: settlement.from,
        to_user: settlement.to,
        amount: settlement.amount,
      });

      if (error) throw error;

      showToast("精算を記録しました", "success");
      setIsSettleModalOpen(false);
      setSelectedSettlement(null);
      await loadData();
    } catch (error) {
      console.error("精算の記録に失敗しました", error);
      showToast("精算の記録に失敗しました", "error");
    }
  };

  // 支出を削除
  const handleDeleteExpense = async (expense) => {
    const shouldDelete = window.confirm(
      `「${expense.title}」を削除しますか？\nこの操作は取り消せません。`
    );
    if (!shouldDelete) return;

    try {
      // 参加者を先に削除（外部キー制約のため）
      const { error: participantsError } = await supabase
        .from("expense_participants")
        .delete()
        .eq("expense_id", expense.id);

      if (participantsError) throw participantsError;

      // 支出を削除
      const { error: expenseError } = await supabase
        .from("split_expenses")
        .delete()
        .eq("id", expense.id);

      if (expenseError) throw expenseError;

      showToast("支出を削除しました", "success");
      await loadData();
    } catch (error) {
      console.error("支出の削除に失敗しました", error);
      showToast("支出の削除に失敗しました", "error");
    }
  };

  // グループ脱退
  const handleLeaveGroup = async () => {
    const shouldLeave = window.confirm(
      "本当にこのグループを脱退しますか？\n未精算の残高がある場合は、先に精算してください。"
    );
    if (!shouldLeave) return;

    try {
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", group.id)
        .eq("user_id", userId);

      if (error) throw error;

      showToast("グループを脱退しました", "success");
      onBack();
    } catch (error) {
      console.error("グループの脱退に失敗しました", error);
      showToast("グループの脱退に失敗しました", "error");
    }
  };

  // 現在のユーザーがオーナーかどうか
  const currentMember = members.find((m) => m.user_id === userId);
  const isOwner = currentMember?.role === "owner";

  // 残高計算
  const balances = calculateBalances(expenses, settlements);
  const optimalSettlements = calculateOptimalSettlements(balances);

  // メンバーのメール/ID表示用ヘルパー
  const getMemberDisplay = (memberId) => {
    const member = members.find((m) => m.user_id === memberId);
    if (member?.email) return member.email;
    if (memberId === userId) return userEmail || "自分";
    return memberId.slice(0, 8) + "...";
  };

  return (
    <div className="p-6">
      {/* ヘッダー */}
      <div className="mb-6">
        <button
          type="button"
          onClick={onBack}
          className="mb-4 flex items-center gap-2 text-gray-600 transition-colors hover:text-gray-800"
        >
          <ArrowLeft size={20} />
          <span>戻る</span>
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{group.name}</h2>
            {group.description && (
              <p className="text-gray-500">{group.description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-300"
          >
            <UserPlus size={18} />
            <span>招待</span>
          </button>
        </div>

        {/* メンバー数（クリックでモーダル表示） */}
        <button
          type="button"
          onClick={() => setIsMemberListOpen(true)}
          className="mt-2 flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors"
        >
          <Users size={16} />
          <span className="underline underline-offset-2">{members.length}人のメンバー</span>
        </button>
      </div>

      {/* タブ */}
      <div className="mb-6 flex border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab("expenses")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "expenses"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Receipt size={18} />
          <span>支出一覧</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("settlements")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "settlements"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Calculator size={18} />
          <span>精算</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-gray-500">読み込み中...</div>
      ) : activeTab === "expenses" ? (
        <>
          {/* 月別セレクター */}
          <div className="mb-4 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => {
                const month = parseInt(selectedMonth, 10);
                const year = parseInt(selectedYear, 10);
                if (month === 1) {
                  setSelectedMonth("12");
                  setSelectedYear((year - 1).toString());
                } else {
                  setSelectedMonth((month - 1).toString().padStart(2, "0"));
                }
              }}
              className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="min-w-[120px] text-center text-lg font-semibold text-gray-800">
              {selectedYear}年{selectedMonth}月
            </span>
            <button
              type="button"
              onClick={() => {
                const month = parseInt(selectedMonth, 10);
                const year = parseInt(selectedYear, 10);
                if (month === 12) {
                  setSelectedMonth("01");
                  setSelectedYear((year + 1).toString());
                } else {
                  setSelectedMonth((month + 1).toString().padStart(2, "0"));
                }
              }}
              className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* 支出追加ボタン */}
          <button
            type="button"
            onClick={() => setIsExpenseModalOpen(true)}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-4 text-gray-500 transition-colors hover:border-blue-400 hover:text-blue-600"
          >
            <Plus size={20} />
            <span>支出を追加</span>
          </button>

          {/* 支出一覧（月別フィルタリング） */}
          {expenses.length === 0 ? (
            <div className="rounded-lg border border-gray-200 p-8 text-center text-gray-500">
              まだ支出がありません
            </div>
          ) : (
            <div className="space-y-3">
              {expenses
                .filter((expense) => {
                  const expenseDate = new Date(expense.expense_date);
                  const expenseYear = expenseDate.getFullYear().toString();
                  const expenseMonth = (expenseDate.getMonth() + 1).toString().padStart(2, "0");
                  return expenseYear === selectedYear && expenseMonth === selectedMonth;
                })
                .map((expense) => {
                const isExpanded = expandedExpenseId === expense.id;
                return (
                  <div
                    key={expense.id}
                    className="rounded-lg bg-white shadow-sm overflow-hidden"
                  >
                    {/* クリック可能なヘッダー */}
                    <button
                      type="button"
                      onClick={() => setExpandedExpenseId(isExpanded ? null : expense.id)}
                      className="w-full p-4 text-left transition-colors hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-800">
                            {expense.title}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {getMemberDisplay(expense.paid_by)} が支払い
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(expense.expense_date).toLocaleDateString(
                              "ja-JP"
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-800">
                            {formatCurrency(expense.amount)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {expense.expense_participants?.length || 0}人で割り勘
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* 展開時の詳細 */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                        <p className="mb-2 text-xs font-medium text-gray-500">各自の負担額</p>
                        <div className="space-y-1.5">
                          {expense.expense_participants?.map((participant) => (
                            <div
                              key={participant.id}
                              className="flex items-center justify-end gap-4 text-sm"
                            >
                              <span className="text-gray-700 text-right">
                                {getMemberDisplay(participant.user_id)}
                              </span>
                              <span className="font-medium text-gray-800 min-w-[80px] text-right">
                                {formatCurrency(participant.share_amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 削除ボタン（支払者のみ表示） */}
                    {expense.paid_by === userId && (
                      <div className="flex justify-end gap-2 border-t border-gray-100 px-4 py-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteExpense(expense);
                          }}
                          className="flex items-center gap-1 rounded px-3 py-1.5 text-xs text-red-600 transition-colors hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                          <span>削除</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {expenses.filter((expense) => {
                const expenseDate = new Date(expense.expense_date);
                const expenseYear = expenseDate.getFullYear().toString();
                const expenseMonth = (expenseDate.getMonth() + 1).toString().padStart(2, "0");
                return expenseYear === selectedYear && expenseMonth === selectedMonth;
              }).length === 0 && (
                <div className="rounded-lg border border-gray-200 p-8 text-center text-gray-500">
                  {selectedYear}年{selectedMonth}月の支出はありません
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <SettlementCalculator
          balances={balances}
          optimalSettlements={optimalSettlements}
          getMemberDisplay={getMemberDisplay}
          currentUserId={userId}
          onSettle={(settlement) => {
            setSelectedSettlement(settlement);
            setIsSettleModalOpen(true);
          }}
          pastSettlements={settlements}
        />
      )}

      {/* モーダル */}
      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSubmit={handleInvite}
        groupName={group.name}
      />

      <AddSplitExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSubmit={handleAddExpense}
        members={members}
        currentUserId={userId}
      />

      <SettleUpModal
        isOpen={isSettleModalOpen}
        onClose={() => {
          setIsSettleModalOpen(false);
          setSelectedSettlement(null);
        }}
        settlement={selectedSettlement}
        getMemberDisplay={getMemberDisplay}
        onConfirm={handleSettle}
      />

      <MemberListModal
        isOpen={isMemberListOpen}
        onClose={() => setIsMemberListOpen(false)}
        members={members}
        currentUserId={userId}
        getMemberDisplay={getMemberDisplay}
        onLeaveGroup={handleLeaveGroup}
        isOwner={isOwner}
      />
    </div>
  );
}

export default GroupDetail;
