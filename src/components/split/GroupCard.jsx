import { Users, ChevronRight } from "lucide-react";

function GroupCard({ group, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-lg bg-white p-4 shadow-md transition-all hover:shadow-lg hover:scale-[1.02] text-left"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <Users className="text-blue-600" size={24} />
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">{group.name}</h3>
          {group.description && (
            <p className="text-sm text-gray-500 line-clamp-1">
              {group.description}
            </p>
          )}
          <p className="text-xs text-gray-400">
            {group.role === "owner" ? "オーナー" : "メンバー"}
          </p>
        </div>
      </div>
      <ChevronRight className="text-gray-400" size={20} />
    </button>
  );
}

export default GroupCard;
