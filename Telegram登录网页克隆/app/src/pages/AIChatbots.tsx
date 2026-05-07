import { useState } from 'react';
import {
  PlusCircle,
  Search,
  MoreVertical,
} from 'lucide-react';

export default function AIChatbots() {
  const [query, setQuery] = useState('');

  return (
    <div className="pb-24">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
        <div className="min-w-0 flex-1">
          <h2 className="page-header">AI 聊天机器人</h2>
          <p className="page-description">
            在本节中，您可以将 OpenAI API 连接到您的 Telegram 群组，使您的用户能够与聊天机器人互动。
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <button className="btn-primary">
            <PlusCircle className="w-4 h-4" />
            <span>添加</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-shadowy-300">显示中</label>
          <select className="form-select">
            <option>10</option>
            <option>25</option>
            <option>50</option>
            <option>100</option>
          </select>
          <span className="text-sm text-shadowy-300">共 1</span>
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
              <th className="data-table th">密钥</th>
              <th className="data-table th">每日最大消息数</th>
              <th className="data-table th">话题</th>
              <th className="data-table th">提示</th>
              <th className="data-table th">助手</th>
              <th className="data-table th text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t hover:bg-gray-50 transition">
              <td className="data-table td">aigogo</td>
              <td className="data-table td">10</td>
              <td className="data-table td">通用主题</td>
              <td className="data-table td max-w-xs truncate">
                将此消息视为娛樂城市場調查經理的回答...
              </td>
              <td className="data-table td">-</td>
              <td className="data-table td text-right">
                <button className="inline-flex justify-center bg-white px-2 rounded-lg text-sm font-medium text-shadowy-300 hover:bg-shadowy-100">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
