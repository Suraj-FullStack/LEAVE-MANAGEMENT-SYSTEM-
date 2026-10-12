// Auth slice — stores the logged-in user and JWT tokens in Redux.
// Tokens are also kept in localStorage so they survive a page refresh.

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "../types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
}

function readStoredUser(): User | null {
  const storedUser = localStorage.getItem("user");
  if (!storedUser) return null;

  try {
    const value: unknown = JSON.parse(storedUser);
    if (
      typeof value === "object" &&
      value !== null &&
      "id" in value &&
      "role" in value &&
      "full_name" in value &&
      typeof value.id === "string" &&
      typeof value.full_name === "string" &&
      (value.role === "admin" || value.role === "manager" || value.role === "employee")
    ) {
      return value as User;
    }
  } catch {
    localStorage.removeItem("user");
  }

  return null;
}

const initialState: AuthState = {
  user: readStoredUser(),
  accessToken: localStorage.getItem("accessToken"),
  refreshToken: localStorage.getItem("refreshToken"),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{ user: User; accessToken: string; refreshToken: string }>
    ) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      localStorage.setItem("user", JSON.stringify(action.payload.user));
      localStorage.setItem("accessToken", action.payload.accessToken);
      localStorage.setItem("refreshToken", action.payload.refreshToken);
    },
    updateTokens(
      state,
      action: PayloadAction<{ accessToken: string; refreshToken: string }>
    ) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      localStorage.setItem("accessToken", action.payload.accessToken);
      localStorage.setItem("refreshToken", action.payload.refreshToken);
    },
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    },
  },
});

export const { setCredentials, updateTokens, logout } = authSlice.actions;
export default authSlice.reducer;
