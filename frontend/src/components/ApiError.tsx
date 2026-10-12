import { getApiErrorMessage } from "../api/errorMessage";

interface Props {
  error: unknown;
  onRetry?: () => void;
}

export default function ApiError({ error, onRetry }: Props) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800"
    >
      <p className="font-semibold">We couldn’t load this information.</p>
      <p className="mt-1 text-rose-700">
        {getApiErrorMessage(error, "Please try again in a moment.")}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-lg border border-rose-300 px-3 py-1.5 font-semibold hover:bg-rose-100"
        >
          Try again
        </button>
      )}
    </div>
  );
}
