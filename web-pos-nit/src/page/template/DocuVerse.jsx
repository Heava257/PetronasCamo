
import React from 'react';
import {
    AppstoreOutlined,
    UserOutlined,
    TeamOutlined,
    CalendarOutlined,
    DollarOutlined,
    BarChartOutlined,
    SettingOutlined,
    SearchOutlined,
    BellOutlined,
    FileTextOutlined,
    HeartFilled,
    PlusOutlined
} from '@ant-design/icons';
import { Avatar, Button, Input, Progress, Card, Row, Col, Badge } from 'antd';
import './DocuVerse.css'; // We'll create this for custom tweaks

const DocuVerse = () => {
    return (
        <div className="docu-container font-sans bg-gray-50 flex h-screen text-gray-700 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-white flex-shrink-0 flex flex-col justify-between p-6 border-r border-gray-100">
                <div>
                    <div className="flex items-center gap-2 mb-10 text-xl font-bold text-gray-800">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">DV</div>
                        DocuVerse
                    </div>

                    <nav className="space-y-4">
                        <NavItem icon={<AppstoreOutlined />} label="Dashboard" />
                        <NavItem icon={<UserOutlined />} label="Doctor" />
                        <NavItem icon={<TeamOutlined />} label="Patients" active />
                        <NavItem icon={<CalendarOutlined />} label="Appointments" />
                        <NavItem icon={<DollarOutlined />} label="Billing" />
                        <NavItem icon={<BarChartOutlined />} label="Reports" />
                        <NavItem icon={<SettingOutlined />} label="Settings" />
                    </nav>
                </div>

                <div className="space-y-6">
                    <div className="bg-green-50 p-4 rounded-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-20">
                            <HeartFilled className="text-4xl text-green-500" />
                        </div>
                        <h4 className="font-bold text-green-800 mb-1">AI Health Update</h4>
                        <p className="text-xs text-green-700 mb-3">New AI engine improves diagnosis accuracy by 27%</p>
                        <Button type="primary" size="small" className="bg-green-800 hover:bg-green-700 border-none w-full rounded-md text-xs h-8">Update Now</Button>
                    </div>

                    <div className="flex items-center gap-3">
                        <Avatar src="https://i.pravatar.cc/150?img=11" size="large" />
                        <div className="text-xs">
                            <div className="font-bold text-gray-800">Darlene Robertson</div>
                            <div className="text-gray-400">ID: 72630284</div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 bg-gray-50/50 relative">
                {/* Header */}
                <header className="h-20 px-8 flex items-center justify-between bg-transparent">
                    <div className="w-1/3">
                        <Input
                            prefix={<SearchOutlined className="text-gray-400" />}
                            placeholder="Search"
                            className="rounded-full bg-white border-none shadow-sm h-10"
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <Button shape="circle" icon={<BellOutlined />} className="border-none shadow-sm bg-white" />
                        <Button shape="circle" icon={<UserOutlined />} className="border-none shadow-sm bg-white" />
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm text-xs font-semibold text-gray-600">
                            <CalendarOutlined /> October 23, 2025
                        </div>
                        <Button type="primary" icon={<FileTextOutlined />} className="bg-green-600 hover:bg-green-500 rounded-full h-10 px-6 border-none text-xs font-semibold shadow-lg shadow-green-200">
                            Generate Report
                        </Button>
                    </div>
                </header>

                <div className="flex-1 overflow-auto flex">
                    {/* Center Panel - Patient Body */}
                    <div className="flex-1 p-8 pt-2 flex flex-col">
                        <div className="text-gray-400 text-xs mb-4">Patients &lt; <span className="text-gray-800 font-bold">Wade Warren</span></div>

                        <div className="flex-1 relative flex justify-center items-center">
                            <div className="absolute top-0 left-0">
                                <h1 className="text-3xl font-bold mb-1">Patient's <br />Insights</h1>
                            </div>

                            <div className="absolute top-20 left-0">
                                <div className="text-4xl font-light mb-1">C</div>
                                <div className="text-xs text-gray-400 mb-6">Structure</div>

                                <div className="text-4xl font-light mb-1">23.4</div>
                                <div className="text-xs text-gray-400">Angstrom</div>
                            </div>

                            {/* Vertical floating tool bar */}
                            <div className="absolute right-0 bottom-20 flex flex-col gap-3 bg-white p-2 rounded-full shadow-lg">
                                <Button shape="circle" icon={<PlusOutlined />} size="small" type="text" />
                                <Button shape="circle" icon={<SettingOutlined />} size="small" type="text" />
                                <Button shape="circle" icon={<UserOutlined />} size="small" type="text" />
                            </div>

                            {/* Body Graphic Placeholder */}
                            <div className="h-[500px] w-[300px] ">
                                <LocalBodyGraphic />
                            </div>
                        </div>

                        {/* Bottom Card */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm mt-4 relative overflow-hidden">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="text-xs text-gray-400">Stanford Health</div>
                                    <div className="text-lg font-bold">300 Pasteur DR</div>
                                </div>
                                <Badge status="processing" text="Normal" color="green" />
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span>Health Index Score</span>
                                        <span>345 cm</span>
                                    </div>
                                    <Progress percent={30} showInfo={false} strokeColor="#e5e7eb" trailColor="#f3f4f6" size="small" />
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span>Your Result</span>
                                        <span>830 cm</span>
                                    </div>
                                    <Progress percent={75} showInfo={false} strokeColor={{ '0%': '#fbbf24', '100%': '#22c55e' }} trailColor="#f3f4f6" size="small" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Stats */}
                    <div className="w-96 bg-white m-4 rounded-3xl p-6 shadow-sm overflow-auto">
                        <div className="flex items-center gap-4 mb-8">
                            <Avatar shape="square" size={64} src="https://i.pravatar.cc/150?img=3" className="rounded-2xl" />
                            <div>
                                <div className="text-xs text-gray-400">Name</div>
                                <div className="font-bold text-gray-800">Elenea Pena</div>
                                <div className="text-xs text-gray-400 mt-2">Date of birth</div>
                                <div className="font-semibold text-xs">15 Jul, 2000</div>
                            </div>
                            <div className="ml-auto">
                                <div className="text-xs text-gray-400">Doctor Assigned</div>
                                <div className="font-bold text-gray-800">Marry Wooms</div>
                                <div className="text-xs text-gray-400 mt-2">Sex</div>
                                <div className="font-semibold text-xs">Male</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <StatCard icon={<span className="text-red-500">🩸</span>} title="Blood Status" value="116/70" chart={<MiniBarChart />} />
                            <StatCard icon={<HeartFilled className="text-red-500" />} title="Heart Rate" value="175 BPM" chart={<MiniLineChart color="red" />} />
                            <StatCard icon={<span className="text-red-500">drop</span>} title="Blood Count" value="80-90" chart={<MiniWaveChart />} />
                            <StatCard icon={<span className="text-red-500">🧪</span>} title="Glucose Level" value="230/ML" chart={<MiniAreaChart />} />
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-6">
                            <MedicineCard name="Gum Vital" dose="300mg" color="blue" />
                            <MedicineCard name="Colageno" dose="400mg" color="purple" />
                            <MedicineCard name="Multi Collagen" dose="300mg" color="red" />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold">Heart-rate Activity</h3>
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            </div>

                            <div className="flex gap-4 items-center">
                                <div className="flex-1">
                                    <div className="text-xs text-gray-500 mb-1">Mens Average Heartrate</div>
                                    <div className="text-xs text-gray-400 mb-4">An adult's normal heart rate is 60-100 beats per minute</div>
                                    <div className="text-4xl font-bold">120 <span className="text-lg font-normal text-gray-400">bpm</span></div>
                                </div>
                                <div className="w-20">
                                    <Heart3D />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

// --- Sub Components ---

const NavItem = ({ icon, label, active }) => (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors ${active ? 'bg-gray-100 font-bold text-gray-900 shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
        <span className="text-lg">{icon}</span>
        <span className="text-sm">{label}</span>
    </div>
);

const StatCard = ({ icon, title, value, chart }) => (
    <div className="bg-gray-50 p-3 rounded-2xl">
        <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] text-gray-400">{title}</span>
            {icon}
        </div>
        <div className="font-bold text-lg mb-2">{value}</div>
        <div className="h-8">
            {chart}
        </div>
    </div>
);

const MedicineCard = ({ name, dose, color }) => {
    const bgColors = {
        blue: 'bg-blue-100 text-blue-600',
        purple: 'bg-purple-100 text-purple-600',
        red: 'bg-red-100 text-red-600'
    }
    return (
        <div className="flex flex-col items-center p-2 rounded-xl border border-gray-100">
            <div className={`w-8 h-10 mb-2 rounded ${bgColors[color]} flex items-center justify-center text-xs font-bold`}>Rx</div>
            <div className="text-[10px] font-bold text-center leading-tight mb-1">{name}</div>
            <div className="text-[9px] text-gray-400">{dose}</div>
        </div>
    )
}

// Mini Charts (Pure CSS/SVG Simulations)
const MiniBarChart = () => (
    <div className="flex items-end gap-1 h-full">
        {[40, 60, 30, 80, 50, 70, 40].map((h, i) => (
            <div key={i} className="flex-1 bg-red-200 rounded-sm" style={{ height: `${h}%` }}></div>
        ))}
    </div>
)

const MiniLineChart = ({ color }) => (
    <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
        <polyline points="0,20 10,25 20,15 30,30 40,10 50,25 60,5 70,20 80,15 90,30 100,20"
            fill="none" stroke={color === 'red' ? '#ef4444' : '#22c55e'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

const MiniWaveChart = () => (
    <svg viewBox="0 0 100 40" className="w-full h-full">
        <path d="M0,20 Q25,5 50,20 T100,20" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
        <path d="M0,20 Q25,35 50,20 T100,20" fill="none" stroke="#fca5a5" strokeWidth="2" strokeLinecap="round" />
    </svg>
)

const MiniAreaChart = () => (
    <svg viewBox="0 0 100 40" className="w-full h-full">
        <path d="M0,30 L10,25 L20,35 L30,20 L40,30 L50,15 L60,25 L70,10 L80,20 L90,15 L100,30 V40 H0 Z" fill="#bbf7d0" />
        <path d="M0,30 L10,25 L20,35 L30,20 L40,30 L50,15 L60,25 L70,10 L80,20 L90,15 L100,30" fill="none" stroke="#22c55e" strokeWidth="2" />
    </svg>
)

const LocalBodyGraphic = () => (
    <div className="w-full h-full relative" style={{ opacity: 0.8 }}>
        {/* Simplified Human Figure Simulation with SVG */}
        <svg viewBox="0 0 200 400" className="w-full h-full drop-shadow-xl">
            {/* Silhouette */}
            <path d="M100,30 C115,30 125,40 125,55 C125,70 115,80 100,80 C85,80 75,70 75,55 C75,40 85,30 100,30 Z 
                      M100,80 C130,80 150,100 160,130 C165,150 170,180 160,200 L150,250 L155,300 L140,380 L110,380 L115,280 L100,250 L85,280 L90,380 L60,380 L45,300 L50,250 L40,200 C30,180 35,150 40,130 C50,100 70,80 100,80"
                fill="#e5e7eb" stroke="white" strokeWidth="2" />

            {/* Lungs Area - Green Highlight */}
            <path d="M85,100 Q70,130 85,160 Q95,150 100,140 Q105,150 115,160 Q130,130 115,100 Q100,110 85,100" fill="#22c55e" opacity="0.8" />

            {/* Shoulders yellow highlight */}
            <path d="M70,90 Q85,85 100,90 L100,110 L80,110 Z" fill="#fbbf24" opacity="0.6" />
            <path d="M130,90 Q115,85 100,90 L100,110 L120,110 Z" fill="#fbbf24" opacity="0.6" />

            {/* Points */}
            <circle cx="100" cy="55" r="3" fill="#6b7280" />
            <circle cx="90" cy="120" r="3" fill="white" />
            <circle cx="110" cy="120" r="3" fill="white" />
            <circle cx="100" cy="180" r="3" fill="#6b7280" />
            <circle cx="70" cy="130" r="3" fill="#6b7280" />
            <circle cx="130" cy="130" r="3" fill="#6b7280" />
            <circle cx="60" cy="220" r="3" fill="#6b7280" />
            <circle cx="140" cy="220" r="3" fill="#6b7280" />
            <circle cx="90" cy="350" r="3" fill="#6b7280" />
            <circle cx="110" cy="350" r="3" fill="#6b7280" />
        </svg>
    </div>
)

const Heart3D = () => (
    <div className="relative w-16 h-16">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <path d="M50,30 C60,10 90,20 90,50 C90,75 50,90 50,90 C50,90 10,75 10,50 C10,20 40,10 50,30"
                fill="#991b1b" /> {/* Dark Red */}
            <path d="M60,30 C65,15 85,25 85,50 C85,65 60,75 60,75"
                fill="#ef4444" opacity="0.8" /> {/* Light Red Highlight */}
        </svg>
    </div>
)

export default DocuVerse;
