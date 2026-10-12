// Auth API slice — login, register, logout endpoints.

import { baseApi } from "./baseApi";
import { User } from "../types";

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  access: string;
  refresh: string;
}

interface RegisterRequest {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  password: string;
  confirm_password: string;
  department: string;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: "/auth/login/",
        method: "POST",
        body: credentials,
      }),
    }),
    register: builder.mutation<{ detail: string; user_id: string }, RegisterRequest>({
      query: (data) => ({
        url: "/auth/register/",
        method: "POST",
        body: data,
      }),
    }),
    getProfile: builder.query<User, void>({
      query: () => "/auth/profile/",
      providesTags: ["User"],
    }),
    logout: builder.mutation<{ detail: string }, { refresh: string }>({
      query: (body) => ({
        url: "/auth/logout/",
        method: "POST",
        body,
      }),
    }),
    listUsers: builder.query<User[], { role?: string; department?: string; search?: string }>({
      query: (params) => ({ url: "/auth/users/", params }),
      providesTags: ["User"],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetProfileQuery,
  useLogoutMutation,
  useListUsersQuery,
} = authApi;
