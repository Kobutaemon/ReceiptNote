import { X, Crown, User, LogOut, Trash2 } from "lucide-react";

function MemberListModal({
  isOpen,
  onClose,
  members,
  currentUserId,
  getMemberDisplay,
  onLeaveGroup,
  onDeleteGroup,
  isOwner,
}) {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gray-500/80 p-4 transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    >
      <div
        className={`max-h-[80vh] w-full max-w-sm overflow-y-auto rounded-lg bg-white p-6 shadow-xl transition-transform duration-300 ease-out ${
          isOpen ? "scale-100" : "scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">
            メンバー一覧 ({members.length}人)
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-2">
          {members.map((member) => {
            const isCurrentUser = member.user_id === currentUserId;
            const isMemberOwner = member.role === "owner";

            return (
              <div
                key={member.user_id}
                className={`flex items-center justify-between rounded-lg p-3 ${
                  isCurrentUser ? "bg-blue-50" : "bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      isMemberOwner ? "bg-yellow-100" : "bg-gray-200"
                    }`}
                  >
                    {isMemberOwner ? (
                      <Crown className="text-yellow-600" size={20} />
                    ) : (
                      <User className="text-gray-600" size={20} />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {getMemberDisplay(member.user_id)}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs text-blue-600">
                          (自分)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {isMemberOwner ? "オーナー" : "メンバー"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* グループ脱退ボタン（メンバーのみ） */}
        {!isOwner && (
          <div className="mt-6 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={onLeaveGroup}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-100 px-4 py-3 text-red-700 transition-colors hover:bg-red-200"
            >
              <LogOut size={18} />
              <span>グループを脱退する</span>
            </button>
          </div>
        )}

        {/* グループ削除ボタン（オーナーのみ） */}
        {isOwner && (
          <div className="mt-6 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={onDeleteGroup}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-white transition-colors hover:bg-red-700"
            >
              <Trash2 size={18} />
              <span>グループを削除する</span>
            </button>
            <p className="mt-2 text-center text-xs text-gray-500">
              グループを削除すると、すべての支出・精算記録も削除されます。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MemberListModal;
