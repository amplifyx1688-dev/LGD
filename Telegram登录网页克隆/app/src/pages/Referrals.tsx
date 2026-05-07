import { useState } from 'react';
import {
  Copy,
  Check,
  Users,
  TrendingUp,
  DollarSign,
  Mail,
  MessageCircle,
} from 'lucide-react';

export default function Referrals() {
  const [copied, setCopied] = useState(false);
  const referralLink = 'https://metricgram.com/ref/USER123';

  const stats = {
    clicks: 45,
    signups: 12,
    conversions: 3,
    earnings: 150,
  };

  const referrals = [
    { name: 'User A', date: '2026/04/20', status: 'active', commission: 50 },
    { name: 'User B', date: '2026/04/15', status: 'active', commission: 50 },
    { name: 'User C', date: '2026/04/10', status: 'pending', commission: 0 },
  ];

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="pb-24">
      <h2 className="page-header">推荐计划</h2>
      <p className="page-description">
        邀请好友使用 Metricgram，赚取推荐佣金。
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-primary mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm font-medium">链接点击</span>
          </div>
          <div className="text-2xl font-bold text-dark">{stats.clicks}</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Users className="w-5 h-5" />
            <span className="text-sm font-medium">注册数</span>
          </div>
          <div className="text-2xl font-bold text-dark">{stats.signups}</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Check className="w-5 h-5" />
            <span className="text-sm font-medium">转化数</span>
          </div>
          <div className="text-2xl font-bold text-dark">{stats.conversions}</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-primary mb-2">
            <DollarSign className="w-5 h-5" />
            <span className="text-sm font-medium">累计收益</span>
          </div>
          <div className="text-2xl font-bold text-dark">¥{stats.earnings}</div>
        </div>
      </div>

      {/* Referral Link */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold text-shadowy-300 mb-4">您的推荐链接</h3>
        <div className="flex gap-2">
          <input
            value={referralLink}
            readOnly
            className="form-input flex-1"
          />
          <button
            onClick={copyLink}
            className="btn-primary"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '已复制' : '复制'}</span>
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          <button className="btn-secondary">
            <Mail className="w-4 h-4" />
            <span>邮件分享</span>
          </button>
          <button className="btn-secondary">
            <MessageCircle className="w-4 h-4" />
            <span>Telegram</span>
          </button>
        </div>
      </div>

      {/* Referrals table */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-shadowy-300 mb-4">推荐记录</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="data-table th">用户</th>
                <th className="data-table th">日期</th>
                <th className="data-table th">状态</th>
                <th className="data-table th">佣金</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((r, idx) => (
                <tr key={idx} className="border-t hover:bg-gray-50 transition">
                  <td className="data-table td font-medium">{r.name}</td>
                  <td className="data-table td">{r.date}</td>
                  <td className="data-table td">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      r.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {r.status === 'active' ? '活跃' : '待激活'}
                    </span>
                  </td>
                  <td className="data-table td">¥{r.commission}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
