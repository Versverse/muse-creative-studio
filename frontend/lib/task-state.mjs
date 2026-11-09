// Keep request errors separate from the status of tasks on the server.
export function taskStateReducer(state, action) {
  if (action.type === "switchUser") {
    return { user: action.user, tasks: [], queryError: "", loading: true };
  }
  // Responses from an old identity must never update the current view.
  if (action.user !== state.user) return state;
  switch (action.type) {
    case "loading":
      return { ...state, loading: true, queryError: "" };
    case "loaded":
      return { ...state, loading: false, queryError: "", tasks: action.tasks };
    case "queryFailed":
      return {
        ...state,
        loading: false,
        queryError: "暂时无法查询任务，已保留当前记录。",
      };
    case "created":
      return {
        ...state,
        tasks: [
          action.task,
          ...state.tasks.filter((t) => t.id !== action.task.id),
        ],
      };
    default:
      return state;
  }
}
