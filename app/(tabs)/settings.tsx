import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/lib/auth-provider";
import {
  loadUserProfile,
  saveUserProfile,
  type UserProfile,
} from "@/lib/grievance-store";
import {
  loadAdmins,
  saveAdmins,
  addAdmin,
  removeAdmin,
  type Admin,
} from "@/lib/auth-store";

export default function SettingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { authState, logout } = useAuth();
  const isAdmin = authState.role === "admin";

  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    department: "",
    employeeId: "",
  });
  const [editing, setEditing] = useState(false);
  const [tempProfile, setTempProfile] = useState<UserProfile>({
    name: "",
    department: "",
    employeeId: "",
  });

  // 관리자 관련 상태
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [addingAdmin, setAddingAdmin] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadUserProfile().then((p) => {
        setProfile(p);
        setTempProfile(p);
      });
      if (isAdmin) {
        loadAdmins().then(setAdmins);
      }
    }, [isAdmin])
  );

  const handleEdit = () => {
    setTempProfile({ ...profile });
    setEditing(true);
  };

  const handleSave = async () => {
    if (!tempProfile.name.trim()) {
      Alert.alert("입력 오류", "이름을 입력해주세요.");
      return;
    }
    if (!tempProfile.department.trim()) {
      Alert.alert("입력 오류", "부서를 입력해주세요.");
      return;
    }
    await saveUserProfile(tempProfile);
    setProfile(tempProfile);
    setEditing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("저장 완료", "프로필이 업데이트되었습니다.");
  };

  const handleCancel = () => {
    setTempProfile({ ...profile });
    setEditing(false);
  };

  const handleLogout = () => {
    Alert.alert("로그아웃", "정말 로그아웃하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "로그아웃",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/auth/login");
        },
      },
    ]);
  };

  const handleAddAdmin = async () => {
    if (!newAdminName.trim()) {
      Alert.alert("입력 오류", "관리자 이름을 입력해주세요.");
      return;
    }
    if (!newAdminPassword.trim()) {
      Alert.alert("입력 오류", "비밀번호를 입력해주세요.");
      return;
    }

    setAddingAdmin(true);
    try {
      await addAdmin(newAdminName, newAdminPassword);
      const updated = await loadAdmins();
      setAdmins(updated);
      setNewAdminName("");
      setNewAdminPassword("");
      setShowAddAdmin(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("완료", "관리자가 추가되었습니다.");
    } catch (e) {
      Alert.alert("오류", (e as Error).message);
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleRemoveAdmin = (adminId: string, adminName: string) => {
    Alert.alert("관리자 삭제", `${adminName} 관리자를 삭제하시겠습니까?`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            await removeAdmin(adminId);
            const updated = await loadAdmins();
            setAdmins(updated);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (e) {
            Alert.alert("오류", (e as Error).message);
          }
        },
      },
    ]);
  };

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <Text style={styles.headerTitle}>설정</Text>
          <Text style={styles.headerSub}>
            {isAdmin ? "관리자 설정을 관리합니다" : "프로필 및 앱 설정을 관리합니다"}
          </Text>
        </View>

        <View style={{ padding: 16, gap: 20 }}>
          {/* 프로필 카드 */}
          <View
            style={[
              styles.profileCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.profileAvatar}>
              <Text style={{ fontSize: 32 }}>👤</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.profileName, { color: colors.foreground }]}>
                {isAdmin
                  ? (authState.user as any)?.name || "관리자"
                  : profile.name || "이름 없음"}
              </Text>
              <Text style={[styles.profileDept, { color: colors.muted }]}>
                {isAdmin
                  ? "관리자 계정"
                  : `${profile.department || "부서 없음"} · ${profile.employeeId || "사번 없음"}`}
              </Text>
            </View>
            {!isAdmin && (
              <Pressable
                style={({ pressed }) => [
                  styles.editBtn,
                  { backgroundColor: colors.primary + "20", opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={handleEdit}
              >
                <IconSymbol name="pencil" size={16} color={colors.primary} />
                <Text style={[styles.editBtnText, { color: colors.primary }]}>편집</Text>
              </Pressable>
            )}
          </View>

          {/* 프로필 편집 폼 */}
          {editing && !isAdmin && (
            <View
              style={[
                styles.editForm,
                { backgroundColor: colors.surface, borderColor: colors.primary + "40" },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                프로필 편집
              </Text>

              <View style={{ gap: 14 }}>
                <View>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>이름</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        color: colors.foreground,
                      },
                    ]}
                    value={tempProfile.name}
                    onChangeText={(v) => setTempProfile((p) => ({ ...p, name: v }))}
                    placeholder="이름을 입력하세요"
                    placeholderTextColor={colors.muted}
                  />
                </View>
                <View>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>부서</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        color: colors.foreground,
                      },
                    ]}
                    value={tempProfile.department}
                    onChangeText={(v) => setTempProfile((p) => ({ ...p, department: v }))}
                    placeholder="부서를 입력하세요"
                    placeholderTextColor={colors.muted}
                  />
                </View>
                <View>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>사번</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        color: colors.foreground,
                      },
                    ]}
                    value={tempProfile.employeeId}
                    onChangeText={(v) => setTempProfile((p) => ({ ...p, employeeId: v }))}
                    placeholder="사번을 입력하세요"
                    placeholderTextColor={colors.muted}
                  />
                </View>
              </View>

              <View style={styles.editActions}>
                <Pressable
                  style={({ pressed }) => [
                    styles.cancelEditBtn,
                    { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
                  ]}
                  onPress={handleCancel}
                >
                  <Text style={[styles.cancelEditText, { color: colors.muted }]}>취소</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.saveBtn,
                    { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
                  ]}
                  onPress={handleSave}
                >
                  <Text style={styles.saveBtnText}>저장</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* 관리자 설정 */}
          {isAdmin && (
            <>
              <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                    관리자 관리
                  </Text>
                  <Text style={[styles.adminCount, { color: colors.muted }]}>
                    {admins.length}/5
                  </Text>
                </View>

                {admins.length === 0 ? (
                  <Text style={[styles.emptyText, { color: colors.muted }]}>
                    등록된 관리자가 없습니다.
                  </Text>
                ) : (
                  <View style={{ gap: 8 }}>
                    {admins.map((admin) => (
                      <View
                        key={admin.id}
                        style={[
                          styles.adminItem,
                          { backgroundColor: colors.background, borderColor: colors.border },
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.adminName, { color: colors.foreground }]}>
                            {admin.name}
                          </Text>
                          <Text style={[styles.adminDate, { color: colors.muted }]}>
                            {new Date(admin.createdAt).toLocaleDateString("ko-KR")}
                          </Text>
                        </View>
                        {admins.length > 1 && (
                          <Pressable
                            style={({ pressed }) => [
                              styles.deleteBtn,
                              { opacity: pressed ? 0.7 : 1 },
                            ]}
                            onPress={() => handleRemoveAdmin(admin.id, admin.name)}
                          >
                            <IconSymbol name="trash.fill" size={18} color={colors.error} />
                          </Pressable>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {admins.length < 5 && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.addAdminBtn,
                      { backgroundColor: colors.primary + "20", opacity: pressed ? 0.7 : 1 },
                    ]}
                    onPress={() => setShowAddAdmin(true)}
                  >
                    <IconSymbol name="plus.circle.fill" size={18} color={colors.primary} />
                    <Text style={[styles.addAdminText, { color: colors.primary }]}>
                      관리자 추가
                    </Text>
                  </Pressable>
                )}
              </View>
            </>
          )}

          {/* 앱 정보 */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>앱 정보</Text>
            <InfoRow
              icon="shield.fill"
              label="앱 이름"
              value="고충처리 시스템"
              colors={colors}
            />
            <Divider colors={colors} />
            <InfoRow icon="doc.text.fill" label="버전" value="1.0.0" colors={colors} />
            <Divider colors={colors} />
            <InfoRow
              icon="building.2.fill"
              label="운영 주체"
              value="인사팀"
              colors={colors}
            />
          </View>

          {/* 로그아웃 버튼 */}
          <Pressable
            style={({ pressed }) => [
              styles.logoutBtn,
              { borderColor: colors.error, opacity: pressed ? 0.75 : 1 },
            ]}
            onPress={handleLogout}
          >
            <IconSymbol name="arrow.right" size={18} color={colors.error} />
            <Text style={[styles.logoutText, { color: colors.error }]}>로그아웃</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* 관리자 추가 모달 */}
      <Modal
        visible={showAddAdmin}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddAdmin(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>관리자 추가</Text>

            <View style={{ gap: 14, marginTop: 16 }}>
              <View>
                <Text style={[styles.inputLabel, { color: colors.muted }]}>관리자 이름</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.foreground,
                    },
                  ]}
                  placeholder="관리자 이름"
                  placeholderTextColor={colors.muted}
                  value={newAdminName}
                  onChangeText={setNewAdminName}
                  editable={!addingAdmin}
                />
              </View>
              <View>
                <Text style={[styles.inputLabel, { color: colors.muted }]}>비밀번호</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.foreground,
                    },
                  ]}
                  placeholder="비밀번호"
                  placeholderTextColor={colors.muted}
                  value={newAdminPassword}
                  onChangeText={setNewAdminPassword}
                  secureTextEntry
                  editable={!addingAdmin}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.cancelModalBtn,
                  { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={() => setShowAddAdmin(false)}
                disabled={addingAdmin}
              >
                <Text style={[styles.cancelModalText, { color: colors.muted }]}>취소</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.confirmBtn,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
                ]}
                onPress={handleAddAdmin}
                disabled={addingAdmin}
              >
                <Text style={styles.confirmText}>
                  {addingAdmin ? "추가 중..." : "추가"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

function InfoRow({
  icon,
  label,
  value,
  colors,
}: {
  icon: string;
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.infoRow}>
      <IconSymbol name={icon as any} size={18} color={colors.muted} />
      <Text style={[styles.infoLabel, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

function Divider({ colors }: { colors: ReturnType<typeof useColors> }) {
  return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  profileName: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 3,
  },
  profileDept: {
    fontSize: 13,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  editForm: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  adminCount: {
    fontSize: 14,
    fontWeight: "600",
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
  },
  editActions: {
    flexDirection: "row",
    gap: 10,
  },
  cancelEditBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  cancelEditText: {
    fontSize: 15,
    fontWeight: "600",
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  section: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  adminItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  adminName: {
    fontSize: 15,
    fontWeight: "600",
  },
  adminDate: {
    fontSize: 12,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 8,
  },
  addAdminBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  addAdminText: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoLabel: {
    fontSize: 14,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  divider: {
    height: 1,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
    alignSelf: "center",
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  cancelModalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  cancelModalText: {
    fontSize: 15,
    fontWeight: "600",
  },
  confirmBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  confirmText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
