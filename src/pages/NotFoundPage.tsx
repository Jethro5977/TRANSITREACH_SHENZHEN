import { ArrowLeft, Map } from 'lucide-react';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return <main className="min-h-screen pt-16 flex items-center justify-center px-4"><section className="glass max-w-xl w-full p-8 sm:p-12 text-center"><div className="text-7xl font-black text-teal-600/20">404</div><h1 className="text-3xl font-extrabold text-slate-900 mt-2">这条线路暂未开通</h1><p className="text-slate-600 mt-3 mb-7">你访问的页面不存在，返回首页或继续探索深圳可达地图。</p><div className="flex flex-wrap justify-center gap-3"><Link to="/" className="btn-secondary inline-flex items-center gap-2"><ArrowLeft size={17} />返回首页</Link><Link to="/map" className="btn-primary inline-flex items-center gap-2"><Map size={17} />打开地图</Link></div></section></main>;
}
