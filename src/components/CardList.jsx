import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import Card from "./Card";
import EditCardModal from "./EditCardModal";
import AddExpenseModal from "./AddExpenseModal";
import CardDetailModal from "./CardDetailModal";
import { supabase } from "../lib/supabaseClient";

const DEFAULT_CATEGORIES = [
  {
    svgName: "Bike",
    svgColor: "blue",
    cardTitle: "駐輪代",
  },
  {
    svgName: "ShoppingBag",
    svgColor: "purple",
    cardTitle: "買い物代",
  },
  {
    svgName: "User",
    svgColor: "green",
    cardTitle: "交際費(代)",
  },
  {
    svgName: "Ellipsis",
    svgColor: "gray",
    cardTitle: "その他",
  },
];

const mapCategoryRow = (row) => ({
  id: row.id,
  svgName: row.icon ?? row.svgName,
  svgColor: row.color ?? row.svgColor,
  cardTitle: row.title ?? row.cardTitle,
});

function CardList({ selectedMonth, user, onExpensesMutated }) {
  const [cards, setCards] = useState([]);
  const [editingCard, setEditingCard] = useState(null);
  const [expenseModalCard, setExpenseModalCard] = useState(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [detailCard, setDetailCard] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) {
      setCards([]);
      return;
    }

    let isMounted = true;

    const loadCategories = async () => {
      setIsLoading(true);

      const { data, error } = await supabase
        .from("categories")
        .select("id, user_id, title, icon, color, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("カテゴリの取得に失敗しました", error);
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      if (!data || data.length === 0) {
        const payload = DEFAULT_CATEGORIES.map((category) => ({
          user_id: userId,
          title: category.cardTitle,
          icon: category.svgName,
          color: category.svgColor,
        }));

        const { data: inserted, error: insertError } = await supabase
          .from("categories")
          .insert(payload)
          .select();

        if (insertError) {
          console.error("初期カテゴリの作成に失敗しました", insertError);
          if (isMounted) {
            setIsLoading(false);
          }
          return;
        }

        if (isMounted) {
          setCards(inserted.map(mapCategoryRow));
          setIsLoading(false);
        }
        return;
      }

      if (isMounted) {
        setCards(data.map(mapCategoryRow));
        setIsLoading(false);
      }
    };

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const addCard = async () => {
    if (!userId) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from("categories")
        .insert({
          user_id: userId,
          title: "新しいカテゴリ",
          icon: "Plus",
          color: "gray",
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newCard = mapCategoryRow(data);
      setCards((prev) => [...prev, newCard]);
      setEditingCard(newCard);
    } catch (error) {
      console.error("カテゴリの追加に失敗しました", error);
      alert("カテゴリの追加に失敗しました。");
    }
  };

  const deleteCard = async (id) => {
    if (!userId) {
      return false;
    }

    const targetCard = cards.find((card) => card.id === id);

    try {
      if (targetCard) {
        const { data: expenses, error: expensesError } = await supabase
          .from("expenses")
          .select("price")
          .eq("user_id", userId)
          .eq("category", targetCard.cardTitle);

        if (expensesError) {
          throw expensesError;
        }

        const total = (expenses ?? []).reduce(
          (sum, item) => sum + (item.price || 0),
          0
        );

        if (total > 0) {
          const shouldDelete = window.confirm(
            "このカテゴリには今まで1円以上の支出が存在します。\n削除すると支出記録も削除されますが、続行しますか？"
          );

          if (!shouldDelete) {
            return false;
          }
        }
      }

      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        throw error;
      }

      setCards((prev) => prev.filter((card) => card.id !== id));

      if (targetCard) {
        const { error: expenseError } = await supabase
          .from("expenses")
          .delete()
          .eq("user_id", userId)
          .eq("category", targetCard.cardTitle);

        if (expenseError) {
          console.error("関連する支出の削除に失敗しました", expenseError);
        }
      }

      if (editingCard?.id === id) {
        setEditingCard(null);
      }

      setRefreshKey((prev) => prev + 1);
      onExpensesMutated?.();

      return true;
    } catch (error) {
      console.error("カテゴリの削除に失敗しました", error);
      alert("カテゴリの削除に失敗しました。");
      return false;
    }
  };

  const updateCard = async (id, newTitle, newIcon, newColor) => {
    if (!userId) {
      return;
    }

    const previousCard = cards.find((card) => card.id === id);

    try {
      const { data, error } = await supabase
        .from("categories")
        .update({
          title: newTitle,
          icon: newIcon,
          color: newColor,
        })
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setCards((prev) =>
        prev.map((card) => (card.id === id ? mapCategoryRow(data) : card))
      );
      setEditingCard(null);

      if (previousCard && previousCard.cardTitle !== newTitle) {
        const { error: expenseError } = await supabase
          .from("expenses")
          .update({ category: newTitle })
          .eq("user_id", userId)
          .eq("category", previousCard.cardTitle);

        if (expenseError) {
          console.error("関連する支出の更新に失敗しました", expenseError);
          alert("支出のカテゴリ更新に失敗しました。");
        }
      }

      setRefreshKey((prev) => prev + 1);
      onExpensesMutated?.();
    } catch (error) {
      console.error("カテゴリの更新に失敗しました", error);
      alert("カテゴリの更新に失敗しました。");
    }
  };

  const handleEdit = (card) => {
    setEditingCard(card);
  };

  const handleCloseModal = () => {
    setEditingCard(null);
  };

  const handleOpenExpenseModal = (card) => {
    setExpenseModalCard(card);
    setIsExpenseModalOpen(true);
  };

  const handleCloseExpenseModal = () => {
    setIsExpenseModalOpen(false);
  };

  const handleExpenseModalAfterClose = () => {
    setExpenseModalCard(null);
  };

  const handleExpenseMutated = () => {
    setRefreshKey((prev) => prev + 1);
    onExpensesMutated?.();
  };

  const handleExpenseSaved = () => {
    setIsExpenseModalOpen(false);
    handleExpenseMutated();
  };

  const handleCardSelect = (cardToShow) => {
    if (!userId) {
      return;
    }
    setDetailCard(cardToShow);
    setIsDetailModalOpen(true);
  };

  const handleDetailClose = () => {
    setIsDetailModalOpen(false);
  };

  const handleDetailAfterClose = () => {
    setDetailCard(null);
  };

  return (
    <>
      <div className="grid auto-rows-fr grid-cols-1 gap-6 p-6 mt-10 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-12 text-gray-500">
            カテゴリを読み込み中です...
          </div>
        ) : (
          cards.map((card) => (
            <Card
              key={card.id}
              card={card}
              selectedMonth={selectedMonth}
              onDelete={deleteCard}
              onEdit={() => handleEdit(card)}
              userId={userId}
              onAddExpense={() => handleOpenExpenseModal(card)}
              refreshKey={refreshKey}
              onSelect={userId ? handleCardSelect : undefined}
            />
          ))
        )}
        <button
          type="button"
          onClick={addCard}
          disabled={isLoading}
          className="flex h-full items-center justify-center rounded-lg border-2 border-dashed border-gray-400 bg-gray-100 p-6 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="カテゴリを追加"
        >
          <Plus size={40} className="text-gray-500" />
        </button>
      </div>
      <EditCardModal
        card={editingCard}
        isOpen={Boolean(editingCard)}
        onClose={handleCloseModal}
        onSave={updateCard}
      />
      <AddExpenseModal
        card={expenseModalCard}
        userId={userId}
        isOpen={isExpenseModalOpen}
        onClose={handleCloseExpenseModal}
        onAfterClose={handleExpenseModalAfterClose}
        onSaved={handleExpenseSaved}
      />
      <CardDetailModal
        card={detailCard}
        userId={userId}
        selectedMonth={selectedMonth}
        isOpen={isDetailModalOpen}
        onClose={handleDetailClose}
        onAfterClose={handleDetailAfterClose}
        onExpenseMutated={handleExpenseMutated}
      />
    </>
  );
}

export default CardList;
