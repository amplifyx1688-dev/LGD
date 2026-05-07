import { useState } from 'react';
import {
  PlusCircle,
  Search,
  Pencil,
  Trash2,
  Clock,
  Play,
  Pause,
} from 'lucide-react';

export default function ScheduledMessages() {
  const [query, setQuery] = useState('');

  const messages = [
    { id: 1, content: '每日早安提醒：祝各位今天好心情！', schedule: '每天 09:00', status: 'active', topic: '通用主题' },
    { id: 2, content: '本周活动安排已发布，请查看置顶消息。', schedule: '每周一 10:00', status: 'paused', topic: '通用主题' },
  ];

  return (
    <div className="pb-24">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
        <div className="min-w-0 flex-1">
          <h2 className="page-header">定时消息</h2>
          <p className="page-description">
            设置定时消息，让机器人按预定时间自动发送消息到您的群组。
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <button className="btn-primary">
            <PlusCircle className="w-4 h-4" />
            <span>新建定时消息</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-shadowy-300">显示中</label>
          <select className="form-select">
            <option>10</option>
            <option>25</option>
          </select>
          <span className="text-sm text-shadowy-300">共 {messages.length}</span>
        </div>
        <div className="relative min-w-0 flex-grow max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-shadowy-200" />
          <input
            placeholder="搜索"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="form-input pl-10 w-full"
          />
        </div>
      </div>

      <div className="relative overflow-x-auto bg-white rounded-xl shadow-sm">
        <table className="w-full text-left text-sm text-gray-700">
          <thead className="border-b border-gray-200">
            <tr>
              <th className="data-table th">内容</th>
              <th className="data-table th">计划</th>
              <th className="data-table th">话题</th>
              <th className="data-table th">状态</th>
              <th className="data-table th text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {messages.map((m) => (
              <tr key={m.id} className="border-t hover:bg-gray-50 transition">
                <td className="data-table td max-w-xs truncate">{m.content}</td>
                <td className="data-table td">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-shadowy-200" />
                    {m.schedule}
                  </div>
                </td>
                <td className="data-table td">{m.topic}</td>
                <td className="data-table td">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${m.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {m.status === 'active' ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                    {m.status === 'active' ? '运行中' : '已暂停'}
                  </span>
                </td>
                <td className="data-table td text-right">
                  <div className="inline-flex gap-2">
                    <button className="p-1 hover:bg-light rounded">
                      <Pencil className="w-4 h-4 text-shadowy-300" />
                    </button>
                    <button className="p-1 hover:bg-light rounded">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
