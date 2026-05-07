import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, MessageCircle } from 'lucide-react';

export default function TelegramLogin() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { login, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      navigate('/dashboard');
      return;
    }

    // 模拟 Telegram Login Widget 回调
    // 实际使用时需要配置 bot 名称和回调地址
    const initWidget = () => {
      const container = containerRef.current;
      if (!container || !(window as any).Telegram) return;

      // 清除旧内容
      container.innerHTML = '';

      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.setAttribute('data-telegram-login', 'metricgram_bot');
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-radius', '8');
      script.setAttribute('data-request-access', 'write');
      script.setAttribute('data-userpic', 'true');
      script.setAttribute('data-lang', 'zh');
      script.setAttribute('data-onauth', 'onTelegramAuth(user)');
      script.async = true;

      (window as any).onTelegramAuth = (user: any) => {
        login(user);
        navigate('/dashboard');
      };

      container.appendChild(script);
    };

    // 延迟加载widget确保脚本已就绪
    const timer = setTimeout(initWidget, 500);
    return () => clearTimeout(timer);
  }, [isLoggedIn, login, navigate]);

  const handleDemoLogin = () => {
    setLoading(true);
    // 模拟Telegram用户数据
    setTimeout(() => {
      login({
        id: 123456789,
        first_name: 'Man',
        last_name: 'Na',
        username: 'mannan_tg',
        photo_url: 'https://ui-avatars.com/api/?name=Man+Na&background=3b82f6&color=fff',
        auth_date: Math.floor(Date.now() / 1000),
        hash: 'demo_hash_' + Date.now(),
      });
      setLoading(false);
      navigate('/dashboard');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-dark mb-2">Metricgram</h1>
          <p className="text-shadowy-200 mb-8">管理您的 Telegram 群组和社区</p>

          <div className="space-y-4">
            <div ref={containerRef} className="flex justify-center min-h-[40px]" />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-shadowy-200">或</span>
              </div>
            </div>

            <button
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full btn-primary justify-center py-3"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  登录中...
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4" />
                  使用 Telegram 登录 (演示)
                </>
              )}
            </button>
          </div>

          <p className="mt-6 text-xs text-shadowy-200">
            需要先在 Telegram 中创建 bot 并配置域名才能使用真实的登录功能
          </p>
        </div>
      </div>
    </div>
  );
}
