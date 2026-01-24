import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { iconMap } from "../../lib/iconMap";
import { svgColorMap } from "../../utils/colorMap";

function CreateGroupModal({ isOpen, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("Users");
  const [selectedColor, setSelectedColor] = useState("blue");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setDescription("");
      setSelectedIcon("Users");
      setSelectedColor("blue");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(name.trim(), description.trim(), selectedIcon, selectedColor);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const IconComponent = LucideIcons[selectedIcon] || LucideIcons.Users;
  const colorComponent = svgColorMap[selectedColor] || svgColorMap.blue;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gray-500/80 transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={handleClose}
    >
      <div
        className={`w-full max-w-md max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-xl transition-transform duration-300 ease-out ${
          isOpen ? "scale-100" : "scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">新規グループを作成</h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* プレビュー */}
        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-2 text-center">プレビュー</p>
          <div className="bg-white rounded-lg border border-gray-300 p-4 flex items-center gap-4">
            <div className={`p-3 ${colorComponent.bg} rounded-lg`}>
              <IconComponent size={28} className={colorComponent.text} />
            </div>
            <div>
              <p className="font-semibold text-gray-800">{name || "グループ名"}</p>
              <p className="text-sm text-gray-500 truncate max-w-[200px]">
                {description || "説明なし"}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="group-name"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              グループ名 <span className="text-red-500">*</span>
            </label>
            <input
              ref={inputRef}
              id="group-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 沖縄旅行"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="group-description"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              説明（任意）
            </label>
            <textarea
              id="group-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="グループの説明を入力"
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* アイコン選択 */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              アイコン
            </label>
            <select
              value={selectedIcon}
              onChange={(e) => setSelectedIcon(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="Users">グループ (Users)</option>
              {iconMap.map((icon) => (
                <option key={icon.name} value={icon.name}>
                  {icon.ja} ({icon.name})
                </option>
              ))}
            </select>
          </div>

          {/* 色選択 */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              カラー
            </label>
            <div className="flex gap-3">
              {Object.keys(svgColorMap).map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-10 h-10 rounded-full ${
                    svgColorMap[color].bg
                  } border-2 transition-transform transform hover:scale-110 ${
                    selectedColor === color
                      ? "border-blue-500 ring-2 ring-blue-500"
                      : "border-transparent"
                  }`}
                  aria-label={color}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg px-4 py-2 text-gray-600 transition-colors hover:bg-gray-100"
              disabled={isSubmitting}
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "作成中..." : "作成"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateGroupModal;
