// Reusable page navigation bar.
// Gets total count and current page, calls onPageChange when user clicks.

interface Props {
  count: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ count, page, pageSize, onPageChange }: Props) {
  const totalPages = Math.ceil(count / pageSize);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center gap-2 mt-4">
      <button
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        className="px-3 py-1 rounded border text-sm disabled:opacity-40"
      >
        Previous
      </button>
      <span className="text-sm text-gray-600">
        Page {page} of {totalPages}
      </span>
      <button
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
        className="px-3 py-1 rounded border text-sm disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}
