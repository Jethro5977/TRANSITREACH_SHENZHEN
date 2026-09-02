# 深圳交通数据与开源路由选型

更新日期：2026-09-03

## 结论

当前仓库继续使用可再分发的 OpenStreetMap/Overpass 轨道站点快照，并已把圆形覆盖改为合并后的不规则步行包络；最新版本还使用 OSM 水域、河渠及高速公路缓冲区裁剪明显不可步行的区域。生产级下一步应部署 **OpenTripPlanner 2**，输入经过授权获取并转换的深圳公交/地铁 GTFS 与 OSM 步行路网；若取得运营方 GTFS-Realtime，再接入车辆位置、班次更新和服务告警。

深圳市政府数据开放平台已公开列出以下相关资源：

- 深圳公交站点表
- 深圳公交线路表
- 深圳公交路线站点关系表
- 深圳公交线路轨迹
- 深圳地铁站点信息
- 地铁站点出入口及换乘信息
- 地铁运营时刻表

平台服务条款允许注册用户免费、非排他地使用数据，要求在成果中注明“深圳市政府数据开放平台”，同时禁止把取得的原始数据资源有偿或无偿转让。因此，本公开 GitHub 仓库不提交这些原始文件；应通过获授权账户下载，在私有构建步骤中转换为 GTFS/OTP 图，只发布计算服务和必要的派生结果。

截至本次核验，没有发现可确认授权、稳定并能公开使用的深圳 GTFS-Realtime feed。历史论文中的车辆 GPS 数据不能视为今天可用的实时接口。

## GitHub 仓库筛选

| 仓库 | 许可证 | 匹配度 | 处理决定 |
| --- | --- | --- | --- |
| [OpenTripPlanner/OpenTripPlanner](https://github.com/opentripplanner/OpenTripPlanner) | LGPL-3.0 | GTFS + OSM 多模式、时刻表、实时更新 | **生产后端首选** |
| [valhalla/valhalla](https://github.com/valhalla/valhalla) | MIT | OSM 道路路由与不规则 isochrone；也可加载用户 GTFS | 步行路网/独立服务备选；公共 demo 只用于测试，不作为生产依赖 |
| [daudee215/transit-isochrone](https://github.com/daudee215/transit-isochrone) | MIT | RAPTOR + GTFS + alpha-shape | 可参考轻量算法；其步行仍是欧氏距离，不足以作为真实道路结果 |
| [egli/transit-reach](https://github.com/egli/transit-reach) | Apache-2.0 / MIT | Rust RAPTOR、GTFS 时窗计算 | 可参考时刻表搜索；默认输出可达站点而非完整街区 polygon |
| [mfogel/polygon-clipping](https://github.com/mfogel/polygon-clipping) | MIT | Polygon/MultiPolygon 布尔运算 | **已复用**，负责合并重叠包络并保留分离区域与空洞 |
| [zhandongxu/Shenzhen-Transit-network](https://github.com/zhandongxu/Shenzhen-Transit-network) | 未声明 | 含深圳公交网络与频率字段 | **不复用、不二次分发**，除非作者补充明确许可 |

## 推荐部署结构

```text
深圳政府开放平台授权导出 ─┐
                            ├─ GTFS 转换/校验 ─ OTP 2 图 ─ HTTPS API
OpenStreetMap Shenzhen PBF ─┘                         │
                                                     ├─ isochrone GeoJSON
运营方 GTFS-Realtime（取得后） ───────────────────────┘
                                                     │
TransitReach React/Leaflet ──────────────────────────┘
```

## 当前前端边界

当前不规则边界仍是透明标注的本地启发式包络：它合并重叠站点区域、加入方向性变化，并裁掉 OSM 水域/河渠/高速公路缓冲区，避免用大量完美圆形表达不存在的精度。它不等于道路级 isochrone；道路真实边界必须由 OTP 或 Valhalla 基于 OSM pedestrian graph 生成。

## 数据来源

- [深圳市政府数据开放平台](https://opendata.sz.gov.cn/)
- [深圳市政府数据开放平台服务条款](https://opendata.sz.gov.cn/maintenance/forward/toTermOfService)
- [OpenStreetMap 版权与许可](https://www.openstreetmap.org/copyright)
- [GTFS Schedule](https://gtfs.org/documentation/schedule/reference/)
- [GTFS Realtime](https://gtfs.org/documentation/realtime/reference/)
