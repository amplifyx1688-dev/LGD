import { useState } from 'react';
import {
  Save,
  Globe,
  Bell,
  Shield,
  Key,
  AlertTriangle,
} from 'lucide-react';

export default function Settings() {
  const [language, setLanguage] = useState('zh');
  const [notifications, setNotifications] = useState(true);
  const [timezone, setTimezone] = useState('Asia/Shanghai');

  return (
    <div className="pb-24">
      <h2 className="page-header">设置</h2>
      <p className="page-description">
        管理您的账户设置和偏好。
      </p>

      <div className="mt-6 space-y-6">
        {/* Profile */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-shadowy-300 mb-4">个人资料</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-shadowy-300 mb-2">名字</label>
              <input className="form-input" defaultValue="Man" />
            </div>
            <div>
              <label className="block text-sm font-medium text-shadowy-300 mb-2">姓氏</label>
              <input className="form-input" defaultValue="Na" />
            </div>
            <div>
              <label className="block text-sm font-medium text-shadowy-300 mb-2">邮箱</label>
              <input className="form-input" defaultValue="naman19951231@gmail.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-shadowy-300 mb-2">时区</label>
              <select className="form-select w-full" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                <option value="Asia/Shanghai">Asia/Shanghai</option>
                <option value="Asia/Tokyo">Asia/Tokyo</option>
                <option value="Asia/Singapore">Asia/Singapore</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-shadowy-300 mb-4">偏好设置</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-shadowy-200" />
                <div>
                  <p className="text-sm font-medium text-shadowy-300">语言</p>
                  <p className="text-xs text-shadowy-200">选择界面语言</p>
                </div>
              </div>
              <select className="form-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="zh">中文</option>
                <option value="en">English</option>
                <option value="ja">日本語</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-shadowy-200" />
                <div>
                  <p className="text-sm font-medium text-shadowy-300">通知</p>
                  <p className="text-xs text-shadowy-200">接收邮件和推送通知</p>
                </div>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications ? 'bg-primary' : 'bg-shadowy-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-shadowy-300 mb-4">安全</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Key className="w-5 h-5 text-shadowy-200" />
                <div>
                  <p className="text-sm font-medium text-shadowy-300">更改密码</p>
                  <p className="text-xs text-shadowy-200">定期更新您的密码以保证安全</p>
                </div>
              </div>
              <button className="btn-secondary text-sm">修改</button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-shadowy-200" />
                <div>
                  <p className="text-sm font-medium text-shadowy-300">双重验证</p>
                  <p className="text-xs text-shadowy-200">为您的账户添加额外的安全层</p>
                </div>
              </div>
              <button className="btn-secondary text-sm">启用</button>
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-red-200">
          <h3 className="text-lg font-semibold text-red-600 mb-4">危险区域</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm font-medium text-red-600">删除账户</p>
                <p className="text-xs text-red-400">此操作不可逆，所有数据将被永久删除</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition">
              删除账户
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button className="btn-primary">
            <Save className="w-4 h-4" />
            <span>保存更改</span>
          </button>
        </div>
      </div>
    </div>
  );
}
