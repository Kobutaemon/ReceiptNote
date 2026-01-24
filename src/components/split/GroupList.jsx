import { Loader2 } from "lucide-react";
import GroupCard from "./GroupCard";

function GroupList({ groups, isLoading, onSelectGroup }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        <Loader2 className="mr-2 animate-spin" size={20} />
        <span>グループを読み込み中...</span>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
        <p className="text-gray-500">
          まだグループがありません。
          <br />
          「新規グループ」ボタンから作成してください。
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {groups.map((group) => (
        <GroupCard
          key={group.id}
          group={group}
          onClick={() => onSelectGroup(group)}
        />
      ))}
    </div>
  );
}

export default GroupList;
