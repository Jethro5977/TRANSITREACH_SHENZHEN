import { useState } from 'react';
import { ArrowRight, Building2, Clock3, Database, MapPin, Route, Sparkles, TrainFront } from 'lucide-react';
import { LocationSearch } from '@/features/reachability/components/LocationSearch';
import type { RailStop } from '@/features/reachability/types';
import { SHENZHEN_DATA_SNAPSHOT_LABEL, SHENZHEN_METRO_LINES, SHENZHEN_METRO_STOPS } from '@/shared/data/shenzhen/metro';
import { useNavigate } from 'react-router-dom';
const FEATURED_STATIONS = ['深圳北', '福田', '车公庙', '前海湾', '岗厦北', '老街'];

export function LandingPage() {
  const [selected, setSelected] = useState<RailStop | null>(null);
  const navigate = useNavigate();

  const chooseStop = (stop: RailStop) => {
    setSelected(stop);
    navigate(`/map?stop=${encodeURIComponent(stop.stopId)}`);
  };

  return (
    <main className="min-h-screen overflow-hidden">
      <section className="relative pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_15%,rgba(20,184,166,0.14),transparent_34%),radial-gradient(circle_at_85%_70%,rgba(37,99,235,0.12),transparent_30%)]" />
        <div className="max-w-[1320px] mx-auto grid lg:grid-cols-[1.05fr_0.95fr] gap-10 items-center">
          <div className="fade-slide-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-chip mb-6">
              <Sparkles size={14} className="text-teal-600" />
              <span className="text-xs font-bold text-teal-700">深圳公共交通可达性工具</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 leading-[1.05] tracking-tight mb-6">
              输入你的起点，看看
              <span className="block bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">30 分钟能到哪里</span>
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mb-8">
              选择一个深圳地铁站或地图坐标，设置 15–60 分钟时间预算，快速探索步行与地铁组合下的可达范围。
            </p>
            <div className="max-w-lg mb-5">
              <LocationSearch onSelect={chooseStop} selected={selected} />
            </div>
            <div className="flex flex-wrap gap-2 mb-8">
              {FEATURED_STATIONS.map(name => {
                const stop = SHENZHEN_METRO_STOPS.find(item => item.name === name);
                return stop ? (
                  <button key={name} onClick={() => chooseStop(stop)} className="chip chip-unselected text-xs">
                    {name}
                  </button>
                ) : null;
              })}
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => navigate('/map')} className="btn-primary inline-flex items-center gap-2">
                打开深圳地图 <ArrowRight size={18} />
              </button>
              <button onClick={() => navigate('/methodology')} className="btn-secondary inline-flex items-center gap-2">
                <Route size={17} /> 查看模型说明
              </button>
            </div>
          </div>

          <div className="relative min-h-[430px] fade-slide-up">
            <div className="absolute inset-0 rounded-[32px] bg-slate-950 shadow-2xl shadow-slate-900/20 overflow-hidden">
              <div className="absolute inset-0 opacity-30 bg-[linear-gradient(rgba(45,212,191,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(45,212,191,.16)_1px,transparent_1px)] bg-[size:40px_40px]" />
              <div
                className="absolute w-72 h-72 border border-teal-300/30 bg-teal-400/10 left-[14%] top-[17%]"
                style={{ clipPath: 'polygon(12% 18%, 34% 5%, 61% 9%, 86% 26%, 95% 53%, 83% 78%, 58% 94%, 30% 88%, 8% 66%, 3% 39%)' }}
              />
              <div
                className="absolute w-44 h-44 border border-blue-300/30 bg-blue-400/10 right-[10%] bottom-[12%]"
                style={{ clipPath: 'polygon(16% 10%, 55% 4%, 88% 25%, 97% 62%, 72% 94%, 31% 89%, 5% 58%)' }}
              />
              <div className="absolute left-[36%] top-[43%] w-5 h-5 rounded-full bg-teal-400 ring-[12px] ring-teal-400/20 shadow-[0_0_35px_rgba(45,212,191,.9)]" />
              <div className="absolute left-7 top-7 text-white">
                <div className="text-xs text-teal-300 font-bold tracking-[0.2em]">TRANSITREACH SHENZHEN</div>
                <div className="text-2xl font-bold mt-2">30 分钟可达性快照</div>
              </div>
              <div className="absolute left-7 right-7 bottom-7 grid grid-cols-3 gap-3">
                <Metric label="覆盖站点" value={`${SHENZHEN_METRO_STOPS.length}`} />
                <Metric label="覆盖线路" value={`${SHENZHEN_METRO_LINES.length}`} />
                <Metric label="默认预算" value="30 min" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-[1320px] mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <InfoCard icon={MapPin} title="地图自由选点" text="站点搜索或地图点击均可设为起点。" />
            <InfoCard icon={Clock3} title="不规则区域边界" text="合并重叠站点包络，保留分离区域与内部空洞。" />
            <InfoCard icon={TrainFront} title="深圳轨道快照" text="包含 266 个 OSM 去重站点与 11 条线路关系。" />
            <InfoCard icon={Database} title="来源透明" text={`开放地图坐标与模型假设持续说明 · 数据快照 ${SHENZHEN_DATA_SNAPSHOT_LABEL}。`} />
          </div>
          <div className="mt-6 glass p-5 flex gap-3 items-start border border-amber-200/70">
            <Building2 size={19} className="text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-slate-600 leading-relaxed">
              <strong className="text-slate-800">本工具仍属于交互原型（Demo）。</strong>
              当前范围使用启发式速度模型，并会避开 OSM 水域与高速缓冲区，最多模拟一次换乘；公交、完整时刻表、完整步行道路网络及实时运营信息尚未参与计算，不可用于实际导航。
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur px-4 py-3 text-white">
      <div className="text-[10px] uppercase tracking-wider text-slate-400">{label}</div>
      <div className="font-bold text-xl mt-1">{value}</div>
    </div>
  );
}

function InfoCard({ icon: Icon, title, text }: { icon: typeof MapPin; title: string; text: string }) {
  return (
    <div className="glass p-5 card-hover">
      <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-4">
        <Icon size={20} />
      </div>
      <h2 className="font-bold text-slate-900 mb-1">{title}</h2>
      <p className="text-sm text-slate-600 leading-relaxed">{text}</p>
    </div>
  );
}
