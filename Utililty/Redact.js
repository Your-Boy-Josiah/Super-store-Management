const sensitive = /password|pin|code|token|secret/i;
exports.redact = function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      sensitive.test(key) ? "[REDACTED]" : redact(item),
    ]),
  );
};
