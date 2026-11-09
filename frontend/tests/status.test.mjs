import test from "node:test";
import assert from "node:assert/strict";
import { isActive } from "../lib/status.mjs";
import { taskStateReducer as reduce } from "../lib/task-state.mjs";

test("only unfinished tasks need polling", () => {
  assert.deepEqual(
    ["WAITING", "PROCESSING", "SUCCESS", "FAILED"].map((status) =>
      isActive({ status }),
    ),
    [true, true, false, false],
  );
});

test("refresh and failed query retain all tasks and their independent statuses", () => {
  const tasks = [
    { id: "a", status: "PROCESSING", stage: "GENERATE" },
    { id: "b", status: "SUCCESS" },
    { id: "c", status: "FAILED", error: "模拟失败" },
  ];
  let state = { user: "demo-a", tasks, queryError: "", loading: false };
  state = reduce(state, { type: "loading", user: "demo-a" });
  assert.deepEqual(state.tasks, tasks);
  state = reduce(state, { type: "queryFailed", user: "demo-a" });
  assert.deepEqual(state.tasks, tasks);
  assert.match(state.queryError, /无法查询/);
  const updated = [{ ...tasks[0], status: "SUCCESS" }, tasks[1], tasks[2]];
  state = reduce(state, { type: "loaded", user: "demo-a", tasks: updated });
  assert.deepEqual(state.tasks, updated);
  assert.equal(state.queryError, "");
});

test("switching users discards stale responses and accepts the new user's tasks", () => {
  let state = {
    user: "demo-a",
    tasks: [{ id: "a", status: "PROCESSING" }],
    queryError: "",
    loading: false,
  };
  state = reduce(state, { type: "switchUser", user: "demo-b" });
  state = reduce(state, {
    type: "loaded",
    user: "demo-a",
    tasks: [{ id: "old", status: "SUCCESS" }],
  });
  state = reduce(state, {
    type: "created",
    user: "demo-a",
    task: { id: "late", status: "WAITING" },
  });
  assert.deepEqual(state.tasks, []);
  state = reduce(state, {
    type: "loaded",
    user: "demo-b",
    tasks: [{ id: "b", status: "WAITING" }],
  });
  assert.deepEqual(
    state.tasks.map((t) => t.id),
    ["b"],
  );
});
