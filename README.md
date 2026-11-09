# MUSE 素材制作工作室

一个可独立运行的模拟素材制作网站。选择模板、上传照片，Java 后台异步执行素材检查、模拟生成、结果整理；任务和个人历史保存在 MySQL。结果使用第一张上传图作为模拟结果，不调用真实 AI。

## 技术版本与目录

- 前端：Next.js 15.5.9 App Router、React 19.1、TypeScript 5.8、Node.js 22、pnpm（依赖锁定于 `frontend/pnpm-lock.yaml`）。
- 后端：Java 17、Spring Boot 3.3.8、MyBatis Spring Boot Starter 3.0.4、Maven 3.9。
- 数据库：MySQL 8.4；`backend/src/main/resources/schema.sql` 建表并写入模板种子数据。
- `frontend/` 页面和状态逻辑；`backend/` API、任务处理和测试；`.github/workflows/ci.yml` CI；`compose.yaml` 容器编排。

## 启动

需要 Docker Desktop（Linux 容器），在项目根目录运行：

```sh
docker compose up --build
```

首次构建需联网下载依赖和镜像。打开 http://localhost:3000。Compose 中 Next.js 将 `/api/*` 和 `/uploads/*` 代理到 Java；Java 通过容器网络连接 MySQL。数据库与上传文件分别保存在 Docker 卷中，停止容器不会删除数据。示例数据库密码只用于本地演示。`docker compose down` 停止服务；不要加 `-v`，除非确实要清空数据。修改代码后重新 `docker compose up --build`。回滚时切回之前的源码版本并重新构建；数据库结构变更需要另行设计迁移，本示例没有生产迁移策略。

非容器运行：启动 MySQL 8.4，创建 `studio` 数据库和对应用户，执行 `schema.sql`；后端设置 `DB_URL`、`DB_USER`、`DB_PASSWORD`、`UPLOAD_DIR`，运行 `mvn spring-boot:run`；前端在 `frontend` 目录执行 `corepack enable`、`pnpm install --frozen-lockfile`、`pnpm dev`。默认 Java 地址为 `localhost:8080`，也可设置前端 `BACKEND_URL`。上传目录默认为 `backend` 工作目录下的 `data/uploads`。

## 演示与配置

1. 首页筛选分类，点击模板；按要求选择一张或两张 JPG/PNG（每张不超过 5 MiB），开始制作。
2. 服务端校验图片数量、声明类型、大小和文件头，保存到服务端，再创建任务并立即返回 202 和任务信息。左侧可继续创建任务，右侧展示各任务状态和阶段；刷新页面会从服务端恢复。
3. 右上角切换“用户 A/B”观察记录隔离；这只是演示身份，通过 `X-User` 请求头区分，不是安全认证。图片 URL 是随机 UUID，但任何知道地址的人都可访问；真实产品应增加认证、授权和私有对象存储。
4. 默认每步耗时 3000 毫秒。可在项目根目录新建 `.env`（不要提交真实凭据），例如：

```env
STEP_MS=5000
FAIL_STAGE=GENERATE
```

`FAIL_STAGE` 可为 `CHECK`、`GENERATE`、`FINALIZE` 或 `NONE`。运行 `docker compose up --build` 使配置生效，重新创建任务即可复现指定阶段失败；恢复成功演示时设为 `NONE` 并重新启动。多次快速提交可观察并发和排队。查询失败时前端保留已有任务且显示重试，不将查询异常当作执行失败；自动轮询仅在存在未完成任务时运行，组件或身份切换时取消旧请求。

## API 与处理方式

- `GET /api/templates`、`GET /api/templates/{id}`：从 Java/MySQL 返回模板，含 id、title、category、description、coverUrl、requiredImageCount、maxFileSizeBytes。
- `POST /api/tasks`：`multipart/form-data`，字段 `templateId` 和重复的 `files`，请求头 `X-User`。返回任务对象及 HTTP 202。
- `GET /api/tasks`、`GET /api/tasks/{id}`：按 `X-User` 查询记录；其他用户的任务返回 404。
- 任务字段包括 `id`、`templateId`、`templateTitle`、`status`、`stage`、`error`、`resultUrl`、`createdAt`。状态为 `WAITING`、`PROCESSING`、`SUCCESS`、`FAILED`；阶段依次为 `CHECK`、`GENERATE`、`FINALIZE`。Java 固定线程池执行，阶段开始及完成/失败时更新数据库；查询只读，不推进任务。失败中止后续阶段。

## 检查

```sh
cd frontend
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
cd ../backend
mvn verify
```

GitHub Actions 在 push 和 pull request 时执行前端 lint、严格类型检查、测试、构建，以及 Java 测试和构建；另有 Compose 冒烟测试，构建并启动三个容器，验证模板查询、图片上传、任务完成和结果访问。后端测试覆盖阶段顺序、失败中断、图片格式校验和异步响应隔离；前端测试覆盖多任务状态、查询失败保留记录、切换用户时忽略过期响应，以及上传完成与服务端受理两个阶段。

## 边界与取舍

- 实现：模板分类/详情、文件校验与上传、异步阶段与失败模拟、多任务、轮询、身份切换、个人历史和刷新恢复、Compose 与 CI。
- 未实现：真实图像生成、登录鉴权、失败重试、服务重启后的任务恢复。后台进程异常退出或重启时，未结束任务可能停留在原状态；生产环境应使用持久化队列与任务恢复策略。文件存储与任务插入不是跨资源事务，极端中断可能留下孤儿文件。
- 模拟结果直接使用用户上传的第一张图片，不做图片转换；缩略图采用自制 SVG，所有模板素材在仓库本地，无外部素材或付费服务依赖。
- 当前示例适用于单机演示，线程池无持久队列、无并发配额和定期文件清理，不应直接作为生产服务。

## AI 使用与投入

本项目使用 OpenAI Codex 辅助完成。候选人提供题目及参考资料，并要求在提交前再次检查；Codex 参与了需求拆解、方案与代码生成、构建测试和修复。没有使用现成业务脚手架或第三方图片素材；依赖见锁文件和 Maven POM。

一次具体的 AI 协作与验证过程：

1. 将题目拆成模板与上传、后台阶段、前端状态与历史、工程交付四部分，按题目限定技术栈实现。
2. 让 Codex 执行 Java 和前端构建测试，再用临时 MySQL 验证上传、任务完成、结果访问和用户隔离；在 GitHub Actions 中实际构建并启动 Compose，检查完整流程。
3. 提交前复核发现：查询失败后点击重试会先清空已有任务，容易将请求异常与任务状态混淆。修复为保留已有记录，并补充多任务状态、失败重试和身份切换时旧响应隔离的测试；同时修复上传期间切换模板可能导致上传位重置的问题。
4. 记录本地测试和容器检查结果、明确模拟生成及身份方案的边界。代码和方案应结合测试与实际运行结果复核，不能仅凭 AI 的完成描述判断。

首次开发与验证约 30 分钟（2026-11-09 约 20:25–20:55），之后于约 21:16–21:25 按候选人要求进行了复核与修正，约 9 分钟（包括自动验证等待）；两次工作之间的等待时间未计入。已在本地 MySQL 8.4.13、Java 与 Next.js 环境中验证模板查询、上传、异步完成、结果访问、跨用户查询隔离及页面历史恢复；前端构建、类型检查、测试和后端构建与测试通过。GitHub Actions 已实际构建并启动 Docker Compose，验证模板查询、图片上传、异步任务成功及结果访问（最新验证代码提交 `2bc062d`；其后的提交仅更新本文档，可用 `git rev-parse HEAD` 查看最终交付提交）。
