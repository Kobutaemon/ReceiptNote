import { useState } from "react";
import Card from "./Card";
import { Plus } from "lucide-react";
import EditCardModal from "./EditCardModal";

const initialCards = [
  {
    id: 1,
    svgName: "Bike",
    svgColor: "blue",
    cardTitle: "駐輪代",
  },
  {
    id: 2,
    svgName: "ShoppingBag",
    svgColor: "purple",
    cardTitle: "買い物代",
  },
  {
    id: 3,
    svgName: "User",
    svgColor: "green",
    cardTitle: "交際費(代)",
  },
  {
    id: 4,
    svgName: "Ellipsis",
    svgColor: "gray",
    cardTitle: "その他",
  },
];

function CardList({ selectedMonth }) {
  const [cards, setCards] = useState(initialCards);
  const [editingCard, setEditingCard] = useState(null);

  const addCard = () => {
    const newCard = {
      id: cards.length > 0 ? Math.max(...cards.map((c) => c.id)) + 1 : 1,
      svgName: "Plus",
      svgColor: "gray",
      cardTitle: "新しいカテゴリ",
    };
    setCards([...cards, newCard]);
  };

  const deleteCard = (id) => {
    setCards(cards.filter((card) => card.id !== id));
  };

  const updateCard = (id, newTitle, newIcon, newColor) => {
    setCards(
      cards.map((card) =>
        card.id === id
          ? {
              ...card,
              cardTitle: newTitle,
              svgName: newIcon,
              svgColor: newColor,
            }
          : card
      )
    );
    setEditingCard(null);
  };

  const handleEdit = (card) => {
    setEditingCard(card);
  };

  const handleCloseModal = () => {
    setEditingCard(null);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 mt-10">
        {cards.map((card) => (
          <Card
            key={card.id}
            card={card}
            selectedMonth={selectedMonth}
            onDelete={deleteCard}
            onEdit={() => handleEdit(card)}
          />
        ))}
        <div
          className="flex items-center justify-center bg-gray-100 rounded-lg border-2 border-dashed border-gray-400 cursor-pointer hover:bg-gray-200 transition-colors p-6"
          onClick={addCard}
        >
          <Plus size={40} className="text-gray-500" />
        </div>
      </div>
      <EditCardModal
        card={editingCard}
        isOpen={!!editingCard}
        onClose={handleCloseModal}
        onSave={updateCard}
      />
    </>
  );
}

export default CardList;
