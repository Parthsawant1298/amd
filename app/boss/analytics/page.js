// app/boss/analytics/page.js
import BossAnalytics from '@/components/boss/BossAnalytics';
import BossNavbar from '@/components/boss/BossNavbar';

export default function AnalyticsPage() {
  return (
    <main>
      <BossNavbar />
      <BossAnalytics />
    </main>
  );
}