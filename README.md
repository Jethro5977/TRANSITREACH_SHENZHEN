# 触达深圳 · TransitReach Shenzhen

一个用于探索深圳步行与地铁组合可达范围的公开测试版 Web 工具。

在线访问：[transitreach-sz.netlify.app](https://transitreach-sz.netlify.app/)

`main` 分支已连接 Netlify；推送更新后会自动执行 `npm run build` 并发布 `dist/`。

![TransitReach Shenzhen](https://img.shields.io/badge/City-Shenzhen-0d9488?style=flat-square)
![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square)
![Vite](https://img.shields.io/badge/Vite-5-646cff?style=flat-square)

## 当前能力

- 中文首页与深圳默认地图视图
- 搜索 266 个去重地铁站静态快照，或直接点击地图设置出发点
- 比较 15、30、45、60 分钟时间预算
- 显示步行接驳、直达地铁与最多一次换乘的估算可达区域
- 将重叠站点包络做 polygon union，显示不规则 Polygon/MultiPolygon，而不是一组圆圈
- 在界面内公开展示数据来源、参数和未建模限制
- 支持 `/map`、`/methodology` 直达链接、中文 404 与 PWA 安装元数据
- 地图页按需加载；站点按线路颜色显示，并在低缩放级别自动缩小以减少重叠
- 地图瓦片加载 skeleton、计算状态与模型边界说明

## 性能基线

2026-09-03 在本地开发环境以福田站实测：30 分钟预算生成 34 个融合区域约 `27–59ms`，60 分钟预算生成 24 个融合区域约 `53ms`。新版使用 24 向不规则步行包络并执行 polygon union，仍明显低于 500ms 交互目标。结果会随浏览器与设备性能变化，不代表出行时间精度。

## 本地运行

```bash
npm ci
npm run dev
```

打开 `http://127.0.0.1:5173/`。生产构建：

```bash
npm run typecheck
npm run lint
npm run build
```

## 数据与模型说明

站点坐标与线路关系是 2026-09-02 通过 Overpass 获取的 OpenStreetMap 深圳地铁静态快照；脚本将双向 route relation 合并为 266 个去重站点。线路名称以深圳市交通运输局与深圳地铁公开信息校对。OpenStreetMap 数据遵循 [ODbL](https://www.openstreetmap.org/copyright)，应用内保留地图署名。

如需刷新静态数据（仅构建时联网，网站运行时不请求 Overpass）：

```bash
npm run data:metro
```

本仓库是产品交互 Demo，不是导航服务。当前不规则边界会把重叠站点包络合并、保留分离区域和内部空洞；它用于消除完美圆形造成的虚假精度，但在 OSM pedestrian graph 接入前仍不是道路级 isochrone。当前模型使用以下假设：

- 步行速度：4.8 km/h
- 候车：固定 4 分钟
- 地铁走廊速度：平均 34 km/h
- 换乘：最多一次，每次固定 4 分钟
- 首段接驳：最长 1.35 km；出站接驳：单站最多 1.2 km
- 未接入当前计算：完整 GTFS 时刻表、真实站内换乘时间、公交、真实步行路网、道路拥堵及实时运营状态

因此，结果适合用来演示交互和讨论可达性概念，**不可用于实际出行导航或公共决策**。

## 正式化路线

生产级版本应使用完整、可验证的深圳轨道与公交数据构建 OpenTripPlanner 图，并加入 OSM 步行路网、换乘规则、服务设施数据和后端健康监控。已核验的数据目录、许可限制和 GitHub 开源选型见 [深圳交通数据与开源路由选型](docs/DATA_AND_OPEN_SOURCE_PLAN.md)。

深圳市政府数据开放平台列有公交站点、公交线路、站点关系、线路轨迹、地铁站点、换乘信息和地铁运营时刻表。平台要求注册、成果署名，并禁止把取得的原始数据资源转让给其他主体，因此本公开仓库不会直接提交这些原始文件。尚未发现本项目可以确认授权且稳定公开的深圳 GTFS-Realtime feed；不会把历史 GPS 数据或逆向接口包装成实时数据。

## 参考来源

- [深圳市交通运输局 · 地铁线路](https://jtys.sz.gov.cn/ydmh/jtcx/dtcx_180970/dtxl/content/post_12601090.html)
- [深圳地铁 · 线网图](https://www.szmc.net/map/)
- [深圳市政府数据开放平台](https://opendata.sz.gov.cn/)
- [深圳市政府数据开放平台服务条款](https://opendata.sz.gov.cn/maintenance/forward/toTermOfService)
- [OpenStreetMap 版权与许可](https://www.openstreetmap.org/copyright)
- [OpenTripPlanner](https://github.com/opentripplanner/OpenTripPlanner)
- [Valhalla](https://github.com/valhalla/valhalla)
