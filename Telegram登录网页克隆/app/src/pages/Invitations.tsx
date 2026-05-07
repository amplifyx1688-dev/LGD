import { useState } from 'react';
import {
  Mail,
  PlusCircle,
  Link2,
} from 'lucide-react';

export default function Invitations() {
  const [tab, setTab] = useState<'email' | 'links'>('email');

  return (
    <div className="pb-24">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
        <div className="min-w-0 flex-1">
          <h2 className="page-header">已发送的邀请</h2>
          <p className="page-description">
            发送到电子邮件地址的邀请列表。
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <button className="btn-primary">
            <PlusCircle className="w-4 h-4" />
            <span>发送邀请</span>
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setTab('email')}
          className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
            tab === 'email' ? 'bg-primary text-white shadow-md' : 'bg-white text-shadowy-300 ring-1 ring-inset ring-shadowy-100 hover:bg-light'
          }`}
        >
          <Mail className="w-4 h-4" />
          电子邮件邀请
        </button>
        <button
          onClick={() => setTab('links')}
          className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
            tab === 'links' ? 'bg-primary text-white shadow-md' : 'bg-white text-shadowy-300 ring-1 ring-inset ring-shadowy-100 hover:bg-light'
          }`}
        >
          <Link2 className="w-4 h-4" />
          可追踪链接
        </button>
      </div>

      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="card-metric">
            <div className="text-2xl font-medium">0</div>
            <div className="text-sm tracking-tight">待处理</div>
          </div>
          <div className="card-metric">
            <div className="text-2xl font-medium">0</div>
            <div className="text-sm tracking-tight">已发送</div>
          </div>
          <div className="card-metric">
            <div className="text-2xl font-medium">0</div>
            <div className="text-sm tracking-tight">错误</div>
          </div>
        </div>
      </div>

      <div className="text-center bg-white rounded-xl p-8">
        <Mail className="mx-auto h-12 w-12 text-primary/40 text-6xl" />
        <h3 className="mt-2 text-lg font-semibold text-primary">
          未发送任何邀请
        </h3>
        <p className="mt-3 text-sm text-shadowy-200">
          向您的用户发送新邀请。
        </p>
        <div className="mt-6">
          <button className="btn-primary">
            <PlusCircle className="w-4 h-4" />
            <span>发送邀请</span>
          </button>
        </div>
      </div>
    </div>
  );
}
