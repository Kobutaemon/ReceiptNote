import { useState, useEffect, useRef } from "react";
import { User, LogOut, Edit2 } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

function UserMenu({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const [displayName, setDisplayName] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const menuRef = useRef(null);

  const userId = user?.id ?? null;
  const userEmail = user?.email ?? null;

  // プロフィールを読み込み
  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) return;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", userId)
          .single();

        if (error) {
          // プロフィールが存在しない場合は作成
          if (error.code === "PGRST116") {
            await supabase.from("profiles").insert({
              id: userId,
              email: userEmail,
            });
          }
          return;
        }

        setDisplayName(data?.display_name || null);
      } catch (err) {
        console.error("プロフィールの読み込みに失敗しました", err);
      }
    };

    loadProfile();
  }, [userId, userEmail]);

  // 外部クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // ユーザー名保存
  const handleSaveDisplayName = async () => {
    if (!userId) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          email: userEmail,
          display_name: newDisplayName.trim() || null,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setDisplayName(newDisplayName.trim() || null);
      setIsEditModalOpen(false);
    } catch (err) {
      console.error("ユーザー名の保存に失敗しました", err);
      alert("ユーザー名の保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEditModal = () => {
    setNewDisplayName(displayName || "");
    setIsEditModalOpen(true);
    setIsOpen(false);
  };

  // 表示名（ユーザー名 > メール > "ユーザー"）
  const displayLabel = displayName || userEmail?.split("@")[0] || "ユーザー";
  const initial = displayLabel.charAt(0).toUpperCase();

  return (
    <>
      <div className="relative" ref={menuRef}>
        {/* ユーザーアイコンボタン */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 rounded-full bg-blue-600 p-2 text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="ユーザーメニュー"
        >
          <span className="flex h-6 w-6 items-center justify-center text-sm font-bold">
            {initial}
          </span>
        </button>

        {/* ドロップダウンメニュー */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-56 rounded-lg bg-white py-2 shadow-lg ring-1 ring-black/5 z-50">
            {/* ユーザー情報 */}
            <div className="border-b border-gray-100 px-4 py-3">
              <p className="text-sm font-medium text-gray-800">{displayLabel}</p>
              {displayName && (
                <p className="text-xs text-gray-500">{userEmail}</p>
              )}
            </div>

            {/* メニュー項目 */}
            <button
              type="button"
              onClick={handleOpenEditModal}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
            >
              <Edit2 size={16} />
              <span>ユーザー名を編集</span>
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut size={16} />
              <span>ログアウト</span>
            </button>
          </div>
        )}
      </div>

      {/* ユーザー名編集モーダル */}
      {isEditModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500/80"
          onClick={() => setIsEditModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-lg font-bold text-gray-800">
              ユーザー名を編集
            </h3>
            <input
              type="text"
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
              placeholder="表示名を入力"
              className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              maxLength={50}
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-lg px-4 py-2 text-gray-600 transition-colors hover:bg-gray-100"
                disabled={isSaving}
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleSaveDisplayName}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                disabled={isSaving}
              >
                {isSaving ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default UserMenu;
