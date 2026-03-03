import { Routes, Route } from 'react-router-dom';
import Dashboard from './components/dashboard/Dashboard';
import Overlay from './components/overlays/Overlay';
import MapsOverlay from './components/overlays/MapsOverlay';
import TeamRoster from './components/overlays/TeamRoster';
import TeamRoster6 from './components/overlays/TeamRoster6';
import ScheduleOverlay from './components/overlays/ScheduleOverlay';
import CastersOverlay from './components/overlays/CastersOverlay';
import GuestOverlay from './components/overlays/GuestOverlay';
import TwoGuestsOverlay from './components/overlays/TwoGuestsOverlay';
import OwBanOverlay from './components/overlays/OwBanOverlay';

export default function App() {
  return (
    <Routes>
      {/* Dashboard */}
      <Route path="/" element={<Dashboard />} />

      {/* Live overlay pages */}
      <Route path="/live/overlay" element={<Overlay />} />
      <Route path="/live/maps" element={<MapsOverlay />} />
      <Route path="/live/team1" element={<TeamRoster team={1} playerCount={5} />} />
      <Route path="/live/team2" element={<TeamRoster team={2} playerCount={5} />} />
      <Route path="/live/team1-6" element={<TeamRoster6 team={1} />} />
      <Route path="/live/team2-6" element={<TeamRoster6 team={2} />} />
      <Route path="/live/owban" element={<OwBanOverlay />} />

      {/* General overlay pages */}
      <Route path="/general/schedule" element={<ScheduleOverlay />} />
      <Route path="/general/2casters" element={<CastersOverlay />} />
      <Route path="/general/1guest" element={<GuestOverlay />} />
      <Route path="/general/2guests" element={<TwoGuestsOverlay />} />
    </Routes>
  );
}
