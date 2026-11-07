import { test } from "node:test";
import assert from "node:assert/strict";
import { isUuid } from "./ids.ts";

test("isUuid accepts UUIDs and rejects anything a URL could carry instead", () => {
  assert.equal(isUuid("fb5c709b-9e61-4e24-8416-c2b57cd875a3"), true);
  assert.equal(isUuid("FB5C709B-9E61-4E24-8416-C2B57CD875A3"), true);
  assert.equal(isUuid("abc"), false);
  assert.equal(isUuid("fb5c709b-9e61-4e24-8416-c2b57cd875a3' or 1=1"), false);
  assert.equal(isUuid(""), false);
  assert.equal(isUuid(undefined), false);
});
