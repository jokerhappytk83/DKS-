import { useCallback, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import {
  type Grievance,
  type GrievanceStatus,
  loadGrievances,
} from "@/lib/grievance-store";

const STATUS_COLORS: Record<GrievanceStatus, string> = {
  접수중: "#3B82F6",
  검토중: "#D97706",
  처리중: "#8B5CF6",
  완료: "#16A34A",
  반려: "#DC2626",
};

const STATUS_ICONS: Record<GrievanceStatus, string> = {
  접수중: "clock.fill",
  검토중: "exclamationmark.triangle.fill",
  처리중: "gearshape.fill",
  완료: "checkmark.circle.fill",
  반려: "xmark.circle.fill",
};

type FilterTab = "전체" | GrievanceStatus;
const FILTER_TABS: FilterTab[] = ["전체", "접수중", "검토중", "처리중", "완료", "반려"];

function StatusBadge({ status }: { status: GrievanceStatus }) {
  const color = STATUS_COLORS[status];
  return (
    <View style={[styles.badge, { backgroundColor: color + "20", borderColor: color + "40" }]}>
      <Text style={[styles.badgeText, { color }]}>{status}</Text>
    </View>
  );
}

function GrievanceCard({
  item,
  onPress,
}: {
  item: Grievance;
  onPress: () => void;
}) {
  const colors = useColors();
  const statusColor = STATUS_COLORS[item.status];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
      onPress={onPress}
    >
      <View style={[styles.cardAccent, { backgroundColor: statusColor }]} />
      <View style={styles.cardContent}>
        <View style={styles.cardTop}>
          <Text
            style={[styles.cardTitle, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <StatusBadge status={item.status} />
        </View>
        <Text
          style={[styles.cardContent2, { color: colors.muted }]}
          numberOfLines={2}
        >
          {item.content}
        </Text>
        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <IconSymbol name="tag.fill" size={12} color={colors.muted} />
            <Text style={[styles.metaText, { color: colors.muted }]}>
              {item.category}
            </Text>
          </View>
          {item.urgency === "긴급" && (
            <View
              style={[
                styles.urgentBadge,
                { backgroundColor: "#DC262620", borderColor: "#DC262640" },
              ]}
            >
              <Text style={{ color: "#DC2626", fontSize: 11, fontWeight: "700" }}>
                🚨 긴급
              </Text>
            </View>
          )}
          <Text style={[styles.metaText, { color: colors.muted, marginLeft: "auto" }]}>
            {new Date(item.submittedAt).toLocaleDateString("ko-KR")}
          </Text>
        </View>
      </View>
      <IconSymbol name="chevron.right" size={18} color={colors.muted} />
    </Pressable>
  );
}

export default function ListScreen() {
  const colors = useColors();
  const router = useRouter();
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [filter, setFilter] = useState<FilterTab>("전체");

  useFocusEffect(
    useCallback(() => {
      loadGrievances().then(setGrievances);
    }, [])
  );

  const filtered =
    filter === "전체" ? grievances : grievances.filter((g) => g.status === filter);

  return (
    <ScreenContainer>
      {/* 헤더 */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.headerTitle}>내 고충 목록</Text>
        <Text style={styles.headerSub}>총 {grievances.length}건 접수</Text>
      </View>

      {/* 필터 탭 */}
      <View style={[styles.filterContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTER_TABS}
          keyExtractor={(item) => item}
          contentContainerStyle={{ paddingHorizontal: 12, gap: 8, paddingVertical: 10 }}
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
                    backgroundColor: isActive ? colors.primary : colors.background,
                    borderColor: isActive ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setFilter(tab)}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    { color: isActive ? "#FFFFFF" : colors.muted },
                  ]}
                >
                  {tab}
                </Text>
                <View
                  style={[
                    styles.filterCount,
                    {
                      backgroundColor: isActive
                        ? "rgba(255,255,255,0.3)"
                        : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterCountText,
                      { color: isActive ? "#FFFFFF" : colors.muted },
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />
      </View>

      {/* 목록 */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={{ fontSize: 40 }}>📭</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {filter === "전체" ? "접수된 고충이 없습니다" : `${filter} 상태의 고충이 없습니다`}
            </Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              상단의 접수 탭에서 고충을 접수해보세요
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <GrievanceCard
            item={item}
            onPress={() =>
              router.push({
                pathname: "/grievance/[id]",
                params: { id: item.id },
              } as any)
            }
          />
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
  },
  filterContainer: {
    borderBottomWidth: 1,
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: "600",
  },
  filterCount: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  filterCountText: {
    fontSize: 11,
    fontWeight: "700",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardAccent: {
    width: 4,
    alignSelf: "stretch",
  },
  cardContent: {
    flex: 1,
    padding: 14,
    gap: 6,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
  },
  cardContent2: {
    fontSize: 13,
    lineHeight: 19,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
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
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  empty: {
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    borderWidth: 1,
    gap: 10,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
});
