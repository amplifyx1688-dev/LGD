import { useState } from 'react';
import {
  Award,
  Star,
  Trophy,
  Medal,
  Crown,
  PlusCircle,
  Pencil,
  Trash2,
  Users,
  TrendingUp,
  Zap,
  Sparkles,
  Gift,
  MessageCircle,
  Share2,
} from 'lucide-react';

export default function Gamification() {
  const [activeTab, setActiveTab] = useState<'overview' | 'rewards' | 'leaderboard' | 'actions'>('overview');

  const tabs = [
    { key: 'overview', label: '概览', icon: Award },
    { key: 'rewards', label: '奖励', icon: Gift },
    { key: 'leaderboard', label: '排名', icon: Trophy },
    { key: 'actions', label: '操作', icon: Zap },
  ];

  const leaderboardData = [
    { rank: 1, name: 'Alice', points: 1250, messages: 342, reactions: 89 },
    { rank: 2, name: 'Bob', points: 980, messages: 256, reactions: 67 },
    { rank: 3, name: 'Charlie', points: 875, messages: 198, reactions: 54 },
    { rank: 4, name: 'David', points: 720, messages: 167, reactions: 43 },
    { rank: 5, name: 'Eve', points: 650, messages: 145, reactions: 38 },
  ];

  const rewards = [
    { id: 1, name: '活跃之星', description: '连续7天发送消息', icon: Star, points: 100, color: 'text-yellow-500' },
    { id: 2, name: '话题达人', description: '发起话题获得50+回复', icon: MessageCircle, points: 200, color: 'text-blue-500' },
    { id: 3, name: '社区建设者', description: '邀请10位新成员', icon: Share2, points: 300, color: 'text-green-500' },
    { id: 4, name: '金牌会员', description: '累计获得1000积分', icon: Crown, points: 500, color: 'text-purple-500' },
  ];

  const actionRules = [
    { action: '发送消息', points: 1, description: '每条有效消息' },
    { action: '获得反应', points: 5, description: '每条消息获得反应' },
    { action: '邀请用户', points: 50, description: '每邀请一位新成员' },
    { action: '连续活跃', points: 20, description: '连续7天活跃' },
  ];

  return (
    <div className="pb-24">
      <h2 className="page-header">游戏化</h2>
      <p className="page-description">
        通过积分、徽章和排行榜激励社区成员参与互动。
      </p>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Users className="w-5 h-5" />
            <span className="text-sm font-medium">参与者</span>
          </div>
          <div className="text-2xl font-bold text-dark">86</div>
          <div className="text-xs text-shadowy-200">占总用户 85%</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Star className="w-5 h-5" />
            <span className="text-sm font-medium">总积分</span>
          </div>
          <div className="text-2xl font-bold text-dark">12,450</div>
          <div className="text-xs text-shadowy-200">本月 +23%</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Medal className="w-5 h-5" />
            <span className="text-sm font-medium">已发放徽章</span>
          </div>
          <div className="text-2xl font-bold text-dark">342</div>
          <div className="text-xs text-shadowy-200">共 12 种徽章</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-primary mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm font-medium">活跃度</span>
          </div>
          <div className="text-2xl font-bold text-dark">78%</div>
          <div className="text-xs text-shadowy-200">较上月 +12%</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-primary text-white'
                  : 'bg-white text-shadowy-300 hover:bg-light'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-shadowy-300 mb-4">积分趋势</h3>
            <div className="h-48 flex items-end justify-around gap-2">
              {[30, 45, 25, 60, 40, 55, 35, 50, 42, 65, 48, 70].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-primary/20 rounded-t" style={{ height: `${h * 2}px` }}>
                    <div className="bg-primary rounded-t w-full" style={{ height: `${h * 1.4}px` }} />
                  </div>
                  <span className="text-xs text-shadowy-200">{i + 1}月</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-shadowy-300 mb-4">最近获得的徽章</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {rewards.slice(0, 4).map((reward) => {
                const Icon = reward.icon;
                return (
                  <div key={reward.id} className="border border-gray-100 rounded-xl p-4 text-center hover:shadow-md transition">
                    <Icon className={`w-8 h-8 mx-auto mb-2 ${reward.color}`} />
                    <h4 className="font-medium text-sm text-dark">{reward.name}</h4>
                    <p className="text-xs text-shadowy-200 mt-1">{reward.description}</p>
                    <span className="inline-block mt-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">+{reward.points} 积分</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rewards' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-shadowy-300">奖励列表</h3>
            <button className="btn-primary">
              <PlusCircle className="w-4 h-4" />
              <span>新建奖励</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rewards.map((reward) => {
              const Icon = reward.icon;
              return (
                <div key={reward.id} className="border border-gray-100 rounded-xl p-4 flex items-start gap-4 hover:shadow-md transition">
                  <div className={`p-3 rounded-xl bg-gray-50`}>
                    <Icon className={`w-6 h-6 ${reward.color}`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-dark">{reward.name}</h4>
                    <p className="text-sm text-shadowy-200 mt-1">{reward.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Sparkles className="w-3 h-3 text-primary" />
                      <span className="text-sm text-primary font-medium">{reward.points} 积分</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button className="p-1 hover:bg-light rounded">
                      <Pencil className="w-4 h-4 text-shadowy-300" />
                    </button>
                    <button className="p-1 hover:bg-light rounded">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-shadowy-300 mb-4">用户排名</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="data-table th">排名</th>
                  <th className="data-table th">用户</th>
                  <th className="data-table th">积分</th>
                  <th className="data-table th">消息数</th>
                  <th className="data-table th">反应数</th>
                  <th className="data-table th">徽章</th>
                </tr>
              </thead>
              <tbody>
                {leaderboardData.map((user) => (
                  <tr key={user.rank} className="border-t hover:bg-gray-50 transition">
                    <td className="data-table td">
                      <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                        user.rank === 1 ? 'bg-yellow-100 text-yellow-600' :
                        user.rank === 2 ? 'bg-gray-100 text-gray-600' :
                        user.rank === 3 ? 'bg-orange-100 text-orange-600' :
                        'bg-gray-50 text-gray-400'
                      }`}>
                        {user.rank}
                      </div>
                    </td>
                    <td className="data-table td font-medium">{user.name}</td>
                    <td className="data-table td">
                      <span className="font-semibold text-primary">{user.points}</span>
                    </td>
                    <td className="data-table td">{user.messages}</td>
                    <td className="data-table td">{user.reactions}</td>
                    <td className="data-table td">
                      <div className="flex gap-1">
                        {user.rank <= 2 && <Crown className="w-4 h-4 text-yellow-500" />}
                        {user.rank <= 3 && <Medal className="w-4 h-4 text-blue-500" />}
                        <Star className="w-4 h-4 text-yellow-400" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'actions' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-shadowy-300">积分规则</h3>
            <button className="btn-primary">
              <PlusCircle className="w-4 h-4" />
              <span>新建规则</span>
            </button>
          </div>
          <div className="space-y-3">
            {actionRules.map((rule, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-dark">{rule.action}</h4>
                    <p className="text-sm text-shadowy-200">{rule.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-primary">+{rule.points}</span>
                  <div className="flex gap-1">
                    <button className="p-1 hover:bg-light rounded">
                      <Pencil className="w-4 h-4 text-shadowy-300" />
                    </button>
                    <button className="p-1 hover:bg-light rounded">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
