function readMessage(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value;
  if (Array.isArray(value)) {
    for (const entry of value) {
      const message = readMessage(entry);
      if (message) return message;
    }
  } else if (typeof value === "object" && value !== null) {
    if ("detail" in value) {
      const message = readMessage(value.detail);
      if (message) return message;
    }
    if ("non_field_errors" in value) {
      const message = readMessage(value.non_field_errors);
      if (message) return message;
    }
    if ("data" in value) {
      const message = readMessage(value.data);
      if (message) return message;
    }
  }

  return undefined;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  return readMessage(error) ?? fallback;
}
