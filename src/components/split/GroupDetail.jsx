import { useState, useEffect } from "react";
import {
  ArrowLeft,
  UserPlus,
  Plus,
  Users,
  Receipt,
  Calculator,
} from "lucide-react";
import InviteMemberModal from "./InviteMemberModal";
import AddSplitExpenseModal from "./AddSplitExpenseModal";
import SettlementCalculator from "./SettlementCalculator";
import SettleUpModal from "./SettleUpModal";
import { supabase } from "../../lib/supabaseClient";
import { useToast } from "../../lib/toastContext";
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
  const { showToast } = useToast();

  const userId = user?.id ?? null;
  const userEmail = user?.email ?? null;

  // データを読み込み
  const loadData = async () => {
    if (!group?.id) return;

    setIsLoading(true);
    try {
      // メンバー一覧
      const { data: membersData, error: membersError } = await supabase
        .from("group_members")
        .select("user_id, role, joined_at")
        .eq("group_id", group.id);

      if (membersError) throw membersError;

      // ユーザーのメールアドレスを取得するため、auth.usersにはアクセスできないので
      // 招待テーブルから取得するか、member自体にemailを保存する方法を検討
      // 暫定的にuser_idのみ表示
      const membersWithEmail = await Promise.all(
        (membersData || []).map(async (member) => {
          // 招待テーブルからメールを取得する代替手段
          // または、グループ内で自分のメールは分かる
          if (member.user_id === userId) {
            return { ...member, email: userEmail };
          }
          // 他のユーザーのメールは招待履歴から取得
          const { data: inviteData } = await supabase
            .from("group_invitations")
            .select("invited_email")
            .eq("group_id", group.id)
            .eq("status", "accepted")
            .limit(100);

          // group_membersとマッチングは困難なので、暫定でIDを表示
          return { ...member, email: null };
        })
      );

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
      // 既に招待済みか確認
      const { data: existingInvite } = await supabase
        .from("group_invitations")
        .select("id, status")
        .eq("group_id", group.id)
        .eq("invited_email", email)
        .single();

      if (existingInvite) {
        if (existingInvite.status === "pending") {
          return { error: "このメールアドレスには既に招待を送信しています" };
        }
        if (existingInvite.status === "accepted") {
          return { error: "このユーザーは既にグループに参加しています" };
        }
      }

      // 招待を作成
      const { error } = await supabase.from("group_invitations").insert({
        group_id: group.id,
        invited_email: email,
        invited_by: userId,
      });

      if (error) throw error;

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

        {/* メンバー数 */}
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
          <Users size={16} />
          <span>{members.length}人のメンバー</span>
        </div>
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
          {/* 支出追加ボタン */}
          <button
            type="button"
            onClick={() => setIsExpenseModalOpen(true)}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-4 text-gray-500 transition-colors hover:border-blue-400 hover:text-blue-600"
          >
            <Plus size={20} />
            <span>支出を追加</span>
          </button>

          {/* 支出一覧 */}
          {expenses.length === 0 ? (
            <div className="rounded-lg border border-gray-200 p-8 text-center text-gray-500">
              まだ支出がありません
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="rounded-lg bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
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
                </div>
              ))}
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
    </div>
  );
}

export default GroupDetail;
