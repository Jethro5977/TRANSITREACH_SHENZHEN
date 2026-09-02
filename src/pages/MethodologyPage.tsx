import { AlertTriangle, BusFront, Clock3, Database, ExternalLink, Footprints, MapPinned, Radio, TrainFront } from 'lucide-react';
import { SHENZHEN_TRANSIT_DATA_SOURCES, type TransitSourceStatus } from '@/shared/data/shenzhen/sources';

const STEPS = [
  { icon: MapPinned, title: '1. 选择深圳起点', text: '优先从静态地铁站快照中搜索；无站名匹配时可手动查询 OSM 地点，或点击地图任意深圳市域坐标。' },
  { icon: Footprints, title: '2. 估算首段步行', text: '以 4.8 km/h、最长 1.35 km 的直线接驳寻找附近站点，并生成带方向变化的步行包络。' },
  { icon: TrainFront, title: '3. 沿地铁走廊扩展', text: '按平均 34 km/h 估算车内时间，另计 4 分钟候车，并允许一次固定 4 分钟的换乘。' },
  { icon: Clock3, title: '4. 裁剪与合并区域', text: '将剩余时间转换为单站最多 1.2 km 的方向性包络，避开 OSM 水域和高速缓冲区后再合并；保留不连续区域和内部空洞。' },
];

export function MethodologyPage() {
  return (
    <main className="min-h-screen pt-16">
      <div className="max-w-[1050px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10 fade-slide-up">
          <span className="text-xs font-bold text-teal-700 tracking-[0.18em]">METHODOLOGY</span>
          <h1 className="text-4xl font-extrabold text-slate-900 mt-3 mb-4">深圳版如何生成可达范围</h1>
          <p className="text-lg text-slate-600 max-w-3xl leading-relaxed">
            当前是前端交互 Demo，用轻量启发式模型替代尚未部署的深圳 OTP 路由图。新版边界会合并为不规则区域，但只有接入真实 OSM 步行图后才能称为道路级 isochrone。
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {STEPS.map(({ icon: Icon, title, text }) => (
            <article key={title} className="glass p-6 card-hover">
              <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-4"><Icon size={21} /></div>
              <h2 className="font-bold text-slate-900 mb-2">{title}</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{text}</p>
            </article>
          ))}
        </div>

        <section className="mt-8 glass p-6">
          <div className="flex items-center gap-2 mb-4">
            <Database size={19} className="text-blue-600" />
            <h2 className="font-bold text-slate-900">本地 Demo 使用的数据</h2>
          </div>
          <ul className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <li><strong className="text-slate-800">底图与站点坐标：</strong>OpenStreetMap / Overpass，2026-09-02 获取并去重的 266 站静态快照，遵循 ODbL 并在地图持续署名。</li>
            <li><strong className="text-slate-800">线路名称：</strong>以深圳市交通运输局与深圳地铁公开线路信息校对。</li>
            <li><strong className="text-slate-800">边界几何：</strong>重叠站点包络使用 polygon union 合并，并以 OSM 水域、河渠及高速公路缓冲区裁剪，输出不规则 Polygon/MultiPolygon。</li>
            <li><strong className="text-slate-800">模型参数：</strong>步行 4.8 km/h、地铁平均 34 km/h、候车 4 分钟、一次换乘 4 分钟，均为交互原型假设，不是运营方发布指标。</li>
          </ul>
        </section>

        <section className="mt-6 glass p-6">
          <div className="flex items-center gap-2 mb-2">
            <BusFront size={19} className="text-teal-700" />
            <h2 className="font-bold text-slate-900">深圳公交、时刻表与实时数据接入状态</h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed mb-5">
            这里区分“已经参与计算”和“已确认来源但尚未获授权导入”，避免把可下载目录或历史研究数据误写成实时服务。
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            {SHENZHEN_TRANSIT_DATA_SOURCES.map(source => (
              <article key={source.id} className="rounded-2xl border border-slate-200/80 bg-white/65 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                    {source.status === 'not-public' ? <Radio size={17} /> : <Database size={17} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-bold text-sm text-slate-900">{source.title}</h3>
                      <SourceStatus status={source.status} label={source.statusLabel} />
                    </div>
                    <p className="text-xs font-semibold text-slate-500">{source.provider}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mt-3">{source.coverage}</p>
                <p className="text-xs text-slate-500 leading-relaxed mt-2">{source.note}</p>
                <a href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 mt-3 hover:text-teal-900">
                  查看来源 <ExternalLink size={12} />
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/80 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle size={21} className="text-amber-700 mt-0.5 shrink-0" />
            <div>
              <h2 className="font-bold text-amber-950 mb-2">模型边界与后续数据工作</h2>
              <p className="text-sm text-amber-900/80 leading-relaxed">
                已确认深圳政府开放平台存在公交网络、地铁运营时刻表和换乘数据目录；因平台注册与禁止转让原始数据的条款，本公开仓库暂不复制这些文件。生产版仍需通过授权导出构建 GTFS/OTP 图，并取得运营方实时 feed。当前公开版本不可用于导航或公共决策。
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function SourceStatus({ status, label }: { status: TransitSourceStatus; label: string }) {
  const className = status === 'active'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : status === 'integration-ready'
      ? 'bg-blue-50 text-blue-700 border-blue-200'
      : 'bg-slate-100 text-slate-600 border-slate-200';

  return <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${className}`}>{label}</span>;
}
