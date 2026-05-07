import { useState } from 'react';
import {
  Save,
  Eye,
  Info,
  BarChart3,
  TrendingUp,
  Calendar,
  Sparkles,
  Send,
  MessageCircle,
  Users,
  Clock,
} from 'lucide-react';

export default function ActivitySummary() {
  const [frequency, setFrequency] = useState('daily');
  const [active, setActive] = useState(true);

  return (
    <div className="pb-24">
      <h2 className="page-header">活动摘要</h2>
      <p className="page-description">
        配置自动生成的群组活动摘要报告，定期发送到您的邮箱或群组中。
      </p>

      <div className="mt-6 space-y-6">
        {/* Main config */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-shadowy-300">摘要设置</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-shadowy-300">启用</span>
              <button
                onClick={() => setActive(!active)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${active ? 'bg-primary' : 'bg-shadowy-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${active ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-shadowy-300 mb-2">摘要频率</label>
              <div className="flex gap-2">
                {[
                  { key: 'daily', label: '每日', icon: Clock },
                  { key: 'weekly', label: '每周', icon: Calendar },
                  { key: 'monthly', label: '每月', icon: BarChart3 },
                ].map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => setFrequency(opt.key)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                        frequency === opt.key
                          ? 'bg-primary text-white'
                          : 'bg-light text-shadowy-300 hover:bg-shadowy-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-shadowy-300 mb-2">摘要标题模板</label>
              <input
                className="form-input"
                defaultValue="[群组名] 活动摘要 - [日期]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-shadowy-300 mb-2">摘要内容模板</label>
              <textarea
                rows={8}
                className="form-textarea"
                defaultValue={`📊 群组活动摘要

📈 本周统计：
• 总消息数：#total_messages
• 活跃用户数：#active_users
• 新加入成员：#new_members

🏆 本周之星：
• 最活跃用户：#top_user
• 最多反应消息：#top_message

💬 热门话题：
• #topic_1
• #topic_2
• #topic_3`}
              />
            </div>

            <div className="flex items-center gap-2 text-sm text-shadowy-200">
              <Info className="w-4 h-4" />
              <span>使用 <code className="bg-gray-100 px-1 rounded">#变量名</code> 来插入动态数据</span>
            </div>

            <div className="flex gap-3">
              <button className="btn-primary">
                <Save className="w-4 h-4" />
                <span>保存</span>
              </button>
              <button className="btn-secondary">
                <Eye className="w-4 h-4" />
                <span>预览</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Preview */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-shadowy-300 mb-4">预览数据</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-light rounded-xl p-4">
              <div className="flex items-center gap-2 text-primary mb-2">
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs font-medium">总消息数</span>
              </div>
              <div className="text-xl font-bold text-dark">1,245</div>
              <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" />
                +12%
              </div>
            </div>
            <div className="bg-light rounded-xl p-4">
              <div className="flex items-center gap-2 text-primary mb-2">
                <Users className="w-4 h-4" />
                <span className="text-xs font-medium">活跃用户</span>
              </div>
              <div className="text-xl font-bold text-dark">86</div>
              <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" />
                +5%
              </div>
            </div>
            <div className="bg-light rounded-xl p-4">
              <div className="flex items-center gap-2 text-primary mb-2">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-medium">新成员</span>
              </div>
              <div className="text-xl font-bold text-dark">12</div>
              <div className="text-xs text-red-500 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 rotate-180" />
                -3%
              </div>
            </div>
            <div className="bg-light rounded-xl p-4">
              <div className="flex items-center gap-2 text-primary mb-2">
                <Send className="w-4 h-4" />
                <span className="text-xs font-medium">平均消息/人</span>
              </div>
              <div className="text-xl font-bold text-dark">14.5</div>
              <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" />
                +8%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
