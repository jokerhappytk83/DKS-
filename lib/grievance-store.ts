import AsyncStorage from "@react-native-async-storage/async-storage";

export type GrievanceCategory =
  | "근무환경"
  | "인사"
  | "급여"
  | "대인관계"
  | "기타";

export type GrievanceUrgency = "일반" | "긴급";

export type GrievanceStatus =
  | "접수중"
  | "검토중"
  | "처리중"
  | "완료"
  | "반려";

export interface GrievanceTimeline {
  date: string;
  status: GrievanceStatus;
  comment: string;
}

export interface Grievance {
  id: string;
  title: string;
  content: string;
  category: GrievanceCategory;
  urgency: GrievanceUrgency;
  isAnonymous: boolean;
  status: GrievanceStatus;
  submittedAt: string;
  submitterName: string;
  submitterDept: string;
  timeline: GrievanceTimeline[];
  adminComment?: string;
}

export interface UserProfile {
  name: string;
  department: string;
  employeeId: string;
}

const STORAGE_KEY = "grievances_v1";
const PROFILE_KEY = "user_profile_v1";

export async function loadGrievances(): Promise<Grievance[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return getSampleGrievances();
    return JSON.parse(raw);
  } catch {
    return getSampleGrievances();
  }
}

export async function saveGrievances(grievances: Grievance[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(grievances));
}

export async function addGrievance(grievance: Grievance): Promise<void> {
  const list = await loadGrievances();
  list.unshift(grievance);
  await saveGrievances(list);
}

export async function updateGrievanceStatus(
  id: string,
  status: GrievanceStatus,
  comment: string
): Promise<void> {
  const list = await loadGrievances();
  const idx = list.findIndex((g) => g.id === id);
  if (idx !== -1) {
    list[idx].status = status;
    list[idx].adminComment = comment;
    list[idx].timeline.push({
      date: new Date().toISOString(),
      status,
      comment,
    });
    await saveGrievances(list);
  }
}

export async function loadUserProfile(): Promise<UserProfile> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    if (!raw) return { name: "홍길동", department: "인사팀", employeeId: "EMP001" };
    return JSON.parse(raw);
  } catch {
    return { name: "홍길동", department: "인사팀", employeeId: "EMP001" };
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

function getSampleGrievances(): Grievance[] {
  return [
    {
      id: "sample-1",
      title: "사무실 냉방 온도 조절 문제",
      content: "여름철 사무실 냉방이 너무 강해 업무에 집중하기 어렵습니다. 적절한 온도 조절이 필요합니다.",
      category: "근무환경",
      urgency: "일반",
      isAnonymous: false,
      status: "처리중",
      submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      submitterName: "홍길동",
      submitterDept: "인사팀",
      timeline: [
        {
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          status: "접수중",
          comment: "고충이 접수되었습니다.",
        },
        {
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          status: "검토중",
          comment: "담당 부서에서 검토 중입니다.",
        },
        {
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          status: "처리중",
          comment: "시설관리팀에 온도 조절 요청을 전달했습니다.",
        },
      ],
    },
    {
      id: "sample-2",
      title: "초과근무 수당 미지급",
      content: "지난 달 초과근무 수당이 급여명세서에 반영되지 않았습니다. 확인 및 정정을 요청드립니다.",
      category: "급여",
      urgency: "긴급",
      isAnonymous: false,
      status: "완료",
      submittedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      submitterName: "홍길동",
      submitterDept: "인사팀",
      timeline: [
        {
          date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          status: "접수중",
          comment: "고충이 접수되었습니다.",
        },
        {
          date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
          status: "처리중",
          comment: "급여팀에서 확인 중입니다.",
        },
        {
          date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          status: "완료",
          comment: "초과근무 수당이 다음 급여일에 추가 지급될 예정입니다.",
        },
      ],
      adminComment: "초과근무 수당이 다음 급여일에 추가 지급될 예정입니다.",
    },
  ];
}
