# Render 接手与 v0.5.1 发布记录

## 已核实的生产来源

- 网站：https://transitreach-shenzhen-1.onrender.com/
- Render Static Site：`srv-dae3h7dbedkc73b6jpg0` / `TRANSITREACH_SHENZHEN-1`
- 仓库：`Jethro5977/TRANSITREACH_SHENZHEN`，生产分支 `main`，仓库根目录构建，发布 `dist`。
- 接手时在线提交：`2df428a`（v0.5.0）。本地从该提交创建 `codex/render-polish`。
- 本地另一个 `origin` 指向 KL 团队仓库，不是本服务的部署源；本次仅推送 `shenzhen` remote。

## 本轮修复

- `/map` 直接打开返回 HTTP 404：已在 Render 添加 `/*` → `/index.html` Rewrite，保留地址和查询参数。
- 模型说明使用原生 modal dialog，置于浏览器顶层，背景不可交互，支持 Escape 和焦点恢复。
- 搜索框支持地点结果方向键选择、Escape 关闭、键盘 Tab 进入结果，选择/清空起点时同步名称；卸载时终止地点请求。
- 拒绝越界或非法 URL 坐标，不再对任意坐标计算深圳结果。
- 移动端抽屉展开时避免截图操作、缩放按钮和说明互相遮挡；输入框可在窄屏收缩。
- 几何算法迁入 Web Worker。更换地点或清空会终止旧线程；主结果完成后再计算四档叠加，避免并行争抢 CPU。
- 原本固定 1 秒即丢弃结果的阈值放宽为 5 秒算法时间；另有 20 秒含资源加载的总截止时间。计算期间 UI 保持可操作。
- Vite 7 / React 插件 5 与兼容的 ESLint、typescript-eslint 更新；固定 Node 22，lockfile 安装与 `npm run verify`。
- 新 GitHub CI 执行 typecheck、lint、build 和高风险依赖审计；旧 Netlify hook 改为仅手动触发。
- README、社交分享图地址更新为 Render；页脚版本直接读取 package.json。

## 架构与边界

React 18 + TypeScript + Vite 静态前端；React Router 页面按需加载；Leaflet 底图；站点、线路关系、山峰和障碍物使用仓库静态快照。几何计算在浏览器 Worker 运行，地点查询在用户显式操作后请求 Nominatim。当前无持久数据库、云端路由 API 或已接入的实时公交服务。

Worker 使用原有启发式计算公式，并非真实步行路网或反向时刻表路由。原有 Demo 说明保留。首次计算需下载障碍物资源，弱网仍可能触发超时。

## 构建、发布与回滚

```sh
npm ci
npm run verify
npm audit
```

Render Build Command：`npm ci && npm run verify`；Publish Directory：`dist`；Auto-Deploy：On Commit。

`render.yaml` 记录相同配置，供 Blueprint 导入或恢复使用；仅提交此文件不会自动接管已有的 Dashboard-managed 服务。

发布前后检查：首页和地图深链接 HTTP 200；15/30/45/60 分钟范围；叠加、清除、搜索选站；弹窗 Escape、手机抽屉；控制台错误；GitHub Actions 成功；Render 最新 commit 的 Live 状态。回滚时在 Render Manual Deploy 选择上一个已核实的提交（本轮前为 `2df428a`），保留 SPA rewrite。

参考：[Render 重写规则](https://render.com/docs/redirects-rewrites)、[Blueprint 配置](https://render.com/docs/blueprint-spec)。
