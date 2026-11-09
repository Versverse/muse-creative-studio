"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  isActive,
  mergeQueryFailure,
  stageLabel,
  statusLabel,
} from "../lib/status.mjs";
type Template = {
  id: string;
  title: string;
  category: string;
  description: string;
  coverUrl: string;
  requiredImageCount: number;
  maxFileSizeBytes: number;
};
type Task = {
  id: string;
  templateId: string;
  templateTitle: string;
  status: string;
  stage: string;
  error: string | null;
  resultUrl: string | null;
  createdAt: string;
};
const getError = async (r: Response) => {
  try {
    const x = await r.json();
    return x.message || `请求失败 (${r.status})`;
  } catch {
    return `请求失败 (${r.status})`;
  }
};
export default function Home() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selected, setSelected] = useState<Template | null>(null);
  const [category, setCategory] = useState("全部");
  const [user, setUser] = useState("demo-a");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [queryError, setQueryError] = useState("");
  const [files, setFiles] = useState<(File | null)[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const activeRef = useRef(false);
  const userRef = useRef(user);
  useEffect(() => {
    fetch("/api/templates")
      .then(async (r) => {
        if (!r.ok) throw Error(await getError(r));
        return r.json();
      })
      .then(setTemplates)
      .catch(() => setListError("模板加载失败，请检查服务后重试。 "))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    const urls = files.map((f) => (f ? URL.createObjectURL(f) : ""));
    setPreviews(urls);
    return () => urls.forEach((u) => u && URL.revokeObjectURL(u));
  }, [files]);
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();
    setTasks([]);
    setQueryError("");
    activeRef.current = false;
    async function query() {
      try {
        const r = await fetch("/api/tasks", {
          headers: { "X-User": user },
          signal: controller.signal,
          cache: "no-store",
        });
        if (!r.ok) throw Error(await getError(r));
        const data: Task[] = await r.json();
        if (cancelled) return;
        setTasks(data);
        setQueryError("");
        activeRef.current = data.some(isActive);
        if (activeRef.current) timer = setTimeout(query, 2000);
      } catch {
        if (cancelled) return;
        setTasks((old) => mergeQueryFailure(old));
        setQueryError("暂时无法查询任务，已保留当前记录。");
      }
    }
    query();
    return () => {
      cancelled = true;
      controller.abort();
      if (timer) clearTimeout(timer);
    };
  }, [user, refreshKey]);
  const choose = useCallback((t: Template) => {
    setSelected(t);
    setFiles(Array(t.requiredImageCount).fill(null));
    setError("");
    setShowHistory(false);
  }, []);
  function changeFile(index: number, file: File | null) {
    if (
      file &&
      (!["image/jpeg", "image/png"].includes(file.type) ||
        file.size > 5 * 1024 * 1024 ||
        file.size === 0)
    ) {
      setError("请选择 5MB 以内的 JPG 或 PNG 图片。");
      return;
    }
    setError("");
    setFiles((old) => old.map((f, i) => (i === index ? file : f)));
  }
  async function submit() {
    if (!selected || files.some((f) => !f) || submitting) return;
    const requestUser = user;
    setSubmitting(true);
    setError("");
    try {
      const body = new FormData();
      body.append("templateId", selected.id);
      files.forEach((f) => {
        if (f) body.append("files", f);
      });
      const r = await fetch("/api/tasks", {
        method: "POST",
        headers: { "X-User": user },
        body,
      });
      if (!r.ok) throw Error(await getError(r));
      const created: Task = await r.json();
      if (userRef.current !== requestUser) return;
      setTasks((old) => [created, ...old]);
      setFiles(Array(selected.requiredImageCount).fill(null));
      setRefreshKey((k) => k + 1);
    } catch (e) {
      if (userRef.current === requestUser)
        setError(e instanceof Error ? e.message : "提交失败，请重试");
    } finally {
      setSubmitting(false);
    }
  }
  const categories = [
    "全部",
    ...Array.from(new Set(templates.map((t) => t.category))),
  ];
  return (
    <>
      <header>
        <button
          className="brand"
          onClick={() => {
            setSelected(null);
            setShowHistory(false);
          }}
          aria-label="返回首页"
        >
          <span className="mark">✳</span>
          <span>
            MUSE <small>CREATIVE STUDIO</small>
          </span>
        </button>
        <nav>
          <button
            className={!selected && !showHistory ? "navActive" : ""}
            onClick={() => {
              setSelected(null);
              setShowHistory(false);
            }}
          >
            发现模板
          </button>
          <button
            className={showHistory ? "navActive" : ""}
            onClick={() => {
              setSelected(null);
              setShowHistory(true);
            }}
          >
            我的作品
          </button>
        </nav>
        <div className="account">
          <span className="online" /> <label htmlFor="user">体验身份</label>
          <select
            id="user"
            value={user}
            onChange={(e) => {
              userRef.current = e.target.value;
              setUser(e.target.value);
            }}
          >
            <option value="demo-a">用户 A</option>
            <option value="demo-b">用户 B</option>
          </select>
          <span className="avatar">{user.endsWith("a") ? "A" : "B"}</span>
        </div>
      </header>
      <main>
        {!selected && !showHistory ? (
          <>
            <section className="hero">
              <div>
                <p className="eyebrow">
                  <span>✦</span> MAKE SOMETHING BEAUTIFUL
                </p>
                <h1>
                  让每一个灵感，
                  <br />
                  <em>都有画面。</em>
                </h1>
                <p>
                  选一个喜欢的模板，上传你的照片。
                  <br />
                  剩下的，交给一点想象力。
                </p>
                <a href="#explore" className="heroLink">
                  探索灵感 <span>↘</span>
                </a>
              </div>
              <div className="heroArt">
                <div className="orb orb1" />
                <div className="orb orb2" />
                <span className="sparkle">✳</span>
                <span className="artText">
                  A LITTLE
                  <br />
                  MOMENT
                  <br />
                  <i>of magic.</i>
                </span>
                <span className="artLabel">YOUR CREATIVE SPACE / 01</span>
              </div>
            </section>
            <section className="explore" id="explore">
              <div className="sectionHead">
                <div>
                  <p className="eyebrow">THE COLLECTION</p>
                  <h2>
                    发现你的下一份灵感<span className="dot">.</span>
                  </h2>
                </div>
                <span className="muted">为日常，创造一点不同</span>
              </div>
              <div className="filters">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={c === category ? "selectedFilter" : ""}
                  >
                    {c}
                  </button>
                ))}
              </div>
              {loading ? (
                <p className="notice">正在加载模板…</p>
              ) : listError ? (
                <p className="notice">
                  {listError}
                  <button onClick={() => location.reload()}>重新加载</button>
                </p>
              ) : (
                <div className="grid">
                  {templates
                    .filter(
                      (t) => category === "全部" || t.category === category,
                    )
                    .map((t, i) => (
                      <button
                        className="card"
                        key={t.id}
                        onClick={() => choose(t)}
                      >
                        <div className="cover">
                          <img src={t.coverUrl} alt="" />
                          <span className="cardIndex">0{i + 1} / MUSE</span>
                          <span className="cardArrow">↗</span>
                        </div>
                        <div className="cardInfo">
                          <div>
                            <span>{t.category}</span>
                            <h3>{t.title}</h3>
                          </div>
                          <span className="count">
                            {t.requiredImageCount} 张图片
                          </span>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </section>
          </>
        ) : (
          <>
            <div className="backRow">
              <button
                onClick={() => {
                  setSelected(null);
                  setShowHistory(false);
                }}
              >
                ← 返回灵感广场
              </button>
              <span>YOUR CREATIVE SPACE</span>
            </div>
            <div className={selected ? "workspace" : "historyOnly"}>
              {selected && (
                <section className="editor">
                  <div className="editorTop">
                    <p className="eyebrow">CREATE WITH MUSE</p>
                    <h1>
                      {selected.title}
                      <span className="dot">.</span>
                    </h1>
                    <p>{selected.description}</p>
                  </div>
                  <div className="editorCover">
                    <img
                      src={selected.coverUrl}
                      alt={`${selected.title}模板示例`}
                    />
                    <span>模板预览</span>
                  </div>
                  <div className="uploadHead">
                    <div>
                      <h2>添加你的照片</h2>
                      <p>
                        需要 {selected.requiredImageCount} 张 · JPG / PNG ·
                        单张不超过 5MB
                      </p>
                    </div>
                    <b>
                      {files.filter(Boolean).length} /{" "}
                      {selected.requiredImageCount}
                    </b>
                  </div>
                  <div className="uploads">
                    {files.map((f, i) => (
                      <div className="upload" key={i}>
                        {f ? (
                          <>
                            <img
                              src={previews[i]}
                              alt={`已选择的图片 ${i + 1}`}
                            />
                            <div className="uploadActions">
                              <label>
                                替换
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png"
                                  onChange={(e) => {
                                    changeFile(i, e.target.files?.[0] || null);
                                    e.target.value = "";
                                  }}
                                />
                              </label>
                              <button onClick={() => changeFile(i, null)}>
                                移除
                              </button>
                            </div>
                          </>
                        ) : (
                          <label className="drop">
                            <span>＋</span>
                            <strong>点击选择照片 {i + 1}</strong>
                            <small>JPG 或 PNG</small>
                            <input
                              type="file"
                              accept="image/jpeg,image/png"
                              onChange={(e) => {
                                changeFile(i, e.target.files?.[0] || null);
                                e.target.value = "";
                              }}
                            />
                          </label>
                        )}
                      </div>
                    ))}
                  </div>
                  {error && (
                    <p className="error" role="alert">
                      {error}
                    </p>
                  )}
                  <button
                    className="primary"
                    disabled={submitting || files.some((f) => !f)}
                    onClick={submit}
                  >
                    {submitting ? "上传并提交中…" : "开始制作 →"}
                  </button>
                  <p className="fine">模拟制作不会调用真实 AI 服务</p>
                </section>
              )}
              <section className="history">
                <div className="historyHead">
                  <div>
                    <p className="eyebrow">YOUR CREATIONS</p>
                    <h2>
                      制作记录<span className="dot">.</span>
                    </h2>
                    <p>你的灵感，都在这里。</p>
                  </div>
                  <button
                    className="refresh"
                    onClick={() => setRefreshKey((k) => k + 1)}
                    aria-label="刷新任务记录"
                  >
                    ↻
                  </button>
                </div>
                {queryError && (
                  <div className="queryError" role="alert">
                    {queryError}{" "}
                    <button onClick={() => setRefreshKey((k) => k + 1)}>
                      重试
                    </button>
                  </div>
                )}
                {tasks.length === 0 ? (
                  <div className="empty">
                    <span>✳</span>
                    <h3>这里还没有作品</h3>
                    <p>选择喜欢的模板，开始你的第一次创作。</p>
                  </div>
                ) : (
                  <div className="taskGrid">
                    {tasks.map((t) => (
                      <article className="task" key={t.id}>
                        <div className="taskVisual">
                          {t.status === "SUCCESS" && t.resultUrl ? (
                            <img
                              src={t.resultUrl}
                              alt={`${t.templateTitle}制作结果`}
                            />
                          ) : (
                            <div
                              className={
                                t.status === "FAILED"
                                  ? "taskSymbol failed"
                                  : "taskSymbol"
                              }
                            >
                              {t.status === "FAILED" ? "!" : "✳"}
                            </div>
                          )}
                          <span className={`badge ${t.status.toLowerCase()}`}>
                            {statusLabel(t.status)}
                          </span>
                        </div>
                        <div className="taskBody">
                          <h3>{t.templateTitle}</h3>
                          <p>
                            {t.status === "FAILED"
                              ? t.error
                              : t.status === "SUCCESS"
                                ? "已生成预览图片"
                                : stageLabel(t.stage)}
                          </p>
                          <time>
                            {t.createdAt?.replace("T", " ").slice(0, 19)}
                          </time>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </main>
      <footer>
        <span>✳ MUSE STUDIO</span>
        <span>MADE FOR LITTLE MOMENTS ✦</span>
      </footer>
    </>
  );
}
