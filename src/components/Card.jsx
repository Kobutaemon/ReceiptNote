import { useState, useEffect, useRef } from "react";
import * as LucideIcons from "lucide-react";
import { svgColorMap } from "../utils/colorMap";
import { supabase } from "../lib/supabaseClient";

const { Trash2, Edit, MoreVertical } = LucideIcons;

function Card({ card, selectedMonth, onDelete, onEdit }) {
  const [cardTotal, setCardTotal] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const fetchTotal = async () => {
      const currentYear = new Date().getFullYear();
      const startDate = `${currentYear}-${selectedMonth}-01`;
      const nextMonth =
        selectedMonth === "12"
          ? "01"
          : String(parseInt(selectedMonth, 10) + 1).padStart(2, "0");
      const nextYear = selectedMonth === "12" ? currentYear + 1 : currentYear;
      const endDate = `${nextYear}-${nextMonth}-01`;

      const { data, error } = await supabase
        .from("expenses")
        .select("price")
        .eq("category", card.cardTitle)
        .gte("expense_date", startDate)
        .lt("expense_date", endDate);

      if (error) {
        console.error(`Error fetching data for ${card.cardTitle}:`, error);
        return;
      }

      const total = data.reduce((acc, item) => acc + (item.price || 0), 0);
      const formattedTotal = new Intl.NumberFormat("ja-JP").format(total);
      setCardTotal(formattedTotal);
    };

    if (card.cardTitle) {
      fetchTotal();
    }
  }, [selectedMonth, card.cardTitle]);

  // メニュー外のクリックでメニューを閉じる
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const IconComponent = LucideIcons[card.svgName] || LucideIcons.HelpCircle;
  const colorComponent = svgColorMap[card.svgColor] || svgColorMap.gray;

  return (
    <div className="bg-white rounded-lg border border-black p-6 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-2 ${colorComponent["bg"]} rounded`}>
            <IconComponent size={24} className={colorComponent["text"]} />
          </div>
          <div>
            <p className="text-sm text-gray-600">{card.cardTitle}</p>
            <h3 className="text-xl font-bold text-gray-900">{cardTotal}円</h3>
          </div>
        </div>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-gray-200 active:bg-gray-300"
            aria-label="カードメニューを開く"
          >
            <MoreVertical size={20} />
          </button>
          <div
            className={`absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200 origin-top-right transition-all duration-150 ease-out ${
              isMenuOpen
                ? "scale-100 opacity-100"
                : "scale-95 opacity-0 pointer-events-none"
            }`}
            aria-hidden={!isMenuOpen}
          >
            <>
              <button
                onClick={() => {
                  onEdit();
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Edit size={16} /> 編集
              </button>
              <button
                onClick={() => onDelete(card.id)}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
              >
                <Trash2 size={16} /> 削除
              </button>
            </>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Card;
