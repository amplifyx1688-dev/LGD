import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import TelegramLogin from '@/pages/TelegramLogin';
import Dashboard from '@/pages/Dashboard';
import AIChatbots from '@/pages/AIChatbots';
import WelcomeMessage from '@/pages/WelcomeMessage';
import AutoReply from '@/pages/AutoReply';
import ScheduledMessages from '@/pages/ScheduledMessages';
import Settings from '@/pages/Settings';
import Invitations from '@/pages/Invitations';
import Gamification from '@/pages/Gamification';
import ActivitySummary from '@/pages/ActivitySummary';
import DirectoryListings from '@/pages/DirectoryListings';
import HelpCenter from '@/pages/HelpCenter';
import BillingLimits from '@/pages/BillingLimits';
import Tickets from '@/pages/Tickets';
import Referrals from '@/pages/Referrals';
import Subscribe from '@/pages/Subscribe';
import StripeConnect from '@/pages/StripeConnect';
import RevenueIntelligence from '@/pages/RevenueIntelligence';

function Layout() {
  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1 min-w-0 h-screen overflow-y-auto bg-light">
        <div className="p-4 lg:p-6 min-h-full">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/ai_chatbots" element={<AIChatbots />} />
            <Route path="/welcomes" element={<WelcomeMessage />} />
            <Route path="/triggers" element={<AutoReply />} />
            <Route path="/scheduled_messages" element={<ScheduledMessages />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/invitations" element={<Invitations />} />
            <Route path="/gamification" element={<Gamification />} />
            <Route path="/summaries" element={<ActivitySummary />} />
            <Route path="/directory_listings" element={<DirectoryListings />} />
            <Route path="/help_center" element={<HelpCenter />} />
            <Route path="/billing_limits" element={<BillingLimits />} />
            <Route path="/tickets" element={<Tickets />} />
            <Route path="/referrals" element={<Referrals />} />
            <Route path="/subscribe" element={<Subscribe />} />
            <Route path="/stripe_connect" element={<StripeConnect />} />
            <Route path="/revenue_intelligence" element={<RevenueIntelligence />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function App() {
  const { isLoggedIn } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <TelegramLogin />} />
      <Route path="/*" element={isLoggedIn ? <Layout /> : <Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
