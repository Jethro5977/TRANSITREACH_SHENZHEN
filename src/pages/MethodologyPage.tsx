import { AlertTriangle, Clock3, Database, Footprints, MapPinned, TrainFront } from 'lucide-react';

const STEPS = [
  { icon: MapPinned, title: '1. 选择深圳起点', text: '从静态地铁站快照中搜索，或点击地图任意深圳市域坐标。' },
  { icon: Footprints, title: '2. 估算首段步行', text: '以 4.8 km/h、最长 1.35 km 的直线接驳寻找附近站点。' },
  { icon: TrainFront, title: '3. 沿地铁走廊扩展', text: '按平均 34 km/h 估算车内时间，另计 4 分钟候车，并允许一次固定 4 分钟的换乘。' },
  { icon: Clock3, title: '4. 分配剩余时间', text: '把剩余时间转换为各下车站周围的步行圈，单站半径最多 1.2 km。' },
];

export function MethodologyPage() {
  return (
    <main className="min-h-screen pt-16">
      <div className="max-w-[1050px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10 fade-slide-up">
          <span className="text-xs font-bold text-teal-700 tracking-[0.18em]">METHODOLOGY</span>
          <h1 className="text-4xl font-extrabold text-slate-900 mt-3 mb-4">深圳版如何生成可达范围</h1>
          <p className="text-lg text-slate-600 max-w-3xl leading-relaxed">
            当前是前端交互 Demo，用轻量启发式模型替代尚未部署的深圳 OTP 路由图。每一项已加载数据与未建模限制都在这里明确列出。
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
            <li><strong className="text-slate-800">模型参数：</strong>步行 4.8 km/h、地铁平均 34 km/h、候车 4 分钟、一次换乘 4 分钟，均为交互原型假设，不是运营方发布指标。</li>
          </ul>
        </section>

        <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/80 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle size={21} className="text-amber-700 mt-0.5 shrink-0" />
            <div>
              <h2 className="font-bold text-amber-950 mb-2">模型边界与后续数据工作</h2>
              <p className="text-sm text-amber-900/80 leading-relaxed">
                后续仍需补充完整深圳地铁 GTFS 或可验证时刻表、真实换乘与步行路径、公交数据、实时状态及服务端压力测试。当前公开版本用于可达性概念探索，不可用于导航或公共决策。
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
