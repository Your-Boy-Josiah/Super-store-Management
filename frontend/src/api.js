export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}
export async function api(path, { token, method = "GET", body } = {}) {
  const form = body instanceof FormData;
  const response = await fetch("/api" + path, {
    method,
    headers: {
      ...(token ? { Authorization: "Bearer " + token } : {}),
      ...(!form && body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? (form ? body : JSON.stringify(body)) : undefined,
  });
  const data = await response
    .json()
    .catch(() => ({ message: "The server returned an unexpected response" }));
  if (!response.ok)
    throw new ApiError(data.message || "Request failed", response.status);
  return data;
}
export const money = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(value || 0);
export const date = (value) => (value ? new Date(value).toLocaleString() : "—");
