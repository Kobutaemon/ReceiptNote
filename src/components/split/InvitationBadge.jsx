import { Bell, Check, X } from "lucide-react";

function InvitationBadge({ invitations, onAccept, onDecline }) {
  if (!invitations || invitations.length === 0) return null;

  return (
    <div className="mb-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Bell className="text-blue-600" size={20} />
        <span className="font-semibold text-blue-800">
          {invitations.length}件の招待があります
        </span>
      </div>

      <div className="space-y-2">
        {invitations.map((invitation) => (
          <div
            key={invitation.id}
            className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm"
          >
            <div>
              <p className="font-medium text-gray-800">
                {invitation.groupName || invitation.split_groups?.name || "グループへの招待"}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(invitation.created_at).toLocaleDateString("ja-JP")}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onAccept(invitation)}
                className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-green-700"
              >
                <Check size={16} />
                <span>参加</span>
              </button>
              <button
                type="button"
                onClick={() => onDecline(invitation)}
                className="flex items-center gap-1 rounded-lg bg-gray-200 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-300"
              >
                <X size={16} />
                <span>拒否</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default InvitationBadge;
