import { ExternalLink } from 'lucide-react';

export function Footer({ compact = false }: { compact?: boolean }) {
  const links = <><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap / ODbL</a><a href="https://opendata.sz.gov.cn/" target="_blank" rel="noreferrer">深圳政府数据开放平台</a><a href="https://github.com/Jethro5977/TRANSITREACH_SHENZHEN" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1">GitHub <ExternalLink size={11} /></a></>;
  if (compact) return <footer className="hidden sm:block fixed bottom-3 left-1/2 -translate-x-1/2 z-[700] max-w-[calc(100vw-1.5rem)] whitespace-nowrap overflow-x-auto rounded-full bg-slate-950/85 backdrop-blur px-4 py-2 text-[10px] text-slate-300 shadow-xl"><div className="flex items-center gap-3 [&_a]:hover:text-teal-300">{links}<span>v0.5.0 · 仅供演示，不用于导航</span></div></footer>;
  return <footer className="border-t border-slate-200 bg-white/80 px-4 py-7 text-xs text-slate-500"><div className="max-w-[1320px] mx-auto flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between"><p><strong className="text-slate-700">TransitReach 深圳 v0.5.0</strong> · 通勤选区 Demo，仅供交互研究，不用于导航或公共决策。</p><div className="flex flex-wrap gap-x-4 gap-y-2 [&_a]:hover:text-teal-700">{links}</div></div></footer>;
}
