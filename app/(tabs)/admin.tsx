import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";

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

const NEXT_STATUSES: Record<GrievanceStatus, GrievanceStatus[]> = {
  접수중: ["검토중", "반려"],
  검토중: ["처리중", "반려"],
  처리중: ["완료", "반려"],
  완료: [],
  반려: [],
};

type FilterTab = "전체" | GrievanceStatus;
const FILTER_TABS: FilterTab[] = ["전체", "접수중", "검토중", "처리중", "완료", "반려"];

function StatSummary({ grievances }: { grievances: Grievance[] }) {
  const colors = useColors();
  const stats: { label: string; count: number; color: string; icon: string }[] = [
    { label: "접수중", count: grievances.filter((g) => g.status === "접수중").length, color: "#3B82F6", icon: "📋" },
    { label: "검토중", count: grievances.filter((g) => g.status === "검토중").length, color: "#D97706", icon: "🔍" },
    { label: "처리중", count: grievances.filter((g) => g.status === "처리중").length, color: "#8B5CF6", icon: "⚙️" },
    { label: "완료", count: grievances.filter((g) => g.status === "완료").length, color: "#16A34A", icon: "✅" },
  ];

  return (
    <View style={styles.statsRow}>
      {stats.map((s) => (
        <View
          key={s.label}
          style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text style={{ fontSize: 20 }}>{s.icon}</Text>
          <Text style={[styles.statCount, { color: s.color }]}>{s.count}</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
}

function AdminGrievanceCard({
  item,
  onProcess,
}: {
  item: Grievance;
  onProcess: (g: Grievance) => void;
}) {
  const colors = useColors();
  const statusColor = STATUS_COLORS[item.status];
  const canProcess = NEXT_STATUSES[item.status].length > 0;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.cardAccent, { backgroundColor: statusColor }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={styles.cardMeta}>
              <Text style={[styles.metaText, { color: colors.muted }]}>
                {item.isAnonymous ? "익명" : `${item.submitterName} · ${item.submitterDept}`}
              </Text>
              {item.urgency === "긴급" && (
                <View style={[styles.urgentBadge, { backgroundColor: "#DC262615", borderColor: "#DC262640" }]}>
                  <Text style={{ color: "#DC2626", fontSize: 11, fontWeight: "700" }}>🚨 긴급</Text>
                </View>
              )}
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + "20", borderColor: statusColor + "40" }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
          </View>
        </View>

        <Text style={[styles.cardContent, { color: colors.muted }]} numberOfLines={2}>
          {item.content}
        </Text>

        <View style={styles.cardFooter}>
          <View style={styles.metaItem}>
            <IconSymbol name="tag.fill" size={12} color={colors.muted} />
            <Text style={[styles.metaText, { color: colors.muted }]}>{item.category}</Text>
          </View>
          <Text style={[styles.metaText, { color: colors.muted }]}>
            {new Date(item.submittedAt).toLocaleDateString("ko-KR")}
          </Text>
          {canProcess && (
            <Pressable
              style={({ pressed }) => [
                styles.processBtn,
                { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
              ]}
              onPress={() => onProcess(item)}
            >
              <Text style={styles.processBtnText}>처리</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

export default function AdminScreen() {
  const colors = useColors();
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [filter, setFilter] = useState<FilterTab>("전체");
  const [selected, setSelected] = useState<Grievance | null>(null);
  const [newStatus, setNewStatus] = useState<GrievanceStatus | null>(null);
  const [comment, setComment] = useState("");
  const [processing, setProcessing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadGrievances().then(setGrievances);
    }, [])
  );

  const filtered =
    filter === "전체" ? grievances : grievances.filter((g) => g.status === filter);

  const pendingCount = grievances.filter(
    (g) => g.status === "접수중" || g.status === "검토중"
  ).length;

  const handleProcess = (g: Grievance) => {
    setSelected(g);
    setNewStatus(NEXT_STATUSES[g.status][0]);
    setComment("");
  };

  const handleConfirm = async () => {
    if (!selected || !newStatus) return;
    if (!comment.trim()) {
      Alert.alert("입력 오류", "처리 코멘트를 입력해주세요.");
      return;
    }
    setProcessing(true);
    try {
      await updateGrievanceStatus(selected.id, newStatus, comment.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const updated = await loadGrievances();
      setGrievances(updated);
      setSelected(null);
      setComment("");
    } catch {
      Alert.alert("오류", "처리 중 오류가 발생했습니다.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ScreenContainer>
      {/* 헤더 */}
      <View style={[styles.header, { backgroundColor: "#1E293B" }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>관리자 대시보드</Text>
            <Text style={styles.headerSub}>전체 고충 현황을 관리합니다</Text>
          </View>
          <IconSymbol name="shield.fill" size={32} color="#FFFFFF" />
        </View>
        {pendingCount > 0 && (
          <View style={styles.pendingBanner}>
            <IconSymbol name="exclamationmark.triangle.fill" size={16} color="#FBBF24" />
            <Text style={styles.pendingText}>
              미처리 고충 {pendingCount}건이 있습니다
            </Text>
          </View>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ padding: 16, gap: 20 }}>
          {/* 통계 */}
          <StatSummary grievances={grievances} />

          {/* 필터 탭 */}
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={FILTER_TABS}
            keyExtractor={(item) => item}
            contentContainerStyle={{ gap: 8 }}
            renderItem={({ item: tab }) => {
              const isActive = filter === tab;
              const count =
                tab === "전체"
                  ? grievances.length
                  : grievances.filter((g) => g.status === tab).length;
              return (
                <Pressable
                  style={[
                    styles.filterTab,
                    {
                      backgroundColor: isActive ? "#1E293B" : colors.surface,
                      borderColor: isActive ? "#1E293B" : colors.border,
                    },
                  ]}
                  onPress={() => setFilter(tab)}
                >
                  <Text style={[styles.filterText, { color: isActive ? "#FFFFFF" : colors.muted }]}>
                    {tab} {count}
                  </Text>
                </Pressable>
              );
            }}
          />

          {/* 목록 */}
          {filtered.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={{ fontSize: 36 }}>📭</Text>
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                {filter === "전체" ? "접수된 고충이 없습니다" : `${filter} 상태의 고충이 없습니다`}
              </Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {filtered.map((item) => (
                <AdminGrievanceCard key={item.id} item={item} onProcess={handleProcess} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* 처리 모달 */}
      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>고충 처리</Text>
            {selected && (
              <>
                <Text style={[styles.modalSubTitle, { color: colors.muted }]} numberOfLines={2}>
                  {selected.title}
                </Text>

                {/* 상태 선택 */}
                <Text style={[styles.modalLabel, { color: colors.foreground }]}>처리 상태 선택</Text>
                <View style={styles.statusOptions}>
                  {NEXT_STATUSES[selected.status].map((s) => (
                    <Pressable
                      key={s}
                      style={[
                        styles.statusOption,
                        {
                          backgroundColor:
                            newStatus === s ? STATUS_COLORS[s] : colors.background,
                          borderColor:
                            newStatus === s ? STATUS_COLORS[s] : colors.border,
                        },
                      ]}
                      onPress={() => setNewStatus(s)}
                    >
                      <Text
                        style={[
                          styles.statusOptionText,
                          { color: newStatus === s ? "#FFFFFF" : colors.foreground },
                        ]}
                      >
                        {s}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* 코멘트 */}
                <Text style={[styles.modalLabel, { color: colors.foreground }]}>처리 코멘트 *</Text>
                <TextInput
                  style={[
                    styles.commentInput,
                    { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground },
                  ]}
                  placeholder="처리 내용을 입력하세요"
                  placeholderTextColor={colors.muted}
                  value={comment}
                  onChangeText={setComment}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />

                <View style={styles.modalActions}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.cancelModalBtn,
                      { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
                    ]}
                    onPress={() => setSelected(null)}
                  >
                    <Text style={[styles.cancelModalText, { color: colors.muted }]}>취소</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.confirmBtn,
                      { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
                    ]}
                    onPress={handleConfirm}
                    disabled={processing}
                  >
                    <Text style={styles.confirmText}>
                      {processing ? "처리 중..." : "처리 완료"}
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    gap: 12,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
  },
  pendingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(251,191,36,0.15)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.3)",
  },
  pendingText: {
    color: "#FBBF24",
    fontSize: 13,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    gap: 4,
  },
  statCount: {
    fontSize: 22,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
  },
  card: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardAccent: {
    width: 4,
    alignSelf: "stretch",
  },
  cardBody: {
    flex: 1,
    padding: 14,
    gap: 8,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardContent: {
    fontSize: 13,
    lineHeight: 19,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  urgentBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  processBtn: {
    marginLeft: "auto",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  processBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  empty: {
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    borderWidth: 1,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
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
    gap: 16,
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
  modalSubTitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  statusOptions: {
    flexDirection: "row",
    gap: 10,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
  },
  statusOptionText: {
    fontSize: 14,
    fontWeight: "700",
  },
  commentInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 100,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
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
