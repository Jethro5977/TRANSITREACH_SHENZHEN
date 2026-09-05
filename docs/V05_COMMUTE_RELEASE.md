# v0.5 通勤选区

2026-09-05：面向输入工作地点、探索 15–60 分钟通勤范围的纯前端版本。

## 使用方式

- 首页选择工作地点后进入「到达这里」，也可切换「从这里出发」。反向模式沿用现有前向估算，仅作为居住选区参考；接驳距离限制、地形衰减和真实运营差异意味着不能视为精确反向路由。
- 分享链接保存站点/坐标、地点名称、预算、方向、出发时段、叠加开关。定位结果只有点击分享时才需要分享给他人；地址栏也会包含当前坐标。
- 开启叠加会计算 60、45、30、15 分钟四层，最大预算在最底层。地点或时段改变后旧图层立即失效，全部新图层完成后同时显示。失败时保留单预算结果并提示重试。
- PNG 导出包含当前地图、区域、站点、结果卡片和底图署名；外部瓦片需要加载完成且允许跨域读取。导出库按需加载。
- 小于 640px 时配置面板折叠为搜索与预算，点击或拖动手柄展开；点选地图后收起。

## GitHub 候选评估

GitHub API 于 2026-09-05 核验；更新时间使用 `pushed_at`，并不保证代码维护质量。安装门槛为 ≥100 stars 且 2026-03-05 后更新。

| 仓库 | Stars | 最近推送 | 决定 |
|---|---:|---|---|
| [emilkowalski/vaul](https://github.com/emilkowalski/vaul) | 8594 | 2025-10-03 | 不满足近期更新门槛；用现有 React 实现可拖动面板，新增依赖 0 KB |
| [bubkoo/html-to-image](https://github.com/bubkoo/html-to-image) | 7228 | 2026-05-28 | 集成；框架无关 DOM/SVG 导出，兼容 React 18 与 Leaflet SVG |
| [niklasvh/html2canvas](https://github.com/niklasvh/html2canvas) | 31918 | 2024-07-18 | 不满足近期更新门槛 |
| [conveyal/analysis-ui](https://github.com/conveyal/analysis-ui) | 7 | 2022-01-13 | 不满足门槛，不集成 |
| [mapnificent/mapnificent](https://github.com/mapnificent/mapnificent) | 407 | 2024-04-19 | 不满足近期更新门槛，不集成 |
| [traveltime-dev/traveltime-python-sdk](https://github.com/traveltime-dev/traveltime-python-sdk) | 25 | 2026-09-01 | 不满足 star 门槛，且 Python SDK 不适合纯前端 |
| [domoritz/leaflet-locatecontrol](https://github.com/domoritz/leaflet-locatecontrol) | 873 | 2026-08-12 | 满足门槛；已有定位功能，无需重复安装 |
| [leaflet-extras/leaflet-providers](https://github.com/leaflet-extras/leaflet-providers) | 2378 | 2026-09-03 | 满足门槛；现有 OSM/CARTO 主题足够，无需安装 |

唯一新增生产依赖 html-to-image，esbuild 压缩后 gzip 实测 5372 bytes（约 5.25 KiB），低于总计 30 KB 限制。保留已有 React-Leaflet ZoomControl / ScaleControl。

## 验证

`npm run typecheck && npm run lint && npm run build`。

`node scripts/verify-v05.mjs` 使用可用的 Playwright + Chrome 测试完整参数还原、分享剪贴板、四层叠加、PNG 下载、清除与换站隔离、375px 抽屉。Playwright 为验证工具，不新增到生产依赖；可通过 NODE_PATH 指定现有工具环境。截图保存于 `/tmp/transitreach-v05/`。

删除三个无引用 mock 文件及相关导出；Git 历史可恢复。
