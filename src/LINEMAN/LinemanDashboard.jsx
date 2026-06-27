import { useState } from 'react';

import ReportTab from './LinemanReportTab';
import NotificationTab from './LinemanNotificationTab'; 
import ProfileTab from './LinemanProfileTab';
import '../Lineman.css'; // <-- THE MAGIC FIX

import { List, Bell, User } from 'lucide-react';

function LinemanDashboard() {
  const [activeTab, setActiveTab] = useState('report');

  return (
    <div className="lineman-dashboard-layout">
      
      {/* The key={activeTab} and animate-tab-switch force the animation 
        to restart every time you change a tab! 
      */}
      <div key={activeTab} className="lineman-tab-content animate-tab-switch">
        {activeTab === 'report' && <ReportTab />}
        {activeTab === 'notification' && <NotificationTab />}
        {activeTab === 'profile' && <ProfileTab />}
      </div>

      {/* PERSISTENT BOTTOM NAVIGATION (Pill Design) */}
      <div className="bottom-nav-wrapper">
        <div className="pill-nav">
          <button 
            className={`nav-item ${activeTab === 'report' ? 'active' : ''}`}
            onClick={() => setActiveTab('report')}
          >
            <List size={24} strokeWidth={activeTab === 'report' ? 2.5 : 2} />
            <span>Report</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'notification' ? 'active' : ''}`}
            onClick={() => setActiveTab('notification')}
          >
            <Bell size={24} strokeWidth={activeTab === 'notification' ? 2.5 : 2} />
            <span>Notification</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={24} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
            <span>Profile</span>
          </button>
        </div>
      </div>

    </div>
  );
}

export default LinemanDashboard;