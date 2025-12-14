import React, { useState, useEffect } from 'react';
import { Calendar, CreditCard, Mail, Phone, ChevronLeft, ChevronRight } from 'lucide-react';
import CheckInOutModal from './CheckInOutModal'; // Adjust path if needed
import MainPage from '../../component/layout/MainPage';
import { request } from '../../util/helper';
import { getProfile } from '../../store/profile.store';

const AttendanceDashboard = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('checkin');
  const [loading, setLoading] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [attendanceSummary, setAttendanceSummary] = useState({
    present: 0,
    absent: 0,
    permission: 0,
    late: 0
  });

  // Get userId from profile
  const { id: userId, name, address, tel, email } = getProfile() || {};

  useEffect(() => {
    if (!userId) return;

    const fetchAttendanceSummary = async () => {
      const res = await request(`attendance/summary/${userId}`, "get");
      if (res) setAttendanceSummary(res);
    };

    const fetchTodayStatus = async () => {
      const today = new Date().toISOString().split("T")[0];
      const res = await request(`attendance/status/${userId}?date=${today}`, "get");
      setIsCheckedIn(res?.check_in_time && !res?.check_out_time);
    };

    fetchAttendanceSummary();
    fetchTodayStatus();
  }, [userId]);

  const handleCheckInOut = () => {
    setModalType(isCheckedIn ? 'checkout' : 'checkin');
    setModalOpen(true);
  };

  // Fixed: Use correct endpoints for check-in and check-out
  const handleModalSubmit = async (note) => {
    if (!userId) return;
    
    setLoading(true);
    
    try {
      let response;
      
      if (modalType === 'checkin') {
        response = await request(`attendance/${userId}/checkin`, "post", { note: note || "" });
        setIsCheckedIn(true);
      } else {
        response = await request(`attendance/${userId}/checkout`, "post", { note: note || "" });
        setIsCheckedIn(false);
      }
      
      setModalOpen(false);
      alert(response?.message || `${modalType} successful!`);
      
      // Refresh attendance summary after check-in/out
      const summaryRes = await request(`attendance/summary/${userId}`, "get");
      if (summaryRes) setAttendanceSummary(summaryRes);
      
    } catch (err) {
      console.error(`Error submitting ${modalType}:`, err);
      alert(`Failed to ${modalType}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const khmerDays = ['អាទិត្យ', 'ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];
  const khmerMonths = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const days = Array.from({ length: 31 }, (_, i) => ({ date: i + 1 }));
  const today = new Date().toISOString().split('T')[0];

  return (
    <MainPage loading={loading}>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">ប្រព័ន្ធគ្រប់គ្រងអំពើអត្តនាម</h1>
            <p className="text-sm text-gray-600">ការគ្រប់គ្រងវត្តមាន</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">{today}</div>
          </div>
        </div>

        <div className="flex">
          <div className="w-80 bg-white border-r border-gray-200 p-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-blue-500 rounded-full mx-auto mb-4 overflow-hidden"></div>
              <h2 className="text-lg font-semibold">{name || "N/A"}</h2>
              <p className="text-sm text-gray-600">{address || "N/A"}</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-600"><CreditCard className="w-4 h-4 mr-2" />{userId || "N/A"}</div>
              <div className="flex items-center text-sm text-gray-600"><Mail className="w-4 h-4 mr-2" />{email || "N/A"}</div>
              <div className="flex items-center text-sm text-gray-600"><Phone className="w-4 h-4 mr-2" />{tel || "N/A"}</div>
            </div>

            <button 
              onClick={handleCheckInOut} 
              disabled={loading}
              className={`w-full mt-4 ${isCheckedIn ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white py-3 rounded-lg transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'កំពុងដំណើរការ...' : (isCheckedIn ? 'ចេញពីការងារ' : 'ចូលធ្វើការ')}
            </button>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">សង្ខេបវត្តមាន</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-green-100 p-2 text-center rounded">{attendanceSummary.present} ចូលរៀន</div>
                <div className="bg-red-100 p-2 text-center rounded">{attendanceSummary.absent} អវត្តមាន</div>
                <div className="bg-yellow-100 p-2 text-center rounded">{attendanceSummary.permission} ច្បាប់</div>
                <div className="bg-blue-100 p-2 text-center rounded">{attendanceSummary.late} ចូលយឺត</div>
              </div>
            </div>
          </div>

          <div className="flex-1 p-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <button onClick={() => navigateMonth(-1)}><ChevronLeft /></button>
                <h2 className="text-xl font-bold">{khmerMonths[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
                <button onClick={() => navigateMonth(1)}><ChevronRight /></button>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {khmerDays.map(day => (
                  <div key={day} className="text-sm text-center font-medium p-2">{day}</div>
                ))}
                {days.map((d, i) => (
                  <div key={i} className="border text-center text-sm p-2 hover:bg-gray-50">{d.date}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <CheckInOutModal 
        isOpen={modalOpen} 
        type={modalType} 
        onClose={() => setModalOpen(false)} 
        onSubmit={handleModalSubmit} 
      />
    </MainPage>
  );
};

export default AttendanceDashboard;