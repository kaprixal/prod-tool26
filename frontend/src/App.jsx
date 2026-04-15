import { Routes, Route } from 'react-router-dom';
import Dashboard from './components/dashboard/Dashboard';
import Overlay from './components/overlays/Overlay';
import MapsOverlay from './components/overlays/MapsOverlay';
import TeamRoster from './components/overlays/TeamRoster';
import ScheduleOverlay from './components/overlays/ScheduleOverlay';
import CastersOverlay from './components/overlays/CastersOverlay';
import GuestOverlay from './components/overlays/GuestOverlay';
import TwoGuestsOverlay from './components/overlays/TwoGuestsOverlay';
import OwBanOverlay from './components/overlays/OwBanOverlay';
import AnimateLogoOverlay from './components/overlays/AnimateLogoOverlay';
import PanelOverlay from './components/overlays/PanelOverlay';
import PanelOverlaySchedule from './components/overlays/PanelOverlaySchedule';
export default function App() {
  return (
    <Routes>
      {/* Dashboard */}
      <Route path="/" element={<Dashboard />} />

      {/* Live overlay pages */}
      <Route path="/live/overlay" element={<Overlay />} />
      <Route path="/live/maps" element={<MapsOverlay />} />
      <Route path="/animatelogo" element={<AnimateLogoOverlay />} />
      <Route path="/live/team1" element={<TeamRoster team={1} />} />
      <Route path="/live/team2" element={<TeamRoster team={2} />} />
      <Route path="/live/owban" element={<OwBanOverlay />} />

      {/* General overlay pages */}
      <Route path="/general/schedule" element={<ScheduleOverlay />} />
      <Route path="/general/2casters" element={<CastersOverlay />} />
      <Route path="/general/1guest" element={<GuestOverlay />} />
      <Route path="/general/2guests" element={<TwoGuestsOverlay />} />

      {/* Panel overlays (2–6 panelists, standard + rankdle) */}
      <Route path="/panels/schedule" element={<PanelOverlaySchedule />} />
      <Route path="/panels/2panel" element={<PanelOverlay count={2} variant="standard" />} />
      <Route path="/panels/2panel-rankdle" element={<PanelOverlay count={2} variant="rankdle" />} />
      <Route path="/panels/3panel" element={<PanelOverlay count={3} variant="standard" />} />
      <Route path="/panels/3panel-rankdle" element={<PanelOverlay count={3} variant="rankdle" />} />
      <Route path="/panels/4panel" element={<PanelOverlay count={4} variant="standard" />} />
      <Route path="/panels/4panel-rankdle" element={<PanelOverlay count={4} variant="rankdle" />} />
      <Route path="/panels/5panel" element={<PanelOverlay count={5} variant="standard" />} />
      <Route path="/panels/5panel-rankdle" element={<PanelOverlay count={5} variant="rankdle" />} />
      <Route path="/panels/6panel" element={<PanelOverlay count={6} variant="standard" />} />
      <Route path="/panels/6panel-rankdle" element={<PanelOverlay count={6} variant="rankdle" />} />
    </Routes>
  );
}
