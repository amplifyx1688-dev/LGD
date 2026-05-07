import { useState } from 'react';
import {
  Save,
  Eye,
  Info,
} from 'lucide-react';

export default function WelcomeMessage() {
  const [active, setActive] = useState(true);
  const [message, setMessage] = useState('');

  return (
    <div className="pb-24">
      <h2 className="page-header">欢迎消息</h2>
      <p className="page-description">
        编辑群组欢迎消息。您可以在消息中插入 <code className="bg-gray-100 px-1 rounded">#user_name</code> 作为用户名占位符。
      </p>

      <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-shadowy-300">消息设置</h3>
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
            <label className="block text-sm font-medium text-shadowy-300 mb-2">欢迎消息</label>
            <textarea
              rows={6}
              placeholder="在此输入您的欢迎消息..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="form-textarea"
            />
          </div>

          <div className="flex items-center gap-2 text-sm text-shadowy-200">
            <Info className="w-4 h-4" />
            <span>插入 <code className="bg-gray-100 px-1 rounded">#user_name</code> 来自动替换为用户名称</span>
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
    </div>
  );
}
