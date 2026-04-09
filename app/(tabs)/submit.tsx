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
import {
  type GrievanceCategory,
  type GrievanceUrgency,
  addGrievance,
  loadUserProfile,
} from "@/lib/grievance-store";

const CATEGORIES: GrievanceCategory[] = ["근무환경", "인사", "급여", "대인관계", "기타"];

const CATEGORY_ICONS: Record<GrievanceCategory, string> = {
  근무환경: "🏢",
  인사: "👤",
  급여: "💰",
  대인관계: "🤝",
  기타: "📌",
};

export default function SubmitScreen() {
  const colors = useColors();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<GrievanceCategory>("근무환경");
  const [urgency, setUrgency] = useState<GrievanceUrgency>("일반");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("입력 오류", "제목을 입력해주세요.");
      return;
    }
    if (!content.trim() || content.trim().length < 10) {
      Alert.alert("입력 오류", "내용을 10자 이상 입력해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const profile = await loadUserProfile();
      const now = new Date().toISOString();
      await addGrievance({
        id: `grievance-${Date.now()}`,
        title: title.trim(),
        content: content.trim(),
        category,
        urgency,
        isAnonymous,
        status: "접수중",
        submittedAt: now,
        submitterName: isAnonymous ? "익명" : profile.name,
        submitterDept: isAnonymous ? "비공개" : profile.department,
        timeline: [
          {
            date: now,
            status: "접수중",
            comment: "고충이 접수되었습니다.",
          },
        ],
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "접수 완료",
        "고충이 성공적으로 접수되었습니다.\n담당자가 3영업일 내 검토할 예정입니다.",
        [
          {
            text: "확인",
            onPress: () => {
              setTitle("");
              setContent("");
              setCategory("근무환경");
              setUrgency("일반");
              setIsAnonymous(false);
              router.push("/");
            },
          },
        ]
      );
    } catch (e) {
      Alert.alert("오류", "접수 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
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
          <Text style={styles.headerTitle}>고충 접수</Text>
          <Text style={styles.headerSub}>불편 사항을 자유롭게 작성해주세요</Text>
        </View>

        <View style={{ padding: 16, gap: 20 }}>
          {/* 카테고리 선택 */}
          <View>
            <Text style={[styles.label, { color: colors.foreground }]}>
              카테고리 <Text style={{ color: colors.error }}>*</Text>
            </Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  style={({ pressed }) => [
                    styles.categoryBtn,
                    {
                      backgroundColor:
                        category === cat ? colors.primary : colors.surface,
                      borderColor:
                        category === cat ? colors.primary : colors.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={{ fontSize: 18 }}>{CATEGORY_ICONS[cat]}</Text>
                  <Text
                    style={[
                      styles.categoryText,
                      { color: category === cat ? "#FFFFFF" : colors.foreground },
                    ]}
                  >
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* 긴급도 */}
          <View>
            <Text style={[styles.label, { color: colors.foreground }]}>긴급도</Text>
            <View style={styles.urgencyRow}>
              {(["일반", "긴급"] as GrievanceUrgency[]).map((u) => (
                <Pressable
                  key={u}
                  style={({ pressed }) => [
                    styles.urgencyBtn,
                    {
                      backgroundColor:
                        urgency === u
                          ? u === "긴급"
                            ? "#DC2626"
                            : colors.primary
                          : colors.surface,
                      borderColor:
                        urgency === u
                          ? u === "긴급"
                            ? "#DC2626"
                            : colors.primary
                          : colors.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                  onPress={() => setUrgency(u)}
                >
                  <Text style={{ fontSize: 16 }}>{u === "긴급" ? "🚨" : "📄"}</Text>
                  <Text
                    style={[
                      styles.urgencyText,
                      { color: urgency === u ? "#FFFFFF" : colors.foreground },
                    ]}
                  >
                    {u}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* 제목 */}
          <View>
            <Text style={[styles.label, { color: colors.foreground }]}>
              제목 <Text style={{ color: colors.error }}>*</Text>
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
              placeholder="고충 사항의 제목을 입력하세요"
              placeholderTextColor={colors.muted}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
              returnKeyType="next"
            />
            <Text style={[styles.charCount, { color: colors.muted }]}>
              {title.length}/100
            </Text>
          </View>

          {/* 내용 */}
          <View>
            <Text style={[styles.label, { color: colors.foreground }]}>
              상세 내용 <Text style={{ color: colors.error }}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.textarea,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              placeholder="고충 사항을 구체적으로 작성해주세요 (최소 10자)"
              placeholderTextColor={colors.muted}
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={2000}
            />
            <Text style={[styles.charCount, { color: colors.muted }]}>
              {content.length}/2000
            </Text>
          </View>

          {/* 익명 여부 */}
          <View
            style={[
              styles.anonymousRow,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.anonymousTitle, { color: colors.foreground }]}>
                익명으로 접수
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

          {/* 주의사항 */}
          <View
            style={[
              styles.notice,
              { backgroundColor: colors.warning + "15", borderColor: colors.warning + "40" },
            ]}
          >
            <IconSymbol name="exclamationmark.triangle.fill" size={16} color={colors.warning} />
            <Text style={[styles.noticeText, { color: colors.warning }]}>
              허위 또는 악의적인 고충 접수는 사규에 따라 처리될 수 있습니다.
            </Text>
          </View>

          {/* 제출 버튼 */}
          <Pressable
            style={({ pressed }) => [
              styles.submitBtn,
              {
                backgroundColor: submitting ? colors.muted : colors.primary,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <IconSymbol name="paperplane.fill" size={20} color="#FFFFFF" />
            <Text style={styles.submitText}>
              {submitting ? "접수 중..." : "고충 접수하기"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
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
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "600",
  },
  urgencyRow: {
    flexDirection: "row",
    gap: 10,
  },
  urgencyBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  urgencyText: {
    fontSize: 15,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    lineHeight: 22,
  },
  textarea: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 140,
  },
  charCount: {
    fontSize: 12,
    textAlign: "right",
    marginTop: 4,
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
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  noticeText: {
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
