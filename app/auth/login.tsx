import { useState } from "react";
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
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/lib/auth-provider";

type LoginMode = "admin" | "visitor";

export default function LoginScreen() {
  const colors = useColors();
  const router = useRouter();
  const { loginAdmin, loginVisitor } = useAuth();

  const [mode, setMode] = useState<LoginMode>("visitor");
  const [adminName, setAdminName] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [visitorName, setVisitorName] = useState("");
  const [visitorDept, setVisitorDept] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async () => {
    if (!adminName.trim()) {
      Alert.alert("입력 오류", "관리자 이름을 입력해주세요.");
      return;
    }
    if (!adminPassword.trim()) {
      Alert.alert("입력 오류", "비밀번호를 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      await loginAdmin(adminName, adminPassword);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    } catch (e) {
      Alert.alert("로그인 실패", (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleVisitorLogin = async () => {
    if (!isAnonymous && !visitorName.trim()) {
      Alert.alert("입력 오류", "이름을 입력해주세요.");
      return;
    }
    if (!isAnonymous && !visitorDept.trim()) {
      Alert.alert("입력 오류", "부서를 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      await loginVisitor(
        visitorName || "익명",
        visitorDept || "비공개",
        isAnonymous
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    } catch (e) {
      Alert.alert("로그인 실패", (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 헤더 */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <View style={styles.logoContainer}>
            <IconSymbol name="shield.fill" size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.appTitle}>고충처리 시스템</Text>
          <Text style={styles.appDesc}>당신의 목소리를 전달합니다</Text>
        </View>

        <View style={{ padding: 20, gap: 20 }}>
          {/* 모드 선택 탭 */}
          <View style={styles.modeSelector}>
            <Pressable
              style={[
                styles.modeTab,
                {
                  backgroundColor: mode === "visitor" ? colors.primary : colors.surface,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setMode("visitor")}
            >
              <Text
                style={[
                  styles.modeTabText,
                  { color: mode === "visitor" ? "#FFFFFF" : colors.muted },
                ]}
              >
                방문자
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.modeTab,
                {
                  backgroundColor: mode === "admin" ? colors.primary : colors.surface,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setMode("admin")}
            >
              <Text
                style={[
                  styles.modeTabText,
                  { color: mode === "admin" ? "#FFFFFF" : colors.muted },
                ]}
              >
                관리자
              </Text>
            </Pressable>
          </View>

          {/* 관리자 로그인 */}
          {mode === "admin" && (
            <View style={{ gap: 16 }}>
              <View>
                <Text style={[styles.label, { color: colors.foreground }]}>
                  관리자 이름
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.foreground,
                    },
                  ]}
                  placeholder="관리자 이름을 입력하세요"
                  placeholderTextColor={colors.muted}
                  value={adminName}
                  onChangeText={setAdminName}
                  editable={!loading}
                />
              </View>
              <View>
                <Text style={[styles.label, { color: colors.foreground }]}>
                  비밀번호
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.foreground,
                    },
                  ]}
                  placeholder="비밀번호를 입력하세요"
                  placeholderTextColor={colors.muted}
                  value={adminPassword}
                  onChangeText={setAdminPassword}
                  secureTextEntry
                  editable={!loading}
                />
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.loginBtn,
                  {
                    backgroundColor: loading ? colors.muted : colors.primary,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
                onPress={handleAdminLogin}
                disabled={loading}
              >
                <IconSymbol name="shield.fill" size={20} color="#FFFFFF" />
                <Text style={styles.loginBtnText}>
                  {loading ? "로그인 중..." : "관리자 로그인"}
                </Text>
              </Pressable>
            </View>
          )}

          {/* 방문자 로그인 */}
          {mode === "visitor" && (
            <View style={{ gap: 16 }}>
              {/* 익명 여부 */}
              <View
                style={[
                  styles.anonymousRow,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={[styles.anonymousTitle, { color: colors.foreground }]}>
                    익명으로 접속
                  </Text>
                  <Text style={[styles.anonymousSub, { color: colors.muted }]}>
                    이름과 부서가 공개되지 않습니다
                  </Text>
                </View>
                <Switch
                  value={isAnonymous}
                  onValueChange={setIsAnonymous}
                  trackColor={{ false: colors.border, true: colors.primary + "80" }}
                  thumbColor={isAnonymous ? colors.primary : colors.muted}
                />
              </View>

              {/* 이름 입력 */}
              {!isAnonymous && (
                <>
                  <View>
                    <Text style={[styles.label, { color: colors.foreground }]}>
                      이름 <Text style={{ color: colors.error }}>*</Text>
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                          color: colors.foreground,
                        },
                      ]}
                      placeholder="이름을 입력하세요"
                      placeholderTextColor={colors.muted}
                      value={visitorName}
                      onChangeText={setVisitorName}
                      editable={!loading}
                    />
                  </View>

                  {/* 부서 입력 */}
                  <View>
                    <Text style={[styles.label, { color: colors.foreground }]}>
                      부서 <Text style={{ color: colors.error }}>*</Text>
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                          color: colors.foreground,
                        },
                      ]}
                      placeholder="부서를 입력하세요"
                      placeholderTextColor={colors.muted}
                      value={visitorDept}
                      onChangeText={setVisitorDept}
                      editable={!loading}
                    />
                  </View>
                </>
              )}

              <Pressable
                style={({ pressed }) => [
                  styles.loginBtn,
                  {
                    backgroundColor: loading ? colors.muted : colors.primary,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
                onPress={handleVisitorLogin}
                disabled={loading}
              >
                <IconSymbol name="person.fill" size={20} color="#FFFFFF" />
                <Text style={styles.loginBtnText}>
                  {loading ? "접속 중..." : "접속하기"}
                </Text>
              </Pressable>
            </View>
          )}

          {/* 안내 */}
          <View
            style={[
              styles.notice,
              { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" },
            ]}
          >
            <IconSymbol name="info.circle.fill" size={16} color={colors.primary} />
            <Text style={[styles.noticeText, { color: colors.primary }]}>
              {mode === "admin"
                ? "관리자 계정으로 로그인하면 모든 고충을 관리할 수 있습니다."
                : "방문자로 접속하면 고충을 접수하고 처리 현황을 확인할 수 있습니다."}
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: "center",
    gap: 12,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  appTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  appDesc: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  modeSelector: {
    flexDirection: "row",
    gap: 10,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
  },
  modeTabText: {
    fontSize: 15,
    fontWeight: "700",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  anonymousRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  anonymousTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  anonymousSub: {
    fontSize: 13,
  },
  loginBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
  },
  loginBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  noticeText: {
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },
});
