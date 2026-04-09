import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
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
  loadUserProfile,
} from "@/lib/grievance-store";

const STATUS_COLORS: Record<GrievanceStatus, string> = {
  접수중: "#3B82F6",
  검토중: "#D97706",
  처리중: "#8B5CF6",
  완료: "#16A34A",
  반려: "#DC2626",
};

function StatusBadge({ status }: { status: GrievanceStatus }) {
  const color = STATUS_COLORS[status];
  return (
    <View style={[styles.badge, { backgroundColor: color + "20", borderColor: color + "40" }]}>
      <Text style={[styles.badgeText, { color }]}>{status}</Text>
    </View>
  );
}

function StatCard({
  label,
  count,
  color,
  icon,
}: {
  label: string;
  count: number;
  color: string;
  icon: string;
}) {
  const colors = useColors();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.statIcon, { backgroundColor: color + "20" }]}>
        <Text style={{ fontSize: 20 }}>{icon}</Text>
      </View>
      <Text style={[styles.statCount, { color: colors.foreground }]}>{count}</Text>
      <Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [userName, setUserName] = useState("직원");

  useFocusEffect(
    useCallback(() => {
      loadGrievances().then(setGrievances);
      loadUserProfile().then((p) => setUserName(p.name));
    }, [])
  );

  const stats = {
    접수중: grievances.filter((g) => g.status === "접수중").length,
    처리중: grievances.filter((g) => g.status === "검토중" || g.status === "처리중").length,
    완료: grievances.filter((g) => g.status === "완료").length,
  };

  const recent = grievances.slice(0, 3);

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <View>
            <Text style={styles.greeting}>안녕하세요, {userName}님 👋</Text>
            <Text style={styles.headerSub}>고충처리 접수 시스템</Text>
          </View>
          <View style={styles.logoBox}>
            <IconSymbol name="shield.fill" size={32} color="#FFFFFF" />
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, paddingTop: 20, gap: 20 }}>
          {/* 현황 요약 */}
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>내 고충 현황</Text>
            <View style={styles.statsRow}>
              <StatCard label="접수중" count={stats.접수중} color="#3B82F6" icon="📋" />
              <StatCard label="처리중" count={stats.처리중} color="#8B5CF6" icon="⚙️" />
              <StatCard label="완료" count={stats.완료} color="#16A34A" icon="✅" />
            </View>
          </View>

          {/* 빠른 접수 버튼 */}
          <Pressable
            style={({ pressed }) => [
              styles.submitBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => router.push("/(tabs)/submit" as any)}
          >
            <IconSymbol name="plus.circle.fill" size={22} color="#FFFFFF" />
            <Text style={styles.submitBtnText}>고충 접수하기</Text>
            <IconSymbol name="chevron.right" size={20} color="#FFFFFF" />
          </Pressable>

          {/* 최근 접수 목록 */}
          <View>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>최근 접수 내역</Text>
              <Pressable onPress={() => router.push("/(tabs)/list" as any)}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>전체보기</Text>
              </Pressable>
            </View>

            {recent.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={{ fontSize: 32 }}>📭</Text>
                <Text style={[styles.emptyText, { color: colors.muted }]}>
                  아직 접수된 고충이 없습니다.
                </Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {recent.map((item) => (
                  <Pressable
                    key={item.id}
                    style={({ pressed }) => [
                      styles.recentCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        opacity: pressed ? 0.75 : 1,
                      },
                    ]}
                    onPress={() =>
                      router.push({ pathname: "/grievance/[id]", params: { id: item.id } } as any)
                    }
                  >
                    <View style={styles.recentCardTop}>
                      <Text
                        style={[styles.recentTitle, { color: colors.foreground }]}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      <StatusBadge status={item.status} />
                    </View>
                    <View style={styles.recentCardBottom}>
                      <Text style={[styles.recentMeta, { color: colors.muted }]}>
                        {item.category}
                      </Text>
                      <Text style={[styles.recentMeta, { color: colors.muted }]}>
                        {new Date(item.submittedAt).toLocaleDateString("ko-KR")}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* 안내 배너 */}
          <View style={[styles.infoBanner, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
            <IconSymbol name="info.circle.fill" size={18} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.primary }]}>
              모든 고충은 익명으로 처리될 수 있으며, 접수 후 3영업일 내 담당자가 검토합니다.
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
    paddingTop: 20,
    paddingBottom: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
  },
  logoBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "500",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    gap: 6,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statCount: {
    fontSize: 24,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },
  recentCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    gap: 8,
  },
  recentCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  recentTitle: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  recentCardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  recentMeta: {
    fontSize: 12,
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
  emptyCard: {
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },
});
