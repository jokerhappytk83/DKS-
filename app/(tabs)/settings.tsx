import { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { loadUserProfile, saveUserProfile, type UserProfile } from "@/lib/grievance-store";

export default function SettingsScreen() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    department: "",
    employeeId: "",
  });
  const [editing, setEditing] = useState(false);
  const [tempProfile, setTempProfile] = useState<UserProfile>({ name: "", department: "", employeeId: "" });

  useFocusEffect(
    useCallback(() => {
      loadUserProfile().then((p) => {
        setProfile(p);
        setTempProfile(p);
      });
    }, [])
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

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <Text style={styles.headerTitle}>설정</Text>
          <Text style={styles.headerSub}>프로필 및 앱 설정을 관리합니다</Text>
        </View>

        <View style={{ padding: 16, gap: 20 }}>
          {/* 프로필 카드 */}
          <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.profileAvatar}>
              <Text style={{ fontSize: 32 }}>👤</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.profileName, { color: colors.foreground }]}>{profile.name || "이름 없음"}</Text>
              <Text style={[styles.profileDept, { color: colors.muted }]}>
                {profile.department || "부서 없음"} · {profile.employeeId || "사번 없음"}
              </Text>
            </View>
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
          </View>

          {/* 프로필 편집 폼 */}
          {editing && (
            <View style={[styles.editForm, { backgroundColor: colors.surface, borderColor: colors.primary + "40" }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>프로필 편집</Text>

              <View style={{ gap: 14 }}>
                <View>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>이름</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                    value={tempProfile.name}
                    onChangeText={(v) => setTempProfile((p) => ({ ...p, name: v }))}
                    placeholder="이름을 입력하세요"
                    placeholderTextColor={colors.muted}
                  />
                </View>
                <View>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>부서</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                    value={tempProfile.department}
                    onChangeText={(v) => setTempProfile((p) => ({ ...p, department: v }))}
                    placeholder="부서를 입력하세요"
                    placeholderTextColor={colors.muted}
                  />
                </View>
                <View>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>사번</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                    value={tempProfile.employeeId}
                    onChangeText={(v) => setTempProfile((p) => ({ ...p, employeeId: v }))}
                    placeholder="사번을 입력하세요"
                    placeholderTextColor={colors.muted}
                  />
                </View>
              </View>

              <View style={styles.editActions}>
                <Pressable
                  style={({ pressed }) => [styles.cancelEditBtn, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
                  onPress={handleCancel}
                >
                  <Text style={[styles.cancelEditText, { color: colors.muted }]}>취소</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.saveBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
                  onPress={handleSave}
                >
                  <Text style={styles.saveBtnText}>저장</Text>
                </Pressable>
              </View>
            </View>
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
            <InfoRow
              icon="doc.text.fill"
              label="버전"
              value="1.0.0"
              colors={colors}
            />
            <Divider colors={colors} />
            <InfoRow
              icon="building.2.fill"
              label="운영 주체"
              value="인사팀"
              colors={colors}
            />
          </View>

          {/* 이용 안내 */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>이용 안내</Text>
            <View style={{ gap: 12 }}>
              <GuideItem
                icon="📋"
                title="고충 접수"
                desc="근무환경, 인사, 급여 등 다양한 카테고리로 고충을 접수할 수 있습니다."
                colors={colors}
              />
              <GuideItem
                icon="🔒"
                title="익명 보장"
                desc="익명 접수 시 이름과 부서가 공개되지 않으며, 비밀이 보장됩니다."
                colors={colors}
              />
              <GuideItem
                icon="⏱️"
                title="처리 기간"
                desc="접수 후 3영업일 내 담당자가 검토하며, 처리 현황을 앱에서 확인할 수 있습니다."
                colors={colors}
              />
            </View>
          </View>

          {/* 문의 */}
          <View
            style={[
              styles.contactCard,
              { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" },
            ]}
          >
            <IconSymbol name="info.circle.fill" size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.contactTitle, { color: colors.primary }]}>문의하기</Text>
              <Text style={[styles.contactDesc, { color: colors.muted }]}>
                앱 관련 문의는 인사팀 담당자에게 연락해주세요.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
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

function GuideItem({
  icon,
  title,
  desc,
  colors,
}: {
  icon: string;
  title: string;
  desc: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.guideItem}>
      <Text style={{ fontSize: 22 }}>{icon}</Text>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[styles.guideTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.guideDesc, { color: colors.muted }]}>{desc}</Text>
      </View>
    </View>
  );
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
  guideItem: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  guideDesc: {
    fontSize: 13,
    lineHeight: 19,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 3,
  },
  contactDesc: {
    fontSize: 13,
    lineHeight: 19,
  },
});
