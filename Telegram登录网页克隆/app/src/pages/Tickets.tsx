import { useState } from 'react';
import {
  PlusCircle,
} from 'lucide-react';

export default function Tickets() {
  const [filter, setFilter] = useState('all');

  const tickets = [
    { id: 1, subject: '无法连接 Telegram 群组', status: 'open', priority: 'high', created: '2026/05/01', lastUpdate: '2小时前' },
    { id: 2, subject: 'AI 机器人回复异常', status: 'pending', priority: 'medium', created: '2026/04/28', lastUpdate: '1天前' },
    { id: 3, subject: '统计数据不准确', status: 'resolved', priority: 'low', created: '2026/04/25', lastUpdate: '3天前' },
    { id: 4, subject: '如何导出用户数据', status: 'closed', priority: 'low', created: '2026/04/20', lastUpdate: '1周前' },
  ];

  const statusColors: Record<string, string> = {
    open: 'bg-blue-100 text-blue-700',
    pending: 'bg-yellow-100 text-yellow-700',
    resolved: 'bg-green-100 text-green-700',
    closed: 'bg-gray-100 text-gray-500',
  };

  const priorityColors: Record<string, string> = {
    high: 'text-red-600',
    medium: 'text-yellow-600',
    low: 'text-green-600',
  };

  const filteredTickets = filter === 'all' ? tickets : tickets.filter(t => t.status === filter);

  return (
    <div className="pb-24">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
        <div className="min-w-0 flex-1">
          <h2 className="page-header">支持工单</h2>
          <p className="page-description">
            查看和管理您的支持工单。
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <button className="btn-primary">
            <PlusCircle className="w-4 h-4" />
            <span>新建工单</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {[
          { key: 'all', label: '全部' },
          { key: 'open', label: '待处理' },
          { key: 'pending', label: '处理中' },
          { key: 'resolved', label: '已解决' },
          { key: 'closed', label: '已关闭' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
              filter === f.key
                ? 'bg-primary text-white'
                : 'bg-white text-shadowy-300 hover:bg-light'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="relative overflow-x-auto bg-white rounded-xl shadow-sm">
        <table className="w-full text-left text-sm text-gray-700">
          <thead className="border-b border-gray-200">
            <tr>
              <th className="data-table th">工单号</th>
              <th className="data-table th">主题</th>
              <th className="data-table th">状态</th>
              <th className="data-table th">优先级</th>
              <th className="data-table th">创建时间</th>
              <th className="data-table th">最后更新</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.map((t) => (
              <tr key={t.id} className="border-t hover:bg-gray-50 transition cursor-pointer">
                <td className="data-table td font-medium">#{t.id}</td>
                <td className="data-table td">{t.subject}</td>
                <td className="data-table td">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[t.status]}`}>
                    {t.status === 'open' && '待处理'}
                    {t.status === 'pending' && '处理中'}
                    {t.status === 'resolved' && '已解决'}
                    {t.status === 'closed' && '已关闭'}
                  </span>
                </td>
                <td className={`data-table td font-medium ${priorityColors[t.priority]}`}>
                  {t.priority === 'high' && '高'}
                  {t.priority === 'medium' && '中'}
                  {t.priority === 'low' && '低'}
                </td>
                <td className="data-table td text-shadowy-200">{t.created}</td>
                <td className="data-table td text-shadowy-200">{t.lastUpdate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
