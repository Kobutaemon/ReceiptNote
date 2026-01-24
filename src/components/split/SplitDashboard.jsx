import { useState, useEffect } from "react";
import { Plus, Users } from "lucide-react";
import GroupList from "./GroupList";
import GroupDetail from "./GroupDetail";
import CreateGroupModal from "./CreateGroupModal";
import InvitationBadge from "./InvitationBadge";
import { supabase } from "../../lib/supabaseClient";
import { useToast } from "../../lib/toastContext";

function SplitDashboard({ user }) {
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const { showToast } = useToast();

  const userId = user?.id ?? null;
  const userEmail = user?.email ?? null;

  // グループ一覧を取得
  const loadGroups = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("group_members")
        .select(`
          group_id,
          role,
          split_groups (
            id,
            name,
            description,
            created_at
          )
        `)
        .eq("user_id", userId);

      if (error) throw error;

      const groupList = (data || [])
        .filter((item) => item.split_groups)
        .map((item) => ({
          ...item.split_groups,
          role: item.role,
        }));

      setGroups(groupList);
    } catch (error) {
      console.error("グループの取得に失敗しました", error);
      showToast("グループの取得に失敗しました", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // 招待を取得（グループ名も含めて取得）
  const loadInvitations = async () => {
    if (!userEmail) return;

    try {
      const { data: invitationsData, error: invitationsError } = await supabase
        .from("group_invitations")
        .select(`
          id, 
          group_id, 
          status, 
          created_at, 
          invited_by,
          split_groups (
            id,
            name
          )
        `)
        .eq("invited_email", userEmail)
        .eq("status", "pending");

      if (invitationsError) throw invitationsError;

      if (!invitationsData || invitationsData.length === 0) {
        setPendingInvitations([]);
        return;
      }

      // グループ名を招待オブジェクトに追加
      const invitationsWithNames = invitationsData.map((inv) => ({
        ...inv,
        groupName: inv.split_groups?.name || "グループへの招待",
      }));

      setPendingInvitations(invitationsWithNames);
    } catch (error) {
      console.error("招待の取得に失敗しました", error);
    }
  };

  useEffect(() => {
    loadGroups();
    loadInvitations();
  }, [userId, userEmail]);

  // グループ作成
  const handleCreateGroup = async (name, description) => {
    if (!userId) return;

    try {
      // グループを作成
      const { data: newGroup, error: groupError } = await supabase
        .from("split_groups")
        .insert({
          name,
          description,
          created_by: userId,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // 作成者をオーナーとして追加（emailも保存）
      const { error: memberError } = await supabase
        .from("group_members")
        .insert({
          group_id: newGroup.id,
          user_id: userId,
          role: "owner",
          email: userEmail,
        });

      if (memberError) throw memberError;

      showToast("グループを作成しました", "success");
      setIsCreateModalOpen(false);
      await loadGroups();
    } catch (error) {
      console.error("グループの作成に失敗しました", error);
      showToast("グループの作成に失敗しました", "error");
    }
  };

  // 招待を承認
  const handleAcceptInvitation = async (invitation) => {
    if (!userId) return;

    try {
      // 招待ステータスを更新
      const { error: updateError } = await supabase
        .from("group_invitations")
        .update({ status: "accepted" })
        .eq("id", invitation.id);

      if (updateError) throw updateError;

      // グループメンバーに追加（emailも保存）
      const { error: memberError } = await supabase
        .from("group_members")
        .insert({
          group_id: invitation.group_id,
          user_id: userId,
          role: "member",
          email: userEmail,
        });

      if (memberError) throw memberError;

      showToast("グループに参加しました", "success");
      await loadGroups();
      await loadInvitations();
    } catch (error) {
      console.error("招待の承認に失敗しました", error);
      showToast("招待の承認に失敗しました", "error");
    }
  };

  // 招待を拒否
  const handleDeclineInvitation = async (invitation) => {
    try {
      const { error } = await supabase
        .from("group_invitations")
        .update({ status: "declined" })
        .eq("id", invitation.id);

      if (error) throw error;

      showToast("招待を拒否しました", "info");
      await loadInvitations();
    } catch (error) {
      console.error("招待の拒否に失敗しました", error);
      showToast("招待の拒否に失敗しました", "error");
    }
  };

  // グループ詳細から戻る
  const handleBackToList = () => {
    setSelectedGroup(null);
    loadGroups(); // 更新を反映
  };

  // グループ詳細表示
  if (selectedGroup) {
    return (
      <GroupDetail
        group={selectedGroup}
        user={user}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div className="p-6">
      {/* 招待通知 */}
      {pendingInvitations.length > 0 && (
        <InvitationBadge
          invitations={pendingInvitations}
          onAccept={handleAcceptInvitation}
          onDecline={handleDeclineInvitation}
        />
      )}

      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="text-gray-600" size={24} />
          <h2 className="text-xl font-bold text-gray-800">割り勘グループ</h2>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
        >
          <Plus size={20} />
          <span>新規グループ</span>
        </button>
      </div>

      {/* グループ一覧 */}
      <GroupList
        groups={groups}
        isLoading={isLoading}
        onSelectGroup={setSelectedGroup}
      />

      {/* グループ作成モーダル */}
      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateGroup}
      />
    </div>
  );
}

export default SplitDashboard;
