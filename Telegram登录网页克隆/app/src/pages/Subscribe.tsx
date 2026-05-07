import { useState } from 'react';
import {
  Check,
  Star,
  Zap,
  Crown,
} from 'lucide-react';

export default function Subscribe() {
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [billingCycle, setBillingCycle] = useState('monthly');

  const plans = [
    {
      key: 'free',
      name: '免费版',
      icon: Star,
      monthlyPrice: 0,
      yearlyPrice: 0,
      description: '适合小型社区起步',
      features: [
        '1 个群组',
        '最多 100 用户',
        '基础统计报告',
        '欢迎消息',
        '社区支持',
      ],
      cta: '当前计划',
      popular: false,
    },
    {
      key: 'pro',
      name: '专业版',
      icon: Zap,
      monthlyPrice: 99,
      yearlyPrice: 79,
      description: '适合成长中的社区',
      features: [
        '5 个群组',
        '最多 10,000 用户',
        '高级统计分析',
        'AI 聊天机器人',
        '自动回复 & 定时消息',
        '优先邮件支持',
      ],
      cta: '升级到专业版',
      popular: true,
    },
    {
      key: 'enterprise',
      name: '企业版',
      icon: Crown,
      monthlyPrice: 499,
      yearlyPrice: 399,
      description: '适合大型社区和商业用途',
      features: [
        '无限群组',
        '无限用户',
        '全部功能解锁',
        '收入智能分析',
        'API 访问权限',
        '专属客户成功经理',
        'SLA 保障',
      ],
      cta: '联系销售',
      popular: false,
    },
  ];

  return (
    <div className="pb-24">
      <div className="text-center mb-8">
        <h2 className="page-header">选择您的计划</h2>
        <p className="page-description">
          选择最适合您社区规模的方案，随时可以升级或降级。
        </p>
      </div>

      {/* Billing toggle */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex items-center bg-light rounded-full p-1">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              billingCycle === 'monthly'
                ? 'bg-white text-primary shadow-sm'
                : 'text-shadowy-300'
            }`}
          >
            月付
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              billingCycle === 'yearly'
                ? 'bg-white text-primary shadow-sm'
                : 'text-shadowy-300'
            }`}
          >
            年付 <span className="text-xs text-green-600">省20%</span>
          </button>
        </div>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
          return (
            <div
              key={plan.key}
              onClick={() => setSelectedPlan(plan.key)}
              className={`relative rounded-2xl p-6 border-2 cursor-pointer transition hover:shadow-lg ${
                selectedPlan === plan.key
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 bg-white'
              } ${plan.popular ? 'ring-2 ring-primary ring-offset-2' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                    最受欢迎
                  </span>
                </div>
              )}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                plan.popular ? 'bg-primary' : 'bg-gray-100'
              }`}>
                <Icon className={`w-6 h-6 ${plan.popular ? 'text-white' : 'text-shadowy-300'}`} />
              </div>
              <h3 className="text-xl font-bold text-dark">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-bold text-dark">
                  {price === 0 ? '免费' : `¥${price}`}
                </span>
                {price > 0 && (
                  <span className="text-sm text-shadowy-200">
                    /{billingCycle === 'monthly' ? '月' : '月'}
                  </span>
                )}
              </div>
              <p className="text-sm text-shadowy-200 mt-2">{plan.description}</p>
              <ul className="mt-6 space-y-3">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-shadowy-300">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className={`w-full mt-6 py-2.5 rounded-lg font-medium text-sm transition ${
                  selectedPlan === plan.key
                    ? 'bg-primary text-white hover:bg-blue-600'
                    : 'bg-gray-100 text-shadowy-300 hover:bg-gray-200'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <div className="mt-12 bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-shadowy-300 mb-4">常见问题</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-dark mb-1">可以随时取消订阅吗？</h4>
            <p className="text-sm text-shadowy-200">是的，您可以随时取消订阅，取消后当前计费周期结束前仍可继续使用。</p>
          </div>
          <div>
            <h4 className="font-medium text-dark mb-1">支持哪些支付方式？</h4>
            <p className="text-sm text-shadowy-200">我们支持支付宝、微信支付、信用卡和 PayPal。</p>
          </div>
          <div>
            <h4 className="font-medium text-dark mb-1">有退款政策吗？</h4>
            <p className="text-sm text-shadowy-200">首次订阅 7 天内可申请全额退款，无需说明理由。</p>
          </div>
        </div>
      </div>
    </div>
  );
}
