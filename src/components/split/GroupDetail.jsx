import { useState, useEffect } from "react";
import {
  ArrowLeft,
  UserPlus,
  Plus,
  Users,
  Receipt,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import MonthSelector from "../MonthSelector";
import InviteMemberModal from "./InviteMemberModal";
import AddSplitExpenseModal from "./AddSplitExpenseModal";
import SettleUpModal from "./SettleUpModal";
import MemberListModal from "./MemberListModal";
import { supabase } from "../../lib/supabaseClient";
import { useToast } from "../../lib/toastContext";
import { getCurrentMonth, getCurrentYear } from "../../utils/dateUtils";
import { formatCurrency } from "../../utils/settlementCalculator";

function GroupDetail({ group, user, onBack }) {
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState(null);
  const [selectedExpenseSettlements, setSelectedExpenseSettlements] = useState(
    [],
  );
  const [isMemberListOpen, setIsMemberListOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null); // 編集中の支出
  const [expandedExpenseId, setExpandedExpenseId] = useState(null); // 展開中の支出
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [selectedExpenseIds, setSelectedExpenseIds] = useState(() => new Set());
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

      // profilesからdisplay_nameを取得
      const userIds = (membersData || []).map((m) => m.user_id);
      let profilesMap = {};
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", userIds);

        if (profilesData) {
          profilesData.forEach((profile) => {
            profilesMap[profile.id] = profile.display_name;
          });
        }
      }

      // メンバーにプロフィール情報を付加
      const membersWithProfile = (membersData || []).map((member) => {
        const displayName = profilesMap[member.user_id] || null;
        return {
          ...member,
          email: member.email || (member.user_id === userId ? userEmail : null),
          display_name: displayName,
        };
      });

      setMembers(membersWithProfile);

      // 支出一覧
      const { data: expensesData, error: expensesError } = await supabase
        .from("split_expenses")
        .select(
          `
          id,
          title,
          amount,
          paid_by,
          paid_by_guest_name,
          expense_date,
          created_at,
          expense_participants (
            id,
            user_id,
            guest_name,
            share_amount,
            is_settled
          )
        `,
        )
        .eq("group_id", group.id)
        .order("created_at", { ascending: false });

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
      // 1. 既にグループメンバーかチェック
      const { data: existingMember } = await supabase
        .from("group_members")
        .select("user_id")
        .eq("group_id", group.id)
        .eq("email", email)
        .maybeSingle();

      if (existingMember) {
        return { error: "このユーザーは既にグループのメンバーです" };
      }

      // 2. pending状態の招待が既にあるかチェック
      const { data: pendingInvitation } = await supabase
        .from("group_invitations")
        .select("id")
        .eq("group_id", group.id)
        .eq("invited_email", email)
        .eq("status", "pending")
        .maybeSingle();

      if (pendingInvitation) {
        return { error: "このメールアドレスには既に招待を送信しています" };
      }

      // 3. 過去の招待（accepted/declined）を削除して再招待を可能にする
      await supabase
        .from("group_invitations")
        .delete()
        .eq("group_id", group.id)
        .eq("invited_email", email)
        .in("status", ["accepted", "declined"]);

      // 4. 新しい招待を作成
      const { error } = await supabase.from("group_invitations").insert({
        group_id: group.id,
        invited_email: email,
        invited_by: userId,
      });

      if (error) {
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
          paid_by: expenseData.paidBy || null,
          paid_by_guest_name: expenseData.paidByGuestName || null,
          expense_date: expenseData.expenseDate,
        })
        .select()
        .single();

      if (expenseError) throw expenseError;

      // 登録メンバーの参加者を追加
      const participantsPayload = expenseData.participants.map((p) => ({
        expense_id: newExpense.id,
        user_id: p.userId,
        share_amount: p.shareAmount,
      }));

      // ゲスト参加者を追加
      const guestPayload = (expenseData.guests || []).map((g) => ({
        expense_id: newExpense.id,
        user_id: null,
        guest_name: g.guestName,
        share_amount: g.shareAmount,
      }));

      const allPayload = [...participantsPayload, ...guestPayload];

      if (allPayload.length > 0) {
        const { error: participantsError } = await supabase
          .from("expense_participants")
          .insert(allPayload);

        if (participantsError) throw participantsError;
      }

      showToast("支出を追加しました", "success");
      setIsExpenseModalOpen(false);
      await loadData();
    } catch (error) {
      console.error("支出の追加に失敗しました", error);
      showToast("支出の追加に失敗しました", "error");
    }
  };

  // 精算を実行
  const handleSettle = async (settlementOrSettlements) => {
    try {
      const rows = Array.isArray(settlementOrSettlements)
        ? settlementOrSettlements
        : [settlementOrSettlements];

      const payload = rows.map((s) => ({
        group_id: group.id,
        from_user: s.fromGuestName ? null : s.from,
        from_guest_name: s.fromGuestName || null,
        to_user: s.toGuestName ? null : s.to,
        to_guest_name: s.toGuestName || null,
        amount: s.amount,
        expense_id: s.expenseId || s.expense_id || null,
      }));

      const { error } = await supabase.from("settlements").insert(payload);

      if (error) throw error;

      showToast("精算を記録しました", "success");
      setIsSettleModalOpen(false);
      setSelectedSettlement(null);
      setSelectedExpenseSettlements([]);
      setSelectedExpenseIds(new Set());
      await loadData();
    } catch (error) {
      console.error("精算の記録に失敗しました", error);
      showToast("精算の記録に失敗しました", "error");
    }
  };

  // 支出を削除
  const handleDeleteExpense = async (expense) => {
    const shouldDelete = window.confirm(
      `「${expense.title}」を削除しますか？\nこの操作は取り消せません。`,
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
      "本当にこのグループを脱退しますか？\n未精算の残高がある場合は、先に精算してください。",
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

  // グループ削除（オーナーのみ）
  const handleDeleteGroup = async () => {
    const shouldDelete = window.confirm(
      `「${group.name}」を削除しますか？\n\nこの操作は取り消せません。\nすべての支出・精算記録も削除されます。`,
    );
    if (!shouldDelete) return;

    try {
      // 1. 支出の参加者を削除
      const { data: expenseIds } = await supabase
        .from("split_expenses")
        .select("id")
        .eq("group_id", group.id);

      if (expenseIds && expenseIds.length > 0) {
        const ids = expenseIds.map((e) => e.id);
        await supabase
          .from("expense_participants")
          .delete()
          .in("expense_id", ids);
      }

      // 2. 支出を削除
      await supabase.from("split_expenses").delete().eq("group_id", group.id);

      // 3. 精算記録を削除
      await supabase.from("settlements").delete().eq("group_id", group.id);

      // 4. 招待を削除
      await supabase
        .from("group_invitations")
        .delete()
        .eq("group_id", group.id);

      // 5. メンバーを削除
      await supabase.from("group_members").delete().eq("group_id", group.id);

      // 6. グループを削除
      const { error } = await supabase
        .from("split_groups")
        .delete()
        .eq("id", group.id);

      if (error) throw error;

      showToast("グループを削除しました", "success");
      onBack();
    } catch (error) {
      console.error("グループの削除に失敗しました", error);
      showToast("グループの削除に失敗しました", "error");
    }
  };

  // 現在のユーザーがオーナーかどうか
  const currentMember = members.find((m) => m.user_id === userId);
  const isOwner = currentMember?.role === "owner";

  // メンバーの表示名ヘルパー（ユーザー名 > メール > ID）
  // ゲスト名も対応: memberIdがnullの場合はguestNameを使用
  const getMemberDisplay = (memberId, guestName) => {
    // ゲストの場合
    if (!memberId && guestName) return guestName;
    if (!memberId) return "不明";
    const member = members.find((m) => m.user_id === memberId);
    // ユーザー名が設定されていれば優先表示
    if (member?.display_name) return member.display_name;
    if (member?.email) return member.email;
    if (memberId === userId) return userEmail || "自分";
    return memberId.slice(0, 8) + "...";
  };

  // ある支出について、特定参加者1人分の「未精算額」を計算
  // participant: expense_participants の1行（user_id or guest_name を持つ）
  const getRemainingForParticipant = (expense, participant) => {
    if (!participant) return 0;

    const share = Number(participant.share_amount) || 0;

    const settled = (settlements || [])
      .filter((s) => {
        if (s.expense_id !== expense.id) return false;
        // 精算先（to）が支払者かチェック
        if (expense.paid_by) {
          if (s.to_user !== expense.paid_by) return false;
        } else if (expense.paid_by_guest_name) {
          if (s.to_guest_name !== expense.paid_by_guest_name) return false;
        } else {
          return false;
        }
        // ゲストの場合はguest_nameで照合
        if (participant.guest_name) {
          return s.from_guest_name === participant.guest_name;
        }
        return s.from_user === participant.user_id;
      })
      .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

    const remaining = Math.max(0, Math.round((share - settled) * 100) / 100);
    return remaining;
  };

  // 支出全体の未精算合計（すべての参加者分の合計）
  const getExpenseRemainingTotal = (expense) => {
    const participants = expense.expense_participants || [];
    return participants
      .filter((p) => {
        // 支払者自身を除外
        if (expense.paid_by && p.user_id === expense.paid_by) return false;
        if (expense.paid_by_guest_name && p.guest_name === expense.paid_by_guest_name) return false;
        return true;
      })
      .reduce(
        (sum, p) => sum + getRemainingForParticipant(expense, p),
        0,
      );
  };

  // 自分の未精算額（支出1件あたり）
  const getMyRemainingForExpense = (expense) => {
    if (!userId) return 0;
    // 自分が支払者の場合は「受け取り側」なので、自分の未精算としては表示しない
    if (expense.paid_by === userId) return 0;
    const participants = expense.expense_participants || [];
    const myParticipant = participants.find((p) => p.user_id === userId);
    return getRemainingForParticipant(expense, myParticipant);
  };

  const toggleSelectedExpense = (expenseId) => {
    setSelectedExpenseIds((prev) => {
      const next = new Set(prev);
      if (next.has(expenseId)) next.delete(expenseId);
      else next.add(expenseId);
      return next;
    });
  };

  // 支出1件に対して、全参加者分の精算レコードを生成
  const buildSettlementsForExpense = (expense) => {
    const participants = expense.expense_participants || [];

    return participants
      .filter((p) => {
        // 支払者自身を除外
        if (expense.paid_by && p.user_id === expense.paid_by) return false;
        if (expense.paid_by_guest_name && p.guest_name === expense.paid_by_guest_name) return false;
        return true;
      })
      .map((p) => {
        const remaining = getRemainingForParticipant(expense, p);
        if (!remaining || remaining <= 0) return null;
        return {
          from: p.user_id || null,
          fromGuestName: p.guest_name || null,
          to: expense.paid_by || null,
          toGuestName: expense.paid_by_guest_name || null,
          amount: remaining,
          expenseId: expense.id,
          title: expense.title,
        };
      })
      .filter(Boolean);
  };

  const openSettleModalForExpense = (expense) => {
    const items = buildSettlementsForExpense(expense);
    if (!items || items.length === 0) {
      showToast("この支払いはすでに全員精算済みです", "info");
      return;
    }
    setSelectedSettlement(null);
    setSelectedExpenseSettlements(items);
    setIsSettleModalOpen(true);
  };

  const openSettleModalForSelected = (filteredExpenses) => {
    const selected = filteredExpenses.filter((e) =>
      selectedExpenseIds.has(e.id),
    );

    const items = selected.flatMap((e) => buildSettlementsForExpense(e));
    if (!items || items.length === 0) {
      showToast("選択した支出はすでに全員精算済みです", "info");
      return;
    }
    setSelectedSettlement(null);
    setSelectedExpenseSettlements(items);
    setIsSettleModalOpen(true);
  };

  // 月フィルタ後の支出一覧（UIで使い回す）
  const filteredExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(expense.expense_date);
    const expenseYear = expenseDate.getFullYear().toString();
    const expenseMonth = (expenseDate.getMonth() + 1)
      .toString()
      .padStart(2, "0");
    return expenseYear === selectedYear && expenseMonth === selectedMonth;
  });

  const allFilteredSelected =
    filteredExpenses.length > 0 &&
    filteredExpenses.every((e) => selectedExpenseIds.has(e.id));

  const handleToggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      // 現在表示中の分だけ選択解除
      setSelectedExpenseIds((prev) => {
        const next = new Set(prev);
        filteredExpenses.forEach((e) => next.delete(e.id));
        return next;
      });
    } else {
      // 現在表示中の分をすべて選択
      setSelectedExpenseIds((prev) => {
        const next = new Set(prev);
        filteredExpenses.forEach((e) => next.add(e.id));
        return next;
      });
    }
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
          <span className="underline underline-offset-2">
            {members.length}人のメンバー
          </span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-gray-500">読み込み中...</div>
      ) : (
        <>
          {/* 月別セレクター */}
          <MonthSelector
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onYearChange={setSelectedYear}
            onMonthChange={setSelectedMonth}
          />

          {/* 支出追加ボタン + 支出一覧（max-width適用） */}
          <div className="mx-auto max-w-2xl">
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
            {filteredExpenses.length === 0 ? (
              <div className="rounded-lg border border-gray-200 p-8 text-center text-gray-500">
                まだ支出がありません
              </div>
            ) : (
              <>
                {/* 説明テキストと一括選択ボタン */}
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-600">
                    精算したいものをチェック
                  </p>
                  <button
                    type="button"
                    onClick={handleToggleSelectAllFiltered}
                    className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      allFilteredSelected
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "border-2 border-blue-500 text-blue-600 hover:bg-blue-50"
                    }`}
                  >
                    <CheckCircle2 size={16} />
                    {allFilteredSelected ? "選択解除" : "すべて選択"}
                  </button>
                </div>

                <div className="space-y-3">
                  {(() => {
                    const selectedCount = filteredExpenses.filter((e) =>
                      selectedExpenseIds.has(e.id),
                    ).length;

                    const selectedTotal = filteredExpenses
                      .filter((e) => selectedExpenseIds.has(e.id))
                      .reduce((sum, e) => sum + getMyRemainingForExpense(e), 0);

                    return (
                      <>
                        {filteredExpenses.map((expense) => {
                          const isExpanded = expandedExpenseId === expense.id;
                          const remainingTotal =
                            getExpenseRemainingTotal(expense);
                          const myRemaining = getMyRemainingForExpense(expense);
                          const canSelect = remainingTotal > 0;
                          const isSelected = selectedExpenseIds.has(expense.id);

                          const isSettled = remainingTotal === 0;

                          return (
                            <div
                              key={expense.id}
                              className={`rounded-lg shadow-sm overflow-hidden ${
                                isSettled
                                  ? "bg-green-50 border border-green-200"
                                  : "bg-white"
                              }`}
                            >
                              {/* 精算済みバッジ */}
                              {isSettled && (
                                <div className="flex items-center gap-1.5 bg-green-100 px-4 py-1.5 text-xs font-medium text-green-700">
                                  <CheckCircle2 size={14} />
                                  精算済み
                                </div>
                              )}
                              {/* クリック可能なヘッダー */}
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedExpenseId(
                                    isExpanded ? null : expense.id,
                                  )
                                }
                                className={`w-full p-4 text-left transition-colors ${isSettled ? "hover:bg-green-100" : "hover:bg-gray-50"}`}
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <h3 className="font-medium text-gray-800">
                                      {expense.title}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                      {getMemberDisplay(expense.paid_by, expense.paid_by_guest_name)}{" "}
                                      が支払い
                                    </p>
                                    <p className="text-xs text-gray-400">
                                      {new Date(
                                        expense.expense_date,
                                      ).toLocaleDateString("ja-JP")}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <div className="flex items-center justify-end gap-3">
                                      {!isSettled && (
                                        <input
                                          type="checkbox"
                                          aria-label="この支出を選択"
                                          checked={isSelected}
                                          onClick={(e) => e.stopPropagation()}
                                          onChange={() =>
                                            toggleSelectedExpense(expense.id)
                                          }
                                          className="h-4 w-4 rounded border-gray-300 text-blue-600"
                                        />
                                      )}
                                      <p className="text-lg font-semibold text-gray-800">
                                        {formatCurrency(expense.amount)}
                                      </p>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                      {expense.expense_participants?.length ||
                                        0}
                                      人で割り勘
                                    </p>
                                    {myRemaining > 0 ? (
                                      <p className="mt-1 text-xs text-blue-600">
                                        自分の未精算:{" "}
                                        {formatCurrency(myRemaining)}
                                      </p>
                                    ) : isSettled ? (
                                      <p className="mt-1 text-xs text-green-600 font-medium">
                                        ✓ 全員精算完了
                                      </p>
                                    ) : null}
                                  </div>
                                </div>
                              </button>

                              {/* 展開時の詳細 */}
                              {isExpanded && (
                                <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                                  <p className="mb-2 text-xs font-medium text-gray-500">
                                    各自の負担額
                                  </p>
                                  <div className="space-y-1.5">
                                    {expense.expense_participants?.map(
                                      (participant) => (
                                        <div
                                          key={participant.id}
                                          className="flex items-center justify-end gap-4 text-sm"
                                        >
                                          <span className="text-gray-700 text-right flex items-center gap-1.5">
                                            {participant.guest_name && (
                                              <span className="inline-flex items-center rounded-full bg-amber-200 px-1.5 py-0.5 text-xs font-medium text-amber-800">
                                                ゲスト
                                              </span>
                                            )}
                                            {getMemberDisplay(
                                              participant.user_id,
                                              participant.guest_name,
                                            )}
                                          </span>
                                          <span className="font-medium text-gray-800 min-w-[80px] text-right">
                                            {formatCurrency(
                                              participant.share_amount,
                                            )}
                                          </span>
                                        </div>
                                      ),
                                    )}
                                  </div>

                                  {/* 自分の精算（支出単位） */}
                                  {canSelect && (
                                    <div className="mt-4 flex justify-end">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          openSettleModalForExpense(expense)
                                        }
                                        className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white transition-colors hover:bg-green-700"
                                      >
                                        この支払いを精算する
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* 削除ボタン（支払者 or ゲスト支払いの場合はメンバーなら表示） */}
                              {(expense.paid_by === userId || !expense.paid_by) && (
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

                        {filteredExpenses.length === 0 && (
                          <div className="rounded-lg border border-gray-200 p-8 text-center text-gray-500">
                            {selectedYear}年{selectedMonth}月の支出はありません
                          </div>
                        )}

                        {/* 複数選択アクション */}
                        {selectedCount > 0 && (
                          <div className="sticky bottom-4 z-10 rounded-lg border border-gray-200 bg-white p-4 shadow-md">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                              <div className="text-sm text-gray-700">
                                <span className="font-medium">
                                  {selectedCount}件
                                </span>
                                を選択中（自分の未精算合計:{" "}
                                <span className="font-medium">
                                  {formatCurrency(selectedTotal)}
                                </span>
                                ）
                              </div>
                              <div className="flex gap-2 self-end">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedExpenseIds(new Set())
                                  }
                                  className="rounded-lg px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100"
                                >
                                  選択解除
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    openSettleModalForSelected(filteredExpenses)
                                  }
                                  className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white transition-colors hover:bg-green-700"
                                >
                                  まとめて精算する
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </>
            )}
          </div>
        </>
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
          setSelectedExpenseSettlements([]);
        }}
        settlement={selectedSettlement}
        settlements={selectedExpenseSettlements}
        getMemberDisplay={getMemberDisplay}
        onConfirm={handleSettle}
        currentUserId={userId}
      />

      <MemberListModal
        isOpen={isMemberListOpen}
        onClose={() => setIsMemberListOpen(false)}
        members={members}
        currentUserId={userId}
        getMemberDisplay={getMemberDisplay}
        onLeaveGroup={handleLeaveGroup}
        onDeleteGroup={handleDeleteGroup}
        isOwner={isOwner}
      />
    </div>
  );
}

export default GroupDetail;
