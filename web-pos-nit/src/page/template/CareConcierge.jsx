
import React from 'react';
import {
    AppstoreOutlined,
    CalendarOutlined,
    ClockCircleOutlined,
    TeamOutlined,
    SearchOutlined,
    PlusOutlined,
    MoreOutlined
} from '@ant-design/icons';
import { Avatar, Button, Card, Badge, Progress } from 'antd';
import './CareConcierge.css';

const CareConcierge = () => {
    return (
        <div className="care-container font-sans bg-gray-100 flex h-screen text-gray-800 overflow-hidden p-6">
            {/* Main Wrapper with rounded corners (Simulation of the screen container) */}
            <div className="bg-[#f0f2f5] w-full h-full rounded-[40px] flex overflow-hidden shadow-2xl relative">

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col min-w-0 p-8 overflow-y-auto">

                    {/* Header / Nav */}
                    <header className="flex justify-between items-center mb-10">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">M</div>
                            <span className="text-xl font-bold text-blue-900">Care<br /><span className="text-xs font-normal text-blue-500">Concierge</span></span>
                        </div>

                        <div className="bg-white rounded-full p-1.5 flex shadow-sm">
                            <NavPill icon={<AppstoreOutlined />} label="Dashboard" active />
                            <NavPill icon={<CalendarOutlined />} label="Schedule" />
                            <NavPill icon={<ClockCircleOutlined />} label="Appointments" />
                            <NavPill icon={<TeamOutlined />} label="Patients" />
                        </div>

                        <Button shape="circle" icon={<SearchOutlined />} size="large" className="bg-white border-none shadow-sm text-gray-400" />
                    </header>

                    {/* Welcome Section */}
                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <h1 className="text-5xl font-bold text-gray-900 mb-2">Welcome back, John</h1>
                            <p className="text-gray-400">Here are the latest updates from the past 7 days.</p>
                        </div>
                        <Button type="primary" shape="round" icon={<PlusOutlined />} size="large" className="bg-blue-600 hover:bg-blue-500 border-none px-6 h-12 text-sm font-semibold">
                            Automation
                        </Button>
                    </div>

                    {/* Stats Cards Row */}
                    <div className="grid grid-cols-3 gap-6 mb-8">
                        {/* Card 1 - White */}
                        <div className="bg-white p-6 rounded-[30px] shadow-sm flex flex-col justify-between h-56">
                            <div className="flex justify-between items-start">
                                <div className="text-gray-400 text-xs">Total Patients</div>
                                <div className="bg-gray-100 px-3 py-1 rounded-full text-[10px] font-bold text-gray-500 cursor-pointer">View Report</div>
                            </div>
                            <div>
                                <div className="text-5xl font-bold mb-2">92</div>
                                <div className="text-xs text-green-500 flex items-center gap-1 font-bold">
                                    ↓ 10% <span className="text-gray-400 font-normal">vs last month</span>
                                </div>
                            </div>
                            <div className="h-10 flex items-end gap-1">
                                {[30, 50, 40, 60, 30, 50, 40, 70, 40, 60].map((h, i) => (
                                    <div key={i} className={`flex-1 rounded-full ${i === 8 ? 'bg-blue-600' : 'bg-gray-100'}`} style={{ height: `${h}%` }}></div>
                                ))}
                            </div>
                        </div>

                        {/* Card 2 - Blue (Active) */}
                        <div className="bg-blue-600 p-6 rounded-[30px] shadow-lg shadow-blue-200 flex flex-col justify-between h-56 text-white relative overflow-hidden">
                            <div className="flex justify-between items-start relative z-10">
                                <div className="text-blue-200 text-xs">Total Patients</div>
                                <div className="bg-blue-500/50 px-3 py-1 rounded-full text-[10px] font-bold text-blue-100 cursor-pointer">View Report</div>
                            </div>
                            <div className="relative z-10">
                                <div className="text-5xl font-bold mb-2">156</div>
                                <div className="text-xs text-blue-200 flex items-center gap-1 font-bold">
                                    ↑ 40% <span className="text-blue-300/70 font-normal">vs last month</span>
                                </div>
                            </div>
                            <div className="h-12 flex items-end gap-1 relative z-10">
                                {[30, 40, 35, 50, 45, 60, 40, 50, 30, 40].map((h, i) => (
                                    <div key={i} className={`flex-1 rounded-full ${i === 8 ? 'bg-[#fbbf24]' : 'bg-blue-500'}`} style={{ height: `${h}%` }}></div>
                                ))}
                            </div>
                        </div>

                        {/* Card 3 - White with Pattern */}
                        <div className="bg-white p-6 rounded-[30px] shadow-sm flex flex-col justify-between h-56">
                            <div className="flex justify-between items-start">
                                <div className="text-gray-400 text-xs">Total Patients</div>
                                <div className="bg-gray-100 px-3 py-1 rounded-full text-[10px] font-bold text-gray-500 cursor-pointer">View Report</div>
                            </div>
                            <div>
                                <div className="text-5xl font-bold mb-2">63</div>
                                <div className="text-xs text-green-500 flex items-center gap-1 font-bold">
                                    ↑ 20% <span className="text-gray-400 font-normal">vs last month</span>
                                </div>
                            </div>
                            <div className="bg-blue-50 rounded-2xl p-4 flex items-center gap-4 h-16">
                                <div className="h-full w-24 bg-[url('https://www.transparenttextures.com/patterns/diagonal-striped-brick.png')] opacity-30"></div>
                                <div className="text-2xl font-bold text-blue-600">40%</div>
                            </div>
                        </div>
                    </div>

                    {/* Large Chart Section */}
                    <div className="bg-white rounded-[40px] p-8 shadow-sm flex-1">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-bold">Appointments</h2>
                                <p className="text-xs text-gray-400">Oct 01, 2025 - Oct 07, 2025</p>
                            </div>
                            <div className="text-xs font-bold text-gray-400 cursor-pointer">Select Range ▼</div>
                        </div>

                        <div className="h-48 relative">
                            {/* Chart Grid Lines */}
                            <div className="absolute inset-0 flex flex-col justify-between text-xs text-gray-300 font-semibold">
                                <div>$10K -</div>
                                <div>$8K -</div>
                                <div>$6K -</div>
                                <div>$4K -</div>
                            </div>

                            {/* Chart Balls (Simulation) */}
                            <div className="absolute inset-0 pl-10 pt-2 flex justify-around items-end">
                                <ChartColumn h={20} />
                                <ChartColumn h={40} />
                                <ChartColumn h={30} />
                                <ChartColumn h={60} />
                                <ChartColumn h={100} active />
                                <ChartColumn h={50} />
                                <ChartColumn h={80} />
                                <ChartColumn h={30} />
                            </div>
                        </div>
                    </div>

                </main>

                {/* Right Sidebar */}
                <aside className="w-80 bg-white p-6 flex flex-col gap-6 border-l border-gray-100 overflow-y-auto">
                    {/* Task Section */}
                    <div>
                        <h3 className="font-bold text-lg mb-4">Task</h3>
                        <div className="space-y-3">
                            <TaskCard title="Review patient reports" time="10:00 AM - 10:30 AM" users={['https://i.pravatar.cc/150?img=12', 'https://i.pravatar.cc/150?img=13', '+5']} />
                            <TaskCard title="Noble prize" time="12:00 PM - 12:30 PM" users={['https://i.pravatar.cc/150?img=14', 'https://i.pravatar.cc/150?img=15', '+4']} />
                        </div>
                    </div>

                    {/* Next Patient */}
                    <div className="bg-gray-50 rounded-[30px] p-5">
                        <h3 className="font-bold text-lg mb-4">Next Patient Details</h3>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="relative">
                                <Avatar size={50} src="https://i.pravatar.cc/150?img=60" />
                                <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full">
                                    <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                </div>
                            </div>
                            <div>
                                <div className="font-bold text-gray-800">James Brown</div>
                                <div className="text-xs text-gray-400">11:00 AM</div>
                            </div>
                            <div className="ml-auto bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-1 rounded-full">Consultation</div>
                        </div>

                        <div className="grid grid-cols-2 gap-y-4 text-xs">
                            <div className="text-gray-400">Patient ID</div>
                            <div className="text-right font-bold text-gray-800">HT5242</div>

                            <div className="text-gray-400">Gender</div>
                            <div className="text-right font-bold text-gray-800">Male</div>

                            <div className="text-gray-400">Last Visit</div>
                            <div className="text-right font-bold text-gray-800">--</div>

                            <div className="text-gray-400">Height</div>
                            <div className="text-right font-bold text-gray-800">--</div>
                        </div>
                    </div>

                    <div className="mt-auto bg-gradient-to-r from-cyan-500 to-blue-500 rounded-[25px] p-4 text-white relative overflow-hidden h-32 flex items-end">
                        <div className="relative z-10 w-full flex justify-between items-center">
                            <span className="font-bold">Automation</span>
                        </div>
                        {/* Decorative circles */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-xl"></div>
                        <div className="absolute bottom-10 left-10 w-10 h-10 bg-white/20 rounded-full blur-md"></div>
                    </div>
                </aside>

            </div>
        </div>
    );
};

// --- Sub Components ---

const NavPill = ({ icon, label, active }) => (
    <div className={`flex items-center gap-2 px-5 py-2.5 rounded-full cursor-pointer transition-all ${active ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'text-gray-500 hover:bg-gray-50'}`}>
        <span className="text-lg">{icon}</span>
        <span className="text-sm font-semibold">{label}</span>
    </div>
);

const ChartColumn = ({ h, active }) => (
    <div className="flex flex-col gap-1 items-center justify-end h-full w-8">
        <div className={`w-full rounded-t-full rounded-b-full transition-all duration-500 ${active ? 'bg-blue-600 shadow-xl shadow-blue-200' : 'bg-gray-100'}`} style={{ height: `${h}%` }}>
            {active && (
                <div className="w-2 h-2 bg-white rounded-full mx-auto mt-2"></div>
            )}
        </div>
        {active && <div className="w-1 h-full bg-blue-600/10 border-l border-dashed border-blue-400 absolute top-0 -z-10"></div>}
    </div>
);

const TaskCard = ({ title, time, users }) => (
    <div className="bg-[#fcfdfe] p-4 rounded-[20px] border border-gray-100">
        <div className="text-sm font-bold text-gray-800 mb-1">{title}</div>
        <div className="text-[10px] text-gray-400 mb-3">{time}</div>
        <div className="flex">
            {users.map((u, i) => (
                <div key={i} className={`w-6 h-6 rounded-full border border-white -ml-2 first:ml-0 overflow-hidden ${typeof u === 'string' && u.startsWith('+') ? 'bg-gray-200 flex items-center justify-center text-[8px] font-bold text-gray-600' : ''}`}>
                    {typeof u === 'string' && u.startsWith('http') ? <img src={u} alt="" className="w-full h-full object-cover" /> : u}
                </div>
            ))}
        </div>
    </div>
);

export default CareConcierge;
