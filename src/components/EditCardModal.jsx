// src/components/EditCardModal.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import * as LucideIcons from "lucide-react";
import { iconMap } from "../lib/iconMap";
import { svgColorMap } from "../utils/colorMap";
import useModalBackdropClose from "../hooks/useModalBackdropClose";

const { Save, X } = LucideIcons;

function EditCardModal({ card, isOpen, onClose, onSave }) {
  const [editedTitle, setEditedTitle] = useState("");
  const [editedIcon, setEditedIcon] = useState("");
  const [editedColor, setEditedColor] = useState("");
  const modalRef = useRef(null);
  const previouslyFocusedElementRef = useRef(null);
  const previousBodyOverflowRef = useRef("");

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const backdropHandlers = useModalBackdropClose(handleClose);

  useEffect(() => {
    if (card) {
      setEditedTitle(card.cardTitle);
      setEditedIcon(card.svgName);
      setEditedColor(card.svgColor);
    }
  }, [card]);

  useEffect(() => {
    if (!isOpen) {
      const previous = previouslyFocusedElementRef.current;
      if (previous instanceof HTMLElement) {
        previous.focus({ preventScroll: true });
      }
      return;
    }

    previouslyFocusedElementRef.current = document.activeElement;
    const node = modalRef.current;
    if (node) {
      node.focus({ preventScroll: true });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

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

  const handleSave = () => {
    if (!card) {
      return;
    }

    onSave(card.id, editedTitle, editedIcon, editedColor);
    onClose();
  };

  const IconComponent = LucideIcons[editedIcon] || LucideIcons.HelpCircle;
  const colorComponent = svgColorMap[editedColor] || svgColorMap.gray;

  return (
    <div
      className={`fixed inset-0 bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      aria-hidden={!isOpen}
      {...backdropHandlers}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-card-modal-title"
        aria-describedby="edit-card-modal-description"
        tabIndex={-1}
        className={`bg-white rounded-lg border border-gray-300 shadow-xl p-8 m-4 w-full max-w-md transition-transform duration-300 ease-out ${
          isOpen ? "scale-100" : "scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="edit-card-modal-title"
          className="text-2xl font-bold mb-6 text-center"
        >
          カテゴリを編集
        </h2>
        <p id="edit-card-modal-description" className="sr-only">
          カテゴリのタイトル、アイコン、カラーを更新できます。
        </p>

        {/* Preview */}
        <div className="mb-8">
          <p className="text-sm text-gray-500 mb-2 text-center">プレビュー</p>
          <div className="bg-white rounded-lg border border-black p-6 flex items-center justify-start">
            <div className="flex items-center gap-4">
              <div className={`p-2 ${colorComponent.bg} rounded`}>
                <IconComponent size={24} className={colorComponent.text} />
              </div>
              <div>
                <p className="text-sm text-gray-600">{editedTitle}</p>
                <h3 className="text-xl font-bold text-gray-900">12,345円</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              タイトル
            </label>
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              アイコン
            </label>
            <select
              value={editedIcon}
              onChange={(e) => setEditedIcon(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {iconMap.map((icon) => (
                <option key={icon.name} value={icon.name}>
                  {icon.ja} ({icon.name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              カラー
            </label>
            <div className="flex gap-3 mt-2">
              {Object.keys(svgColorMap).map((color) => (
                <button
                  key={color}
                  onClick={() => setEditedColor(color)}
                  className={`w-8 h-8 rounded-full ${
                    svgColorMap[color].bg
                  } border-2 transition-transform transform hover:scale-110 ${
                    editedColor === color
                      ? "border-blue-500 ring-2 ring-blue-500"
                      : "border-transparent"
                  }`}
                  aria-label={color}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 mt-8">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 flex items-center gap-2"
          >
            <X size={16} /> キャンセル
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-md text-white bg-blue-500 hover:bg-blue-600 flex items-center gap-2"
          >
            <Save size={16} /> 保存
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditCardModal;
