import test from "node:test";
import assert from "node:assert/strict";
import { uploadTask } from "../lib/upload-task.mjs";

class FakeXHR {
  static last;
  upload = {};
  constructor() {
    FakeXHR.last = this;
  }
  open(method, url) {
    this.method = method;
    this.url = url;
  }
  setRequestHeader(key, value) {
    this.header = [key, value];
  }
  send(body) {
    this.body = body;
  }
}
test("upload completion is distinct from task acceptance", async () => {
  let uploaded = false;
  const body = {};
  const result = uploadTask(
    body,
    "demo-a",
    () => {
      uploaded = true;
    },
    FakeXHR,
  );
  const xhr = FakeXHR.last;
  assert.deepEqual(xhr.header, ["X-User", "demo-a"]);
  assert.equal(uploaded, false);
  xhr.upload.onload();
  assert.equal(uploaded, true);
  xhr.status = 202;
  xhr.responseText = '{"id":"t1","status":"WAITING"}';
  xhr.onload();
  assert.equal((await result).id, "t1");
});
test("request failures reject without manufacturing a failed task", async () => {
  const result = uploadTask({}, "demo-a", () => {}, FakeXHR);
  const xhr = FakeXHR.last;
  xhr.status = 400;
  xhr.responseText = '{"message":"图片格式无效"}';
  xhr.onload();
  await assert.rejects(result, /图片格式无效/);
});
