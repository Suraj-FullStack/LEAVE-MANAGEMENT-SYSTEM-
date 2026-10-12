// Registration page — creates a new user account.
// Role defaults to employee; admins can change roles via the user management page.

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useRegisterMutation } from "../../api/authApi";
import { getApiErrorMessage } from "../../api/errorMessage";

const schema = z
  .object({
    email: z.string().email("Enter a valid email."),
    username: z.string().min(3, "Username must be at least 3 characters."),
    first_name: z.string().min(1, "First name is required."),
    last_name: z.string().min(1, "Last name is required."),
    department: z.string().min(1, "Department is required."),
    password: z.string().min(6, "Password must be at least 6 characters."),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords do not match.",
    path: ["confirm_password"],
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [register, { isLoading }] = useRegisterMutation();

  const {
    register: rhfRegister,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormValues) {
    try {
      await register(data).unwrap();
      toast.success("Account created. Please log in.");
      navigate("/login");
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Registration failed. Please try again."));
    }
  }

  const Field = ({
    name,
    label,
    type = "text",
  }: {
    name: keyof FormValues;
    label: string;
    type?: string;
  }) => (
    <div>
      <label htmlFor={`register-${name}`} className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</label>
      <input
        {...rhfRegister(name)}
        id={`register-${name}`}
        type={type}
        autoComplete={name === "password" ? "new-password" : name === "confirm_password" ? "new-password" : name === "email" ? "email" : name === "username" ? "username" : "given-name"}
        aria-invalid={Boolean(errors[name])}
        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
      {errors[name] && (
        <p className="text-red-500 text-xs mt-1">{errors[name]?.message}</p>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
        <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 px-8 py-7 text-white">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 text-sm font-black tracking-wide ring-1 ring-white/20">LM</span>
          <p className="mt-5 text-sm font-medium text-blue-100">Join LeaveFlow</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">Create your account</h2>
          <p className="mt-2 text-sm text-blue-100">Start managing your leave requests in one place.</p>
        </div>
        <div className="p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field name="first_name" label="First Name" />
          <Field name="last_name" label="Last Name" />
          <div className="sm:col-span-2">
            <Field name="email" label="Email" type="email" />
          </div>
          <Field name="username" label="Username" />
          <Field name="department" label="Department" />
          <Field name="password" label="Password" type="password" />
          <Field name="confirm_password" label="Confirm Password" type="password" />
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-900/15 hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-wait disabled:opacity-50"
            >
              {isLoading ? "Creating account..." : "Register"}
            </button>
          </div>
        </form>
        <p className="mt-5 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-blue-700 hover:underline">
            Sign in
          </Link>
        </p>
        </div>
      </div>
    </div>
  );
}
