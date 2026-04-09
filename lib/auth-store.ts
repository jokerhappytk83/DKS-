import AsyncStorage from "@react-native-async-storage/async-storage";

export type UserRole = "admin" | "visitor";

export interface Admin {
  id: string;
  name: string;
  password: string;
  createdAt: string;
}

export interface Visitor {
  id: string;
  name: string;
  department: string;
  isAnonymous: boolean;
}

export interface AuthState {
  isLoggedIn: boolean;
  role: UserRole;
  user: Admin | Visitor | null;
}

const ADMINS_KEY = "admins_v1";
const AUTH_STATE_KEY = "auth_state_v1";

// 메인 관리자 (초기 설정용)
const DEFAULT_ADMIN: Admin = {
  id: "admin-main",
  name: "dkcass",
  password: "dkcass8131",
  createdAt: new Date().toISOString(),
};

export async function loadAdmins(): Promise<Admin[]> {
  try {
    const raw = await AsyncStorage.getItem(ADMINS_KEY);
    if (!raw) return [DEFAULT_ADMIN];
    return JSON.parse(raw);
  } catch {
    return [DEFAULT_ADMIN];
  }
}

export async function saveAdmins(admins: Admin[]): Promise<void> {
  await AsyncStorage.setItem(ADMINS_KEY, JSON.stringify(admins));
}

export async function addAdmin(name: string, password: string): Promise<Admin> {
  const admins = await loadAdmins();
  if (admins.length >= 5) {
    throw new Error("최대 5명의 관리자만 등록할 수 있습니다.");
  }

  const newAdmin: Admin = {
    id: `admin-${Date.now()}`,
    name,
    password,
    createdAt: new Date().toISOString(),
  };

  admins.push(newAdmin);
  await saveAdmins(admins);
  return newAdmin;
}

export async function removeAdmin(adminId: string): Promise<void> {
  const admins = await loadAdmins();
  const filtered = admins.filter((a) => a.id !== adminId);
  if (filtered.length === 0) {
    throw new Error("최소 1명의 관리자는 유지되어야 합니다.");
  }
  await saveAdmins(filtered);
}

export async function loginAsAdmin(name: string, password: string): Promise<Admin> {
  const admins = await loadAdmins();
  const admin = admins.find((a) => a.name === name && a.password === password);
  if (!admin) {
    throw new Error("관리자 이름 또는 비밀번호가 일치하지 않습니다.");
  }
  return admin;
}

export async function loginAsVisitor(
  name: string,
  department: string,
  isAnonymous: boolean
): Promise<Visitor> {
  const visitor: Visitor = {
    id: `visitor-${Date.now()}`,
    name: isAnonymous ? "익명" : name,
    department: isAnonymous ? "비공개" : department,
    isAnonymous,
  };
  return visitor;
}

export async function saveAuthState(state: AuthState): Promise<void> {
  await AsyncStorage.setItem(AUTH_STATE_KEY, JSON.stringify(state));
}

export async function loadAuthState(): Promise<AuthState> {
  try {
    const raw = await AsyncStorage.getItem(AUTH_STATE_KEY);
    if (!raw) {
      return { isLoggedIn: false, role: "visitor", user: null };
    }
    return JSON.parse(raw);
  } catch {
    return { isLoggedIn: false, role: "visitor", user: null };
  }
}

export async function logout(): Promise<void> {
  await saveAuthState({ isLoggedIn: false, role: "visitor", user: null });
}
