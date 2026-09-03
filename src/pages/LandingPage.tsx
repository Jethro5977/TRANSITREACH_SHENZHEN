import { useEffect, useState, type CSSProperties, type PointerEvent } from 'react';
import { AlertTriangle, ArrowRight, Building2, Check, Clock3, Database, MapPin, Route, Sparkles, TrainFront, type LucideIcon } from 'lucide-react';
import { LocationSearch, type LocationSearchResult } from '@/features/reachability/components/LocationSearch';
import { isPlaceResult, type RailStop } from '@/features/reachability/types';
import { SHENZHEN_DATA_SNAPSHOT_LABEL, SHENZHEN_METRO_LINES, SHENZHEN_METRO_STOPS } from '@/shared/data/shenzhen/metro';
import { useNavigate } from 'react-router-dom';
import { useCountUp } from '@/shared/hooks';
const FEATURED_STATIONS = ['深圳北', '福田', '车公庙', '前海湾', '岗厦北', '老街'];

export function LandingPage() {
  const [selected, setSelected] = useState<RailStop | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();

  const chooseLocation = (result: LocationSearchResult) => {
    if (isPlaceResult(result)) {
      setSelected(null);
      navigate(`/map?lat=${encodeURIComponent(result.lat)}&lon=${encodeURIComponent(result.lon)}&name=${encodeURIComponent(result.name)}`);
      return;
    }
    setSelected(result);
    navigate(`/map?stop=${encodeURIComponent(result.stopId)}`);
  };

  return (
    <main className="min-h-screen overflow-hidden">
      <section className="relative pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="hero-mesh absolute inset-0 -z-10" />
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
              <LocationSearch onSelect={chooseLocation} selected={selected} />
            </div>
            <div className="flex flex-wrap gap-2 mb-8">
              {FEATURED_STATIONS.map(name => {
                const stop = SHENZHEN_METRO_STOPS.find(item => item.name === name);
                return stop ? (
                  <button key={name} onClick={() => chooseLocation(stop)} className="chip chip-unselected text-xs">
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
            <div
              className="hero-snapshot absolute inset-0 rounded-[32px] bg-slate-950 shadow-2xl shadow-slate-900/20 overflow-hidden"
              style={{ '--tilt-x': `${tilt.x}deg`, '--tilt-y': `${tilt.y}deg` } as CSSProperties}
              onPointerMove={(event: PointerEvent<HTMLDivElement>) => {
                if (event.pointerType === 'touch') return;
                const rect = event.currentTarget.getBoundingClientRect();
                setTilt({ x: ((event.clientY - rect.top) / rect.height - 0.5) * -3, y: ((event.clientX - rect.left) / rect.width - 0.5) * 3 });
              }}
              onPointerLeave={() => setTilt({ x: 0, y: 0 })}
            >
              <div className="absolute inset-0 opacity-30 bg-[linear-gradient(rgba(45,212,191,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(45,212,191,.16)_1px,transparent_1px)] bg-[size:40px_40px]" />
              <svg className="absolute inset-0 h-full w-full opacity-70" viewBox="0 0 600 430" aria-hidden="true">
                <path d="M65 290 C145 190 185 318 252 235 S354 146 420 215 S520 154 555 91" fill="none" stroke="rgba(45,212,191,.8)" strokeWidth="2" className="draw-route" />
                <path d="M100 114 C185 160 200 81 282 132 S394 290 516 314" fill="none" stroke="rgba(96,165,250,.72)" strokeWidth="2" strokeDasharray="7 7" className="draw-route" />
                <circle cx="252" cy="235" r="4" fill="#5eead4" /><circle cx="420" cy="215" r="4" fill="#5eead4" /><circle cx="516" cy="314" r="4" fill="#93c5fd" />
              </svg>
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
                <Metric label="覆盖站点" value={SHENZHEN_METRO_STOPS.length} />
                <Metric label="覆盖线路" value={SHENZHEN_METRO_LINES.length} delay={90} />
                <Metric label="默认预算" value={30} suffix=" min" delay={180} />
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
          <section className="mt-10 border-t border-slate-200/80 pt-10" aria-labelledby="capabilities-title">
            <h2 id="capabilities-title" className="text-2xl font-extrabold text-slate-900">这个工具能做什么</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">用用户语言说明当前可用能力与边界，帮助你正确理解地图上的结果。</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <CapabilityCard icon={Check} title="估算地铁可达范围" text="选择起点和时间预算，查看步行、地铁与一次换乘组合下的大致可达区域。" status="available" />
              <CapabilityCard icon={Check} title="对比不同时间预算" text="快速切换 15、30、45、60 分钟，直观感受时间预算对可达范围的影响。" status="available" />
              <CapabilityCard icon={AlertTriangle} title="数据为 Demo 近似值" text="当前使用启发式速度模型，不含真实时刻表、公交和完整步行道路网络；结果不可用于实际通勤规划。" status="limitation" />
              <CapabilityCard icon={AlertTriangle} title="仅覆盖地铁" text="暂未接入公交系统；实际通勤中公交与步行接驳可显著扩展可达范围。" status="limitation" />
            </div>
          </section>
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

function Metric({ label, value, suffix = '', delay = 0 }: { label: string; value: number; suffix?: string; delay?: number }) {
  // The hero card is above the fold. A mount delay is more reliable than observing
  // a child inside its overflow-hidden visual frame.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), 300 + delay);
    return () => window.clearTimeout(timer);
  }, [delay]);

  const displayed = useCountUp(visible ? value : 0, 760, 0);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur px-4 py-3 text-white">
      <div className="text-[10px] uppercase tracking-wider text-slate-400">{label}</div>
      <div className="font-bold text-xl mt-1">{Math.round(displayed)}{suffix}</div>
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

function CapabilityCard({ icon: Icon, title, text, status }: { icon: LucideIcon; title: string; text: string; status: 'available' | 'limitation' }) {
  const available = status === 'available';
  return (
    <article className={`rounded-2xl border bg-white/70 p-5 border-l-4 ${available ? 'border-slate-200 border-l-emerald-500' : 'border-amber-200 border-l-amber-500'}`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${available ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}><Icon size={18} /></div>
        <div>
          <h3 className="font-bold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{text}</p>
        </div>
      </div>
    </article>
  );
}
