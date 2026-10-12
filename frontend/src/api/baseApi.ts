// RTK Query base API — every other API slice extends this.
// The baseQuery automatically attaches the Bearer token from Redux.

import { createApi, fetchBaseQuery, BaseQueryFn } from "@reduxjs/toolkit/query/react";
import { RootState } from "../store";
import { logout, updateTokens } from "../store/authSlice";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

// Standard fetch, injects the Authorization header from the store
const rawBaseQuery = fetchBaseQuery({
  baseUrl: "/api",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

interface RefreshedTokens {
  accessToken: string;
  refreshToken: string;
}

let refreshPromise: Promise<RefreshedTokens | null> | null = null;

async function refreshTokens(
  api: Parameters<BaseQueryFn>[1],
  extraOptions: Parameters<BaseQueryFn>[2]
): Promise<RefreshedTokens | null> {
  const currentRefreshToken = (api.getState() as RootState).auth.refreshToken;
  if (!currentRefreshToken) return null;

  const result = await rawBaseQuery(
    {
      url: "/auth/login/refresh/",
      method: "POST",
      body: { refresh: currentRefreshToken },
    },
    api,
    extraOptions
  );
  if (!result.data || typeof result.data !== "object" || !("access" in result.data)) {
    return null;
  }

  const data = result.data as { access?: unknown; refresh?: unknown };
  if (typeof data.access !== "string") return null;
  return {
    accessToken: data.access,
    refreshToken:
      typeof data.refresh === "string" ? data.refresh : currentRefreshToken,
  };
}

// Retry requests once with a refreshed access token before ending the session.
const baseQueryWithReauth: BaseQueryFn = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  const requestUrl = typeof args === "string" ? args : args.url;
  const isAuthEntryPoint =
    requestUrl === "/auth/login/" ||
    requestUrl === "/auth/register/" ||
    requestUrl === "/auth/login/refresh/";

  if (
    result.error &&
    (result.error as FetchBaseQueryError).status === 401 &&
    !isAuthEntryPoint
  ) {
    if (!refreshPromise) {
      refreshPromise = refreshTokens(api, extraOptions);
    }
    const tokens = await refreshPromise;
    refreshPromise = null;

    if (tokens) {
      api.dispatch(updateTokens(tokens));
      return rawBaseQuery(args, api, extraOptions);
    }

    api.dispatch(logout());
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["LeaveRequest", "Notification", "User", "LeaveBalance"],
  endpoints: () => ({}),
});
