type TaskLike = { id: string };
type State<T extends TaskLike> = {
  user: string;
  tasks: T[];
  queryError: string;
  loading: boolean;
};
type Action<T extends TaskLike> =
  | { type: "switchUser"; user: string }
  | { type: "loading" | "queryFailed"; user: string }
  | { type: "loaded"; user: string; tasks: T[] }
  | { type: "created"; user: string; task: T };
export function taskStateReducer<T extends TaskLike>(
  state: State<T>,
  action: Action<T>,
): State<T>;
