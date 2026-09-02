# TransitReach 深圳 UI Enhancement Plan

核验日期：2026-09-03。筛选标准为：开源许可清晰、至少 50 Stars、近 12 个月存在可核验活动、与 React 18 / react-leaflet 4 / Tailwind 3 兼容，并以实际 bundle 约束优先。

## 已实施

| 优先级 | 方案 | 依据与兼容性 | 实际采用 |
| --- | --- | --- | --- |
| P0 | [akursat/react-leaflet-cluster](https://github.com/akursat/react-leaflet-cluster) | 131 Stars，2026-06-04 有推送，MIT；v3.1.0 的 peer deps 明确支持 React 18、react-leaflet 4、Leaflet 1.8+ | 已安装 `react-leaflet-cluster@3.1.0` + `leaflet.markercluster@1.5.3`，低缩放聚合 266 个站点；自定义 teal cluster icon。wrapper pack 4.5KB，Leaflet runtime minified 34KB，新增运行时代码远低于 50KB gzip 限制。 |
| P1 | Leaflet SVG path animation | 不引入不兼容的 polygon 动画扩展；现有 Leaflet Polygon 输出为 SVG path | 已以 `.reach-area-enter` 做 CSS stroke/fill 入场动画，遵守 reduced-motion。 |
| P2 | 现有 `useCountUp` + `useScrollReveal` | 项目已有零依赖 hooks；不需要引入 `react-countup` | Hero KPI 进入视口后数字跳动；CSS mesh gradient、简化地铁 SVG draw 与 pointer tilt 均不新增依赖。 |
| P3 | 自建移动端 bottom sheet | [Vaul](https://github.com/emilkowalski/vaul) 有 8,590 Stars、MIT、活跃，但最新包约 79KB 未压缩，超过项目轻量目标 | 复用既有 Drawer 视觉语言，把地图配置面板在 `<640px` 切换成带圆角的底部 sheet。 |
| P4 | Carto dark-matter raster tiles | 不替换 Leaflet 或 OSM 地图数据生态 | 地图面板加入浅/暗底图切换，暗色图层保留 OSM + CARTO 署名。 |

## 调研记录与未采用项

| 搜索方向 | 候选 | 结论 |
| --- | --- | --- |
| React Leaflet cluster | `react-leaflet-cluster@4` | 最新 v4 要求 React 19 / react-leaflet 5，不能用于当前 React 18 / react-leaflet 4；固定到兼容的 v3.1.0。 |
| 位置搜索 | [smeijer/leaflet-geosearch](https://github.com/smeijer/leaflet-geosearch) | 1,129 Stars、MIT、活跃，但不能绕过 Nominatim 禁止客户端 autocomplete 的政策；保留项目现有“用户主动提交、1 req/s、缓存”的实现。 |
| Leaflet sidebar | [noerw/leaflet-sidebar-v2](https://github.com/noerw/leaflet-sidebar-v2) | 133 Stars、MIT，但最后推送为 2020，不满足近 12 个月活跃条件；不引入。 |
| Tailwind animated collections | [imskyleen/animate-ui](https://github.com/imskyleen/animate-ui) | 4,247 Stars，但依赖 Motion/Framer Motion，违反项目轻量约束；只参考“组件级、可复制”的组织方式，不复制代码。 |
| 交通可达性参考 | [filippofinke/swissreach](https://github.com/filippofinke/swissreach) | 用 Web Worker、可达站点结果与分层渲染作为生产路线参考；其 MapLibre/React 19 架构不直接迁入当前 Leaflet Demo。 |

## 设计取舍

- 多边形不使用“真实道路 isochrone”库：UI 动画不会改善数据精度，真实道路边界仍须接入 OSM 步行图和 OTP/Valhalla 后端。
- 结果继续展示面积、离散区域数与可达站点；这是对单一面积指标的补充，而不是伪造通勤结论。
- 所有新增 motion 都在 `prefers-reduced-motion: reduce` 下停用。
- 地点搜索、公交、时刻表与实时数据的现有 Demo 限制维持不变。
