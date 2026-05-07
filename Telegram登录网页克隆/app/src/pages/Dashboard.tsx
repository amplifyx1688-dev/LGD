import {
  CheckCircle2,
  X,
  Check,
  Info,
  Calendar,
  Users,
  FileText,
  Mail,
  Settings,
  RefreshCw,
  Search,
} from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="pb-24">
      {/* Onboarding */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-primary text-lg" />
            <h2 className="text-lg font-bold text-dark">入门指南</h2>
          </div>
          <button className="text-shadowy-200 hover:text-shadowy-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0">
              <Check className="text-white text-xs w-4 h-4" />
            </div>
            <span className="text-sm text-shadowy-300 line-through">连接您的 Telegram 账户</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0">
              <Check className="text-white text-xs w-4 h-4" />
            </div>
            <span className="text-sm text-shadowy-300 line-through">点击此处将 Metricgram 机器人作为管理员添加到您的群组</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 shrink-0 rounded-xl bg-primary" />
            <div className="w-6 h-6 rounded-full border-2 border-shadowy-200 shrink-0" />
            <span className="text-sm text-primary hover:underline font-medium cursor-pointer">设置群组欢迎消息</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 shrink-0 rounded-xl invisible" />
            <div className="w-6 h-6 rounded-full border-2 border-shadowy-200 shrink-0" />
            <span className="text-sm text-primary hover:underline font-medium cursor-pointer">连接 Stripe，实现社区变现</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 shrink-0 rounded-xl invisible" />
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0">
              <Check className="text-white text-xs w-4 h-4" />
            </div>
            <span className="text-sm text-shadowy-300 line-through pointer-events-none">探索仪表盘</span>
          </div>
          <div className="mt-4 bg-shadowy-100 rounded-full h-2">
            <div className="bg-primary rounded-full h-2 transition-all duration-300" style={{ width: '60%' }} />
          </div>
          <p className="text-xs text-shadowy-300 mt-2">已完成 3 ，共 5</p>
        </div>
      </div>

      {/* Group header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400" />
        <div>
          <h1 className="text-2xl font-semibold text-shadowy-300">没钱没关系，哥做博弈养妳1.0</h1>
          <p className="text-sm text-shadowy-300">2026/04/08 - 2026/05/07</p>
        </div>
      </div>

      {/* Quick stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="flex flex-col bg-primary text-white p-5 rounded-md transition hover:bg-blue-600 cursor-pointer">
          <div className="text-xl font-medium flex items-center gap-2">
            <Mail className="w-6 h-6" />
            消息
          </div>
          <div className="text-base mt-2">1014</div>
        </div>
        <div className="flex flex-col bg-primary text-white p-5 rounded-md transition hover:bg-blue-600 cursor-pointer">
          <div className="text-xl font-medium flex items-center gap-2">
            <Users className="w-6 h-6" />
            用户
          </div>
          <div className="text-base mt-2">101</div>
        </div>
        <div className="flex flex-col bg-primary text-white p-5 rounded-md transition hover:bg-blue-600 cursor-pointer">
          <div className="text-xl font-medium flex items-center gap-2">
            <FileText className="w-6 h-6" />
            报告
          </div>
          <div className="text-base mt-2">管理报告</div>
        </div>
        <div className="flex flex-col bg-primary text-white p-5 rounded-md transition hover:bg-blue-600 cursor-pointer">
          <div className="text-xl font-medium flex items-center gap-2">
            <Settings className="w-6 h-6" />
            设置
          </div>
          <div className="text-base mt-2">群组设置</div>
        </div>
      </div>

      {/* Topics */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-2xl text-shadowy-300">话题</h2>
            <Info className="w-4 h-4 text-primary cursor-pointer" />
          </div>
          <div className="flex w-full md:w-auto items-center gap-2 mt-2 md:mt-0">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-shadowy-200" />
              <input placeholder="搜索" className="form-input pl-10 w-full" />
            </div>
            <button className="btn-secondary whitespace-nowrap">
              <span className="flex items-center gap-1"><RefreshCw className="w-4 h-4" /> 同步话题</span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex flex-col bg-white text-primary p-5 rounded-md transition hover:shadow-lg cursor-pointer">
            <div className="text-xl font-medium">通用主题</div>
            <div className="text-base mt-2 flex items-center">
              <Users className="w-4 h-4 mr-1" />
              77
            </div>
          </div>
          <div className="flex flex-col bg-white text-primary p-5 rounded-md transition hover:shadow-lg cursor-pointer">
            <div className="text-xl font-medium">聊天版</div>
            <div className="text-base mt-2 flex items-center">
              <Users className="w-4 h-4 mr-1" />
              0
            </div>
          </div>
        </div>
      </div>

      {/* Period toggle */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center py-2 px-3 rounded-3xl bg-primary text-white">
            <Calendar className="w-5 h-5" />
          </div>
          <input
            value="2026/04/08 - 2026/05/07"
            className="w-fit text-center rounded-full border-0 bg-white px-4 py-3 text-shadowy-300 text-sm ring-1 ring-inset ring-shadowy-100"
            readOnly
          />
        </div>
        <div className="inline-flex items-center rounded-full bg-light p-1">
          <button className="px-3.5 py-1.5 text-sm font-medium rounded-full bg-white text-primary ring-1 ring-shadowy-100 shadow-sm">每日</button>
          <button className="px-3.5 py-1.5 text-sm font-medium rounded-full text-shadowy-300 hover:text-primary">每周</button>
          <button className="px-3.5 py-1.5 text-sm font-medium rounded-full text-shadowy-300 hover:text-primary">每月</button>
        </div>
      </div>

      {/* Metric cards */}
      <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="card-metric">
          <div className="text-2xl font-medium">1014</div>
          <div className="text-sm tracking-tight">发送的消息总数</div>
        </div>
        <div className="card-metric">
          <div className="text-2xl font-medium">77</div>
          <div className="text-sm tracking-tight">发送消息的用户</div>
        </div>
        <div className="card-metric">
          <div className="text-2xl font-medium">13</div>
          <div className="text-sm tracking-tight">每用户平均消息数</div>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="card-metric">
          <div className="text-2xl font-medium">0</div>
          <div className="text-sm tracking-tight">加入群组的用户</div>
        </div>
        <div className="card-metric">
          <div className="text-2xl font-medium">0</div>
          <div className="text-sm tracking-tight">离开群组的用户</div>
        </div>
        <div className="card-metric">
          <div className="text-2xl font-medium">0</div>
          <div className="text-sm tracking-tight">活跃用户</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-shadowy-300 mb-4">发送的消息总数</h3>
          <div className="h-64 flex items-end justify-around gap-2">
            {[40, 65, 30, 80, 55, 45, 70, 35, 60, 50, 75, 40, 55, 45].map((h, i) => (
              <div key={i} className="flex-1 bg-primary/20 rounded-t" style={{ height: `${h}%` }}>
                <div className="bg-primary rounded-t w-full" style={{ height: `${h * 0.7}%` }} />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-shadowy-300 mb-4">活跃用户数</h3>
          <div className="h-64 flex items-end justify-around gap-2">
            {[20, 45, 15, 60, 35, 25, 50, 20, 40, 30, 55, 25, 35, 30].map((h, i) => (
              <div key={i} className="flex-1 bg-primary/20 rounded-t" style={{ height: `${h}%` }}>
                <div className="bg-primary rounded-t w-full" style={{ height: `${h * 0.7}%` }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
