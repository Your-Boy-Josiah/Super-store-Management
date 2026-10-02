const { test } = require("node:test");
const assert = require("node:assert/strict");
const { calculateShiftedExpiry } = require("../Utililty/Time_Shift");
const { redact } = require("../Utililty/Redact");
test("working-time expiry skips nights and weekends", () => {
  const friday = new Date(2026, 9, 2, 16, 0, 0),
    result = calculateShiftedExpiry(friday, 7200);
  assert.equal(result.getDay(), 1);
  assert.equal(result.getHours(), 10);
});
test("audit payloads recursively redact credentials", () => {
  assert.deepEqual(
    redact({
      password: "secret",
      nested: { code: "123456" },
      list: [{ token: "secret" }],
      name: "Sam",
    }),
    {
      password: "[REDACTED]",
      nested: { code: "[REDACTED]" },
      list: [{ token: "[REDACTED]" }],
      name: "Sam",
    },
  );
});
