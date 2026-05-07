import { useState } from 'react';
import {
  Search,
  ChevronDown,
  MessageCircle,
  ExternalLink,
  BookOpen,
  FileText,
} from 'lucide-react';

export default function HelpCenter() {
  const [search, setSearch] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      question: '如何连接我的 Telegram 群组？',
      answer: '首先，在 Metricgram 中创建账户并登录。然后，点击"连接 Telegram 账户"按钮，按照提示将 Metricgram 机器人添加为您的群组管理员。',
    },
    {
      question: '如何设置欢迎消息？',
      answer: '导航到"消息传递 > 欢迎消息"页面，启用欢迎消息功能，并在文本框中输入您想要发送的内容。您可以使用 #user_name 作为用户名占位符。',
    },
    {
      question: '自动回复支持哪些关键词模式？',
      answer: '自动回复支持正则表达式匹配。您可以使用 | 分隔多个关键词，例如 "你好|您好|hi|hello"。',
    },
    {
      question: '如何查看群组统计数据？',
      answer: '在仪表盘页面，您可以看到群组的消息数、活跃用户数、加入/离开用户数等关键指标。您还可以按日、周、月查看历史趋势。',
    },
    {
      question: 'AI 聊天机器人如何工作？',
      answer: '您需要提供 OpenAI API 密钥，并设置聊天机器人的提示词和话题。机器人会根据配置自动回复群组中的消息。',
    },
    {
      question: '如何邀请新成员加入群组？',
      answer: '使用"增长 > 邀请"功能，您可以发送电子邮件邀请或生成可追踪的邀请链接。',
    },
  ];

  const categories = [
    { name: '快速入门', icon: BookOpen, description: '新用户指南和基础设置' },
    { name: '消息功能', icon: MessageCircle, description: '欢迎消息、自动回复、定时消息' },
    { name: 'AI 工具', icon: FileText, description: '聊天机器人配置和使用' },
    { name: '数据分析', icon: FileText, description: '仪表盘、报告和统计' },
    { name: '变现功能', icon: FileText, description: 'Stripe 连接和收入管理' },
    { name: '账户设置', icon: FileText, description: '个人资料和偏好设置' },
  ];

  return (
    <div className="pb-24">
      <div className="text-center mb-8">
        <h2 className="page-header">帮助中心</h2>
        <p className="page-description">
          查找常见问题的答案，或浏览我们的文档以了解更多信息。
        </p>
      </div>

      {/* Search */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-shadowy-200" />
          <input
            placeholder="搜索问题或关键词..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-12 py-4 text-lg w-full"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {categories.map((cat, idx) => {
          const Icon = cat.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition cursor-pointer"
            >
              <Icon className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold text-dark mb-1">{cat.name}</h3>
              <p className="text-sm text-shadowy-200">{cat.description}</p>
            </div>
          );
        })}
      </div>

      {/* FAQs */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-shadowy-300 mb-4">常见问题</h3>
        <div className="space-y-2">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border border-gray-100 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-light transition"
              >
                <span className="font-medium text-shadowy-300">{faq.question}</span>
                <ChevronDown className={`w-4 h-4 text-shadowy-200 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === idx && (
                <div className="px-4 pb-4 text-sm text-shadowy-200 leading-relaxed">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="mt-8 bg-primary/5 rounded-xl p-6 border border-primary/20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-dark mb-1">还需要帮助？</h3>
            <p className="text-sm text-shadowy-200">我们的支持团队随时为您提供帮助。</p>
          </div>
          <div className="flex gap-3">
            <button className="btn-primary">
              <MessageCircle className="w-4 h-4" />
              <span>联系支持</span>
            </button>
            <button className="btn-secondary">
              <ExternalLink className="w-4 h-4" />
              <span>查看文档</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
