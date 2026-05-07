import { useState } from 'react';
import {
  PlusCircle,
  Search,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function AutoReply() {
  const [query, setQuery] = useState('');

  const triggers = [
    { id: 1, name: '问候', pattern: '你好|您好|hi|hello', response: '你好！欢迎加入我们的群组！有什么可以帮助您的吗？', active: true },
    { id: 2, name: '价格询问', pattern: '价格|多少钱|费用|收费', response: '请查看我们的价格页面或联系管理员获取详细报价。', active: true },
    { id: 3, name: '规则', pattern: '规则|制度|规定', response: '请遵守群组规则，文明交流，禁止广告和骚扰行为。', active: false },
  ];

  return (
    <div className="pb-24">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
        <div className="min-w-0 flex-1">
          <h2 className="page-header">自动回复</h2>
          <p className="page-description">
            创建关键词触发器，当用户在群组中发送包含特定关键词的消息时，自动回复预设内容。
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <button className="btn-primary">
            <PlusCircle className="w-4 h-4" />
            <span>新建触发器</span>
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
          </select>
          <span className="text-sm text-shadowy-300">共 {triggers.length}</span>
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
              <th className="data-table th">名称</th>
              <th className="data-table th">关键词模式</th>
              <th className="data-table th">回复内容</th>
              <th className="data-table th">状态</th>
              <th className="data-table th text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {triggers.map((t) => (
              <tr key={t.id} className="border-t hover:bg-gray-50 transition">
                <td className="data-table td font-medium">{t.name}</td>
                <td className="data-table td">
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs">{t.pattern}</code>
                </td>
                <td className="data-table td max-w-xs truncate">{t.response}</td>
                <td className="data-table td">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${t.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {t.active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {t.active ? '启用' : '停用'}
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
