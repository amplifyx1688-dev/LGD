import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Gauge,
  Hand,
  Zap,
  Send,
  Bot,
  Award,
  FileEdit,
  Mail,
  BookMarked,
  CreditCard,
  TrendingUp,
  Lock,
  Settings,
  HelpCircle,
  Ticket,
  Link2,
  LogOut,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Menu,
  ArrowLeft,
} from 'lucide-react';

const menuGroups = [
  { label: '', items: [
    { path: '/dashboard', label: '仪表盘', icon: Gauge },
  ]},
  { label: '消息传递', items: [
    { path: '/welcomes', label: '欢迎消息', icon: Hand },
    { path: '/triggers', label: '自动回复', icon: Zap },
    { path: '/scheduled_messages', label: '定时消息', icon: Send },
  ]},
  { label: '工具', items: [
    { path: '/ai_chatbots', label: 'AI 聊天机器人', icon: Bot },
    { path: '/gamification', label: '游戏化', icon: Award },
    { path: '/summaries', label: '活动摘要', icon: FileEdit },
  ]},
  { label: '增长', items: [
    { path: '/invitations', label: '邀请', icon: Mail },
    { path: '/directory_listings', label: '目录列表', icon: BookMarked },
  ]},
  { label: '变现', items: [
    { path: '/stripe_connect', label: 'Stripe Connect', icon: CreditCard },
    { path: '/revenue_intelligence', label: '收入智能', icon: TrendingUp, locked: true },
  ]},
];

const userMenuItems = [
  { path: '/settings', label: '设置', icon: Settings },
  { path: '/billing_limits', label: '账单与限制', icon: CreditCard },
  { path: '/help_center', label: '帮助中心', icon: HelpCircle },
  { path: '/tickets', label: '支持工单', icon: Ticket },
  { path: '/referrals', label: '推荐', icon: Link2 },
  { path: '/subscribe', label: '订阅', icon: CreditCard },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const initials = user ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() : '?';

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile hamburger */}
      <div className="sticky top-0 z-30 flex shrink-0 items-center bg-white py-4 lg:py-0 px-4 lg:hidden">
        <button onClick={() => setMobileOpen(true)} className="text-shadowy-300">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-white shadow-xl lg:shadow-none transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Logo */}
          <div className="hidden lg:flex items-center px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="font-bold text-lg text-dark">Metricgram</span>
            </div>
          </div>

          {/* Mobile close */}
          <div className="flex items-center justify-end p-2 lg:hidden">
            <button onClick={() => setMobileOpen(false)} className="text-shadowy-300">
              <ArrowLeft className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-2 pb-2">
            {/* Group selector */}
            <div className="px-2 py-2">
              <div className="relative">
                <button
                  onClick={() => setGroupDropdownOpen(!groupDropdownOpen)}
                  className="flex items-center gap-3 w-full border-2 border-shadowy-100 rounded-full px-3 py-2 bg-white text-shadowy-300 transition hover:border-primary"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex-shrink-0" />
                  <span className="text-sm font-medium truncate flex-1 text-left">没钱没关系，哥做博弈养妳1.0</span>
                  <ChevronDown className={`w-3 h-3 text-shadowy-200 flex-shrink-0 transition ${groupDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {groupDropdownOpen && (
                  <div className="absolute left-0 top-full mt-1 w-full rounded-xl bg-white shadow-lg ring-1 ring-gray-200 py-1 z-50">
                    <button className="flex items-center gap-3 w-full px-3 py-2 text-left text-sm bg-blue-50 text-primary font-semibold">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex-shrink-0" />
                      <span className="truncate">没钱没关系，哥做博弈养妳1.0</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation items */}
            <ul className="space-y-0">
              {menuGroups.map((group, gi) => (
                <li key={gi}>
                  {group.label && (
                    <div className="text-xs font-medium px-3 pt-3 pb-1 text-shadowy-200">{group.label}</div>
                  )}
                  <ul>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.path);
                      return (
                        <li key={item.path}>
                          <Link
                            to={item.locked ? '#' : item.path}
                            onClick={() => { setMobileOpen(false); }}
                            className={`${active ? 'nav-item-active' : 'nav-item'} ${item.locked ? 'opacity-50' : ''}`}
                          >
                            <div className="flex items-center flex-1">
                              <Icon className="w-6 h-6" />
                              <span className="ml-2">{item.label}</span>
                            </div>
                            {item.locked && <Lock className="w-3 h-3 text-shadowy-200 ml-auto" />}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          </nav>

          {/* Feedback button */}
          <div className="px-3 pb-2">
            <button className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-primary rounded-lg border border-primary/20 bg-primary/5 transition hover:bg-primary/10">
              <MessageCircle className="w-4 h-4" />
              <span>发送反馈</span>
            </button>
          </div>

          {/* User menu */}
          <div className="relative border-t border-gray-200 px-2 py-3">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-3 w-full px-2 py-2 rounded-xl transition hover:bg-light text-left"
            >
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-white">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-dark truncate">{user?.first_name} {user?.last_name}</p>
                <p className="text-xs text-shadowy-200 truncate">{user?.username ? `@${user.username}` : user?.id}</p>
              </div>
              <ChevronUp className={`w-4 h-4 text-shadowy-200 flex-shrink-0 transition ${userMenuOpen ? '' : 'rotate-180'}`} />
            </button>

            {userMenuOpen && (
              <div className="absolute bottom-full mb-2 left-2 right-2 bg-white rounded-xl shadow-lg ring-1 ring-gray-200 py-2 z-50">
                {userMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-shadowy-300 hover:bg-light rounded-lg mx-1 transition"
                    >
                      <Icon className="w-4 h-4 text-shadowy-200" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
                <div className="border-t border-gray-200 mt-1 pt-1 mx-1">
                  <button
                    onClick={() => { logout(); navigate('/login'); }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>登出</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
