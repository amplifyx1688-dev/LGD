import { useState } from 'react';
import {
  CreditCard,
  PlusCircle,
  Check,
  ExternalLink,
  DollarSign,
  Users,
  Receipt,
  Wallet,
} from 'lucide-react';

export default function StripeConnect() {
  const [connected, setConnected] = useState(false);

  return (
    <div className="pb-24">
      <h2 className="page-header">Stripe Connect</h2>
      <p className="page-description">
        连接您的 Stripe 账户，开始通过 Telegram 群组实现变现。
      </p>

      {!connected ? (
        <div className="mt-6 bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-dark mb-2">连接 Stripe 账户</h3>
          <p className="text-shadowy-200 mb-6 max-w-md mx-auto">
            连接 Stripe 后，您可以收取订阅费用、接受打赏、销售数字产品等。
            所有交易由 Stripe 安全处理。
          </p>
          <button
            onClick={() => setConnected(true)}
            className="btn-primary"
          >
            <ExternalLink className="w-4 h-4" />
            <span>连接 Stripe</span>
          </button>
          <p className="text-xs text-shadowy-200 mt-4">
            您将被重定向到 Stripe 完成授权流程
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 text-primary mb-2">
                <DollarSign className="w-5 h-5" />
                <span className="text-sm font-medium">总收入</span>
              </div>
              <div className="text-2xl font-bold text-dark">¥0</div>
              <div className="text-xs text-shadowy-200 mt-1">累计收入</div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 text-primary mb-2">
                <Receipt className="w-5 h-5" />
                <span className="text-sm font-medium">本月收入</span>
              </div>
              <div className="text-2xl font-bold text-dark">¥0</div>
              <div className="text-xs text-shadowy-200 mt-1">较上月 --</div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 text-primary mb-2">
                <Users className="w-5 h-5" />
                <span className="text-sm font-medium">付费用户</span>
              </div>
              <div className="text-2xl font-bold text-dark">0</div>
              <div className="text-xs text-shadowy-200 mt-1">占总用户 0%</div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 text-primary mb-2">
                <Wallet className="w-5 h-5" />
                <span className="text-sm font-medium">待结算</span>
              </div>
              <div className="text-2xl font-bold text-dark">¥0</div>
              <div className="text-xs text-shadowy-200 mt-1">预计 2-7 天到账</div>
            </div>
          </div>

          {/* Connected account info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-dark">Stripe 已连接</h3>
                  <p className="text-sm text-shadowy-200">账户状态：活跃</p>
                </div>
              </div>
              <button
                onClick={() => setConnected(false)}
                className="text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg text-sm transition"
              >
                断开连接
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-shadowy-300 mb-1">账户 ID</label>
                <input className="form-input" defaultValue="acct_***1234" readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium text-shadowy-300 mb-1">货币</label>
                <input className="form-input" defaultValue="CNY" readOnly />
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-shadowy-300">产品 & 订阅</h3>
              <button className="btn-primary">
                <PlusCircle className="w-4 h-4" />
                <span>新建产品</span>
              </button>
            </div>
            <div className="text-center py-8">
              <Receipt className="w-12 h-12 text-shadowy-200 mx-auto mb-3" />
              <p className="text-shadowy-300">还没有创建任何产品</p>
              <p className="text-sm text-shadowy-200 mt-1">创建您的第一个订阅计划或一次性产品</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
