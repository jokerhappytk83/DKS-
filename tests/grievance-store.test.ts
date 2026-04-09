import { describe, it, expect, vi, beforeEach } from "vitest";

// AsyncStorage 모킹
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
}));

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  loadGrievances,
  saveGrievances,
  addGrievance,
  updateGrievanceStatus,
  loadUserProfile,
  saveUserProfile,
  type Grievance,
} from "../lib/grievance-store";

const mockGrievance: Grievance = {
  id: "test-1",
  title: "테스트 고충",
  content: "테스트 내용입니다.",
  category: "근무환경",
  urgency: "일반",
  isAnonymous: false,
  status: "접수중",
  submittedAt: new Date().toISOString(),
  submitterName: "테스트 직원",
  submitterDept: "개발팀",
  timeline: [
    {
      date: new Date().toISOString(),
      status: "접수중",
      comment: "고충이 접수되었습니다.",
    },
  ],
};

describe("grievance-store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("저장된 고충이 없을 때 샘플 데이터를 반환한다", async () => {
    vi.mocked(AsyncStorage.getItem).mockResolvedValue(null);
    const result = await loadGrievances();
    expect(result.length).toBeGreaterThan(0);
  });

  it("저장된 고충 데이터를 올바르게 파싱한다", async () => {
    const stored = [mockGrievance];
    vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify(stored));
    const result = await loadGrievances();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("test-1");
    expect(result[0].title).toBe("테스트 고충");
  });

  it("고충을 저장한다", async () => {
    vi.mocked(AsyncStorage.setItem).mockResolvedValue();
    await saveGrievances([mockGrievance]);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "grievances_v1",
      JSON.stringify([mockGrievance])
    );
  });

  it("새 고충을 목록 앞에 추가한다", async () => {
    const existing = [{ ...mockGrievance, id: "existing-1" }];
    vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify(existing));
    vi.mocked(AsyncStorage.setItem).mockResolvedValue();

    const newGrievance = { ...mockGrievance, id: "new-1" };
    await addGrievance(newGrievance);

    const saved = JSON.parse(
      vi.mocked(AsyncStorage.setItem).mock.calls[0][1] as string
    );
    expect(saved[0].id).toBe("new-1");
    expect(saved[1].id).toBe("existing-1");
  });

  it("고충 상태를 업데이트한다", async () => {
    const stored = [mockGrievance];
    vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify(stored));
    vi.mocked(AsyncStorage.setItem).mockResolvedValue();

    await updateGrievanceStatus("test-1", "검토중", "담당자 검토 시작");

    const saved = JSON.parse(
      vi.mocked(AsyncStorage.setItem).mock.calls[0][1] as string
    );
    expect(saved[0].status).toBe("검토중");
    expect(saved[0].adminComment).toBe("담당자 검토 시작");
    expect(saved[0].timeline).toHaveLength(2);
  });

  it("존재하지 않는 고충 상태 업데이트는 원본 데이터를 변경하지 않는다", async () => {
    const stored = [mockGrievance];
    vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify(stored));
    vi.mocked(AsyncStorage.setItem).mockResolvedValue();

    await updateGrievanceStatus("non-existent", "완료", "코멘트");

    // 존재하지 않는 ID이므로 저장이 호출되어도 원본 데이터는 변경되지 않음
    // setItem이 호출된 경우 원본 데이터가 유지되는지 확인
    const calls = vi.mocked(AsyncStorage.setItem).mock.calls;
    if (calls.length > 0) {
      const saved = JSON.parse(calls[0][1] as string);
      expect(saved[0].status).toBe("접수중"); // 변경 없음
    } else {
      // setItem이 호출되지 않은 경우도 정상 (구현에 따라 다름)
      expect(true).toBe(true);
    }
  });

  it("저장된 프로필이 없을 때 기본값을 반환한다", async () => {
    vi.mocked(AsyncStorage.getItem).mockResolvedValue(null);
    const profile = await loadUserProfile();
    expect(profile.name).toBe("홍길동");
    expect(profile.department).toBe("인사팀");
  });

  it("사용자 프로필을 저장한다", async () => {
    vi.mocked(AsyncStorage.setItem).mockResolvedValue();
    const profile = { name: "김철수", department: "개발팀", employeeId: "EMP002" };
    await saveUserProfile(profile);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "user_profile_v1",
      JSON.stringify(profile)
    );
  });
});
