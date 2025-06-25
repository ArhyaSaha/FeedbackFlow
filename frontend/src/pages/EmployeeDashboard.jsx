import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import EmployeeHome from '../components/employee/EmployeeHome';
import ReceivedFeedback from '../components/employee/ReceivedFeedback';
import PeerFeedback from '../components/employee/PeerFeedback';
import Settings from '../components/employee/Settings';



const employeeNavItems = [
  { id: 'home', label: 'Home', path: '/employee' },
  { id: 'feedback', label: 'Received Feedback', path: '/employee/feedback' },
  { id: 'team', label: 'Peer Feedback', path: '/employee/peerfeedback' },
];

function EmployeeDashboard() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        navItems={employeeNavItems}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole="employee"
      />

      <div className="bg-gradient-to-br from-gray-50 to-indigo-50 flex-1 h-screen overflow-auto">
        <Routes>
          <Route path="/" element={<EmployeeHome />} />
          <Route path="/feedback" element={<ReceivedFeedback />} />
          <Route path="/peerfeedback" element={<PeerFeedback />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </div>
  );
}

export default EmployeeDashboard;