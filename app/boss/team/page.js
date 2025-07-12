// app/boss/team/page.js
import BossTeamPage from '@/components/boss/BossTeam';
import BossNavbar from '@/components/boss/BossNavbar';

export default function TeamManagement() {
  return (
    <main>
      <BossNavbar />
      <BossTeamPage />
    </main>
  );
}