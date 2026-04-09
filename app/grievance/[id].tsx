import { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import {
  type Grievance,
  type GrievanceStatus,
  loadGrievances,
  updateGrievanceStatus,
} from "@/lib/grievance-store";

const STATUS_COLORS: Record<GrievanceStatus, string> = {
  접수중: "#3B82F6",
  검토중: "#D97706",
  처리중: "#8B5CF6",
  완료: "#16A34A",
  반려: "#DC2626",
};

const STATUS_ICONS: Record<GrievanceStatus, string> = {
  접수중: "📋",
  검토중: "🔍",
  처리중: "⚙️",
  완료: "✅",
  반려: "❌",
};

function TimelineItem({
  item,
  isLast,
}: {
  item: { date: string; status: GrievanceStatus; comment: string };
  isLast: boolean;
}) {
  const colors = useColors();
  const color = STATUS_COLORS[item.status];

  return (
    <View style={styles.timelineItem}>
      <View style={styles.timelineLeft}>
        <View style={[styles.timelineDot, { backgroundColor: color, borderColor: color + "40" }]}>
          <Text style={{ fontSize: 12 }}>{STATUS_ICONS[item.status]}</Text>
        </View>
        {!isLast && <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />}
      </View>
      <View style={styles.timelineContent}>
        <View style={styles.timelineHeader}>
          <View style={[styles.timelineStatus, { backgroundColor: color + "20", borderColor: color + "40" }]}>
            <Text style={[styles.timelineStatusText, { color }]}>{item.status}</Text>
          </View>
          <Text style={[styles.timelineDate, { color: colors.muted }]}>
            {new Date(item.date).toLocaleDateString("ko-KR", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
        <Text style={[styles.timelineComment, { color: colors.foreground }]}>
          {item.comment}
        </Text>
      </View>
    </View>
  );
}

export default function GrievanceDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [grievance, setGrievance] = useState<Grievance | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadGrievances().then((list) => {
        const found = list.find((g) => g.id === id);
        setGrievance(found ?? null);
      });
    }, [id])
  );

  if (!grievance) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text style={{ color: colors.muted, fontSize: 16 }}>로딩 중...</Text>
      </ScreenContainer>
    );
  }

  const statusColor = STATUS_COLORS[grievance.status];
  const canCancel = grievance.status === "접수중";

  const handleCancel = () => {
    Alert.alert(
      "접수 취소",
      "이 고충 접수를 취소하시겠습니까?",
      [
        { text: "아니오", style: "cancel" },
        {
          text: "취소하기",
          style: "destructive",
          onPress: async () => {
            await updateGrievanceStatus(grievance.id, "반려", "사용자가 접수를 취소했습니다.");
            Alert.alert("완료", "접수가 취소되었습니다.", [
              { text: "확인", onPress: () => router.back() },
            ]);
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 */}
        <View style={[styles.header, { backgroundColor: statusColor }]}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={22} color="#FFFFFF" />
            <Text style={styles.backText}>뒤로</Text>
          </Pressable>
          <View style={styles.headerBody}>
            <Text style={styles.headerStatus}>
              {STATUS_ICONS[grievance.status]} {grievance.status}
            </Text>
            <Text style={styles.headerTitle} numberOfLines={2}>
              {grievance.title}
            </Text>
          </View>
        </View>

        <View style={{ padding: 16, gap: 20 }}>
          {/* 기본 정보 */}
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.infoCardTitle, { color: colors.foreground }]}>접수 정보</Text>
            <View style={styles.infoGrid}>
              <InfoRow label="카테고리" value={grievance.category} colors={colors} />
              <InfoRow label="긴급도" value={grievance.urgency} colors={colors} />
              <InfoRow
                label="접수자"
                value={grievance.isAnonymous ? "익명" : `${grievance.submitterName} (${grievance.submitterDept})`}
                colors={colors}
              />
              <InfoRow
                label="접수일"
                value={new Date(grievance.submittedAt).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                colors={colors}
              />
            </View>
          </View>

          {/* 상세 내용 */}
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.infoCardTitle, { color: colors.foreground }]}>상세 내용</Text>
            <Text style={[styles.contentText, { color: colors.foreground }]}>
              {grievance.content}
            </Text>
          </View>

          {/* 담당자 코멘트 */}
          {grievance.adminComment && (
            <View
              style={[
                styles.infoCard,
                { backgroundColor: statusColor + "10", borderColor: statusColor + "30" },
              ]}
            >
              <View style={styles.commentHeader}>
                <IconSymbol name="person.fill" size={16} color={statusColor} />
                <Text style={[styles.infoCardTitle, { color: statusColor }]}>
                  담당자 코멘트
                </Text>
              </View>
              <Text style={[styles.contentText, { color: colors.foreground }]}>
                {grievance.adminComment}
              </Text>
            </View>
          )}

          {/* 처리 타임라인 */}
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.infoCardTitle, { color: colors.foreground }]}>처리 현황</Text>
            <View style={{ marginTop: 8 }}>
              {grievance.timeline.map((item, idx) => (
                <TimelineItem
                  key={idx}
                  item={item}
                  isLast={idx === grievance.timeline.length - 1}
                />
              ))}
            </View>
          </View>

          {/* 취소 버튼 */}
          {canCancel && (
            <Pressable
              style={({ pressed }) => [
                styles.cancelBtn,
                { borderColor: colors.error, opacity: pressed ? 0.75 : 1 },
              ]}
              onPress={handleCancel}
            >
              <IconSymbol name="xmark.circle.fill" size={18} color={colors.error} />
              <Text style={[styles.cancelText, { color: colors.error }]}>접수 취소</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function InfoRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 12,
  },
  backText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
  },
  headerBody: {
    gap: 6,
  },
  headerStatus: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontWeight: "600",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 30,
  },
  infoCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  infoCardTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  infoGrid: {
    gap: 10,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
    maxWidth: "60%",
    textAlign: "right",
  },
  contentText: {
    fontSize: 15,
    lineHeight: 24,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timelineItem: {
    flexDirection: "row",
    gap: 12,
    minHeight: 60,
  },
  timelineLeft: {
    alignItems: "center",
    width: 36,
  },
  timelineDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 16,
    gap: 6,
  },
  timelineHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timelineStatus: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  timelineStatusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  timelineDate: {
    fontSize: 12,
  },
  timelineComment: {
    fontSize: 14,
    lineHeight: 20,
  },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
