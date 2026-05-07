import { useState } from 'react';
import {
  CreditCard,
  Check,
  X,
  DollarSign,
  Users,
  Activity,
  BarChart3,
} from 'lucide-react';

export default function BillingLimits() {
  const [plan, setPlan] = useState('pro');

  const plans = [
    {
      key: 'free',
      name: '免费版',
      price: '¥0',
      period: '/月',
      description: '适合小型社区起步',
      features: ['1 个群组', '100 用户', '基础统计', '欢迎消息'],
      limited: ['AI 聊天机器人', '高级分析', 'Stripe 连接'],
    },
    {
      key: 'pro',
      name: '专业版',
      price: '¥99',
      period: '/月',
      description: '适合成长中的社区',
      features: ['5 个群组', '10,000 用户', '高级统计', 'AI 聊天机器人', '自动回复', '定时消息'],
      limited: ['收入智能'],
    },
    {
      key: 'enterprise',
      name: '企业版',
      price: '¥499',
      period: '/月',
      description: '适合大型社区和商业用途',
      features: ['无限群组', '无限用户', '全部功能', '收入智能', 'API 访问', '优先支持'],
      limited: [],
    },
  ];

  return (
    <div className="pb-24">
      <h2 className="page-header">账单与限制</h2>
      <p className="page-description">
        管理您的订阅计划和查看使用限额。
      </p>

      {/* Current usage */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Users className="w-5 h-5" />
            <span className="text-sm font-medium">用户数</span>
          </div>
          <div className="text-2xl font-bold text-dark">101 / 10,000</div>
          <div className="mt-2 bg-gray-100 rounded-full h-2">
            <div className="bg-primary rounded-full h-2" style={{ width: '1%' }} />
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Activity className="w-5 h-5" />
            <span className="text-sm font-medium">消息数</span>
          </div>
          <div className="text-2xl font-bold text-dark">1,014 / ∞</div>
          <div className="mt-2 bg-gray-100 rounded-full h-2">
            <div className="bg-primary rounded-full h-2" style={{ width: '5%' }} />
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-primary mb-2">
            <BarChart3 className="w-5 h-5" />
            <span className="text-sm font-medium">AI 调用</span>
          </div>
          <div className="text-2xl font-bold text-dark">245 / 5,000</div>
          <div className="mt-2 bg-gray-100 rounded-full h-2">
            <div className="bg-primary rounded-full h-2" style={{ width: '5%' }} />
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-primary mb-2">
            <DollarSign className="w-5 h-5" />
            <span className="text-sm font-medium">本月账单</span>
          </div>
          <div className="text-2xl font-bold text-dark">¥99</div>
          <div className="text-xs text-shadowy-200 mt-1">下次扣费: 2026/06/01</div>
        </div>
      </div>

      {/* Plans */}
      <h3 className="text-lg font-semibold text-shadowy-300 mb-4">选择计划</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((p) => (
          <div
            key={p.key}
            onClick={() => setPlan(p.key)}
            className={`relative rounded-xl p-6 border-2 cursor-pointer transition ${
              plan === p.key
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 bg-white hover:border-primary/50'
            }`}
          >
            {plan === p.key && (
              <div className="absolute top-4 right-4">
                <Check className="w-5 h-5 text-primary" />
              </div>
            )}
            <h4 className="font-semibold text-dark">{p.name}</h4>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-3xl font-bold text-dark">{p.price}</span>
              <span className="text-sm text-shadowy-200">{p.period}</span>
            </div>
            <p className="text-sm text-shadowy-200 mt-2">{p.description}</p>
            <ul className="mt-4 space-y-2">
              {p.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-shadowy-300">
                  <Check className="w-4 h-4 text-green-500" />
                  {f}
                </li>
              ))}
              {p.limited.map((f, i) => (
                <li key={`l-${i}`} className="flex items-center gap-2 text-sm text-shadowy-200">
                  <X className="w-4 h-4 text-gray-300" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <button className="btn-primary">
          <CreditCard className="w-4 h-4" />
          <span>升级计划</span>
        </button>
      </div>
    </div>
  );
}
