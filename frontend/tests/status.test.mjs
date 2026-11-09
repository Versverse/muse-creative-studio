import test from "node:test";
import assert from "node:assert/strict";
import { isActive, mergeQueryFailure } from "../lib/status.mjs";
test("only unfinished tasks trigger polling", () => {
  assert.equal(isActive({ status: "WAITING" }), true);
  assert.equal(isActive({ status: "PROCESSING" }), true);
  assert.equal(isActive({ status: "SUCCESS" }), false);
  assert.equal(isActive({ status: "FAILED" }), false);
});
test("query errors preserve each task and do not mark it failed", () => {
  const items = [
    { id: "1", status: "PROCESSING" },
    { id: "2", status: "SUCCESS" },
  ];
  assert.deepEqual(mergeQueryFailure(items), items);
});
