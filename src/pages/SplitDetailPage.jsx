import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import GroupDetail from "../components/split/GroupDetail";
import { supabase } from "../lib/supabaseClient";
import { useToast } from "../lib/toastContext";

function SplitDetailPage({ user }) {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [group, setGroup] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const userId = user?.id ?? null;

  useEffect(() => {
    const loadGroup = async () => {
      if (!groupId || !userId) return;

      setIsLoading(true);
      try {
        // グループメンバーシップを確認しながらグループ情報を取得
        const { data: memberData, error: memberError } = await supabase
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
          .eq("user_id", userId)
          .eq("group_id", groupId)
          .single();

        if (memberError) {
          if (memberError.code === "PGRST116") {
            // グループのメンバーでない場合
            showToast("このグループへのアクセス権がありません", "error");
            navigate("/split");
            return;
          }
          throw memberError;
        }

        if (!memberData?.split_groups) {
          showToast("グループが見つかりません", "error");
          navigate("/split");
          return;
        }

        setGroup({
          ...memberData.split_groups,
          role: memberData.role,
        });
      } catch (error) {
        console.error("グループの取得に失敗しました", error);
        showToast("グループの取得に失敗しました", "error");
        navigate("/split");
      } finally {
        setIsLoading(false);
      }
    };

    loadGroup();
  }, [groupId, userId, navigate, showToast]);

  const handleBack = () => {
    navigate("/split");
  };

  if (isLoading) {
    return (
      <div className="py-12 text-center text-gray-500">
        読み込み中...
      </div>
    );
  }

  if (!group) {
    return null;
  }

  return (
    <GroupDetail
      group={group}
      user={user}
      onBack={handleBack}
    />
  );
}

export default SplitDetailPage;
