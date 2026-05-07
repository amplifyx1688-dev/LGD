import {
  TrendingUp,
  Lock,
  BarChart3,
  DollarSign,
  Users,
  TrendingDown,
  PieChart,
  LineChart,
  Activity,
  Calendar,
  Download,
} from 'lucide-react';

export default function RevenueIntelligence() {
  return (
    <div className="pb-24">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
        <div className="min-w-0 flex-1">
          <h2 className="page-header">收入智能</h2>
          <p className="page-description">
            深入了解您的社区变现数据，优化收入策略。
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <button className="btn-secondary">
            <Download className="w-4 h-4" />
            <span>导出报告</span>
          </button>
        </div>
      </div>

      {/* Locked feature banner */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <Lock className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-dark">企业版功能</h3>
            <p className="text-sm text-shadowy-200">升级到企业版解锁完整的收入智能分析</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-primary">
            <TrendingUp className="w-4 h-4" />
            <span>升级计划</span>
          </button>
        </div>
      </div>

      {/* Demo stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm opacity-60">
          <div className="flex items-center gap-2 text-primary mb-2">
            <DollarSign className="w-5 h-5" />
            <span className="text-sm font-medium">总收入</span>
          </div>
          <div className="text-2xl font-bold text-dark">¥--</div>
          <div className="text-xs text-shadowy-200 mt-1">需升级查看</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm opacity-60">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Users className="w-5 h-5" />
            <span className="text-sm font-medium">付费转化率</span>
          </div>
          <div className="text-2xl font-bold text-dark">--%</div>
          <div className="text-xs text-shadowy-200 mt-1">需升级查看</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm opacity-60">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Activity className="w-5 h-5" />
            <span className="text-sm font-medium">ARPU</span>
          </div>
          <div className="text-2xl font-bold text-dark">¥--</div>
          <div className="text-xs text-shadowy-200 mt-1">每用户平均收入</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm opacity-60">
          <div className="flex items-center gap-2 text-primary mb-2">
            <TrendingDown className="w-5 h-5" />
            <span className="text-sm font-medium">流失率</span>
          </div>
          <div className="text-2xl font-bold text-dark">--%</div>
          <div className="text-xs text-shadowy-200 mt-1">需升级查看</div>
        </div>
      </div>

      {/* Feature list */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-shadowy-300 mb-4">企业版收入智能功能</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { icon: BarChart3, title: '收入趋势分析', desc: '追踪每月、每周、每日收入变化趋势' },
            { icon: PieChart, title: '收入来源分布', desc: '了解不同产品和渠道的收入贡献' },
            { icon: Users, title: '用户价值分析', desc: '识别高价值用户和潜在付费用户' },
            { icon: LineChart, title: '预测模型', desc: '基于历史数据预测未来收入' },
            { icon: Activity, title: '流失预警', desc: '提前识别可能流失的付费用户' },
            { icon: Calendar, title: '订阅生命周期', desc: '分析用户的订阅续订和升级行为' },
          ].map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div key={idx} className="flex items-start gap-3 p-4 border border-gray-100 rounded-xl">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-dark">{feature.title}</h4>
                  <p className="text-sm text-shadowy-200">{feature.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
