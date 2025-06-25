import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ManagerHome from '../components/manager/ManagerHome';
import GivenFeedback from '../components/manager/GivenFeedback';
import MyTeam from '../components/manager/MyTeam';

const managerNavItems = [
  { id: 'home', label: 'Home', path: '/manager' },
  { id: 'feedback', label: 'Given Feedback', path: '/manager/feedback' },
  { id: 'team', label: 'My Team', path: '/manager/team' },
];

function ManagerDashboard() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        navItems={managerNavItems}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole="manager"
      />

      <div className="bg-gradient-to-br from-gray-50 to-indigo-50 flex-1 h-screen overflow-auto">
        <Routes>
          <Route path="/" element={<ManagerHome />} />
          <Route path="feedback" element={<GivenFeedback />} />
          <Route path="team" element={<MyTeam />} />
        </Routes>
      </div>
    </div>
  );
}

export default ManagerDashboard;