import React, { createContext, useContext, useEffect, useState } from "react";
import {
  type AuthState,
  type Admin,
  type Visitor,
  loadAuthState,
  saveAuthState,
  loginAsAdmin,
  loginAsVisitor,
  logout as logoutStore,
} from "./auth-store";

interface AuthContextType {
  authState: AuthState;
  isLoading: boolean;
  loginAdmin: (name: string, password: string) => Promise<void>;
  loginVisitor: (name: string, department: string, isAnonymous: boolean) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isLoggedIn: false,
    role: "visitor",
    user: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAuthState().then((state) => {
      setAuthState(state);
      setIsLoading(false);
    });
  }, []);

  const loginAdmin = async (name: string, password: string) => {
    const admin = await loginAsAdmin(name, password);
    const newState: AuthState = {
      isLoggedIn: true,
      role: "admin",
      user: admin,
    };
    setAuthState(newState);
    await saveAuthState(newState);
  };

  const loginVisitor = async (
    name: string,
    department: string,
    isAnonymous: boolean
  ) => {
    const visitor = await loginAsVisitor(name, department, isAnonymous);
    const newState: AuthState = {
      isLoggedIn: true,
      role: "visitor",
      user: visitor,
    };
    setAuthState(newState);
    await saveAuthState(newState);
  };

  const logout = async () => {
    await logoutStore();
    setAuthState({ isLoggedIn: false, role: "visitor", user: null });
  };

  return (
    <AuthContext.Provider value={{ authState, isLoading, loginAdmin, loginVisitor, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
