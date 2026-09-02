# 触达深圳 · TransitReach Shenzhen

一个用于探索深圳步行与地铁组合可达范围的交互式 Web Demo。

在线访问：[transitreach-sz.netlify.app](https://transitreach-sz.netlify.app/)

`main` 分支已连接 Netlify；推送更新后会自动执行 `npm run build` 并发布 `dist/`。

![TransitReach Shenzhen](https://img.shields.io/badge/City-Shenzhen-0d9488?style=flat-square)
![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square)
![Vite](https://img.shields.io/badge/Vite-5-646cff?style=flat-square)

## 当前能力

- 中文首页与深圳默认地图视图
- 搜索精选深圳地铁站，或直接点击地图设置出发点
- 比较 15、30、45、60 分钟时间预算
- 显示步行接驳与同线地铁走廊的估算可达区域
- 在界面内公开展示数据来源、参数和未建模限制

## 本地运行

```bash
npm ci
npm run dev
```

打开 `http://127.0.0.1:5173/`。生产构建：

```bash
npm run typecheck
npm run build
```

## 数据与模型说明

站点坐标是 2026-09-02 通过 Overpass 获取的 OpenStreetMap 精选深圳地铁站快照；线路名称以深圳市交通运输局与深圳地铁公开信息校对。OpenStreetMap 数据遵循 [ODbL](https://www.openstreetmap.org/copyright)，应用内保留地图署名。

本仓库是产品交互 Demo，不是导航服务。当前模型使用以下假设：

- 步行速度：4.8 km/h
- 候车：固定 4 分钟
- 地铁走廊速度：平均 34 km/h
- 首段接驳：最长 1.35 km；出站接驳：单站最多 1.2 km
- 未接入：完整 GTFS 时刻表、跨线换乘、公交、真实步行路网、道路拥堵及实时运营状态

因此，结果适合用来演示交互和讨论可达性概念，**不可用于实际出行导航或公共决策**。

## 正式化路线

生产级版本应使用完整、可验证的深圳轨道与公交数据构建 OpenTripPlanner 图，并加入 OSM 步行路网、换乘规则、服务设施数据和后端健康监控。

## 参考来源

- [深圳市交通运输局 · 地铁线路](https://jtys.sz.gov.cn/ydmh/jtcx/dtcx_180970/dtxl/content/post_12601090.html)
- [深圳地铁 · 线网图](https://www.szmc.net/map/)
- [深圳市政府数据开放平台](https://opendata.sz.gov.cn/)
- [OpenStreetMap 版权与许可](https://www.openstreetmap.org/copyright)
