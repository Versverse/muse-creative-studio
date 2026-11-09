export const isActive = (task) =>
  task.status === "WAITING" || task.status === "PROCESSING";
export function mergeQueryFailure(tasks) {
  return tasks;
}
export const statusLabel = (status) =>
  ({
    WAITING: "等待处理",
    PROCESSING: "制作中",
    SUCCESS: "制作完成",
    FAILED: "制作失败",
  })[status] || status;
export const stageLabel = (stage) =>
  ({
    WAITING: "排队中",
    CHECK: "检查素材",
    GENERATE: "模拟生成",
    FINALIZE: "整理结果",
  })[stage] || stage;
