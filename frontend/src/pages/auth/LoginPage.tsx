// Login page — React Hook Form + Zod validation, posts to /api/auth/login/.
// On success it fetches the user profile and stores everything in Redux.

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useLoginMutation } from "../../api/authApi";
import { useAppDispatch } from "../../store";
import { setCredentials } from "../../store/authSlice";
import { User } from "../../types";
import { getApiErrorMessage } from "../../api/errorMessage";

const schema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(1, "Password is required."),
});

type FormValues = z.infer<typeof schema>;

function getLoginErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return getApiErrorMessage(
    error,
    "Login failed. Check your credentials and try again."
  );
}

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormValues) {
    try {
      const tokens = await login(data).unwrap();

      // Fetch the full user profile after getting the token
      // We need role info to redirect correctly
      const profileRes = await fetch("/api/auth/profile/", {
        headers: { Authorization: `Bearer ${tokens.access}` },
      });
      if (!profileRes.ok) {
        const errorBody: unknown = await profileRes.json();
        throw new Error(
          getApiErrorMessage(
            errorBody,
            `Unable to load your profile (HTTP ${profileRes.status}).`
          )
        );
      }
      const user: User = await profileRes.json();

      dispatch(
        setCredentials({
          user,
          accessToken: tokens.access,
          refreshToken: tokens.refresh,
        })
      );
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err: unknown) {
      toast.error(getLoginErrorMessage(err));
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
        <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 px-8 py-7 text-white">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 text-sm font-black tracking-wide ring-1 ring-white/20">
            LM
          </span>
          <p className="mt-5 text-sm font-medium text-blue-100">LeaveFlow workspace</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">Welcome back</h2>
          <p className="mt-2 text-sm text-blue-100">Sign in to manage your time away.</p>
        </div>
        <div className="p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label htmlFor="login-email" className="mb-1.5 block text-sm font-semibold text-slate-700">Email</label>
            <input
              {...register("email")}
              id="login-email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              placeholder="you@example.com"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="login-password" className="mb-1.5 block text-sm font-semibold text-slate-700">Password</label>
            <input
              {...register("password")}
              id="login-password"
              type="password"
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-900/15 hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-wait disabled:opacity-50"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-slate-500">
          No account?{" "}
          <Link to="/register" className="font-semibold text-blue-700 hover:underline">
            Register
          </Link>
        </p>
        </div>
      </div>
    </div>
  );
}
