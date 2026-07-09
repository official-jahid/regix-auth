import assert from "node:assert/strict";
import test from "node:test";

import { getPremiumStatus } from "./premium";

test("returns active when a redeemed premium key is still valid", () => {
  const result = getPremiumStatus({
    isRedeemed: true,
    isActive: true,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    isLifetime: false,
  });

  assert.equal(result.isValid, true);
  assert.equal(result.reason, "active");
});

test("returns inactive when a premium key has expired", () => {
  const result = getPremiumStatus({
    isRedeemed: true,
    isActive: true,
    expiresAt: new Date(Date.now() - 1000),
    isLifetime: false,
  });

  assert.equal(result.isValid, false);
  assert.equal(result.reason, "expired");
});

test("returns inactive when the key has not been redeemed", () => {
  const result = getPremiumStatus({
    isRedeemed: false,
    isActive: true,
    expiresAt: null,
    isLifetime: false,
  });

  assert.equal(result.isValid, false);
  assert.equal(result.reason, "missing");
});
