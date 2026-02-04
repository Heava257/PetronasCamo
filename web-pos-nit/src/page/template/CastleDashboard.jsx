
import React, { useState } from 'react';
import {
    AppstoreOutlined,
    DashboardOutlined,
    FileTextOutlined,
    CreditCardOutlined,
    TeamOutlined,
    HomeOutlined,
    SettingOutlined,
    BellOutlined,
    SearchOutlined,
    PlusOutlined,
    RobotOutlined,
    MenuOutlined,
    UserOutlined,
    LogoutOutlined,
    DownOutlined,
    CalendarOutlined
} from '@ant-design/icons';
import { Avatar, Button, Input, Badge, Select, Dropdown, Menu, Tooltip } from 'antd';
import './CastleDashboard.css';

const { Option } = Select;

const CastleDashboard = () => {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="castle-container font-sans bg-gray-100 flex h-screen text-gray-700 overflow-hidden p-6">
            {/* Main Card Wrapper */}
            <div className="bg-white w-full h-full rounded-[30px] flex overflow-hidden shadow-2xl relative">

                {/* Sidebar */}
                <aside className={`flex flex-col border-r border-gray-100 py-6 transition-all duration-300 ${collapsed ? 'w-20 px-2' : 'w-64 px-6'}`}>
                    <div className="flex items-center gap-2 mb-8 px-2">
                        <div className="text-2xl font-bold font-serif">CASTLE</div>
                        <div className="w-2 h-2 bg-black rounded-full mt-2"></div>
                    </div>

                    <div className="mb-6 relative">
                        <Input
                            prefix={<SearchOutlined className="text-gray-400" />}
                            placeholder={collapsed ? "" : "Search"}
                            className={`bg-gray-50 border-none rounded-lg h-10 ${collapsed ? 'px-0 justify-center' : ''}`}
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-8 pr-2">
                        <MenuSection title="Dashboard" collapsed={collapsed}>
                            <NavItem icon={<DashboardOutlined />} label="Dashboard" active collapsed={collapsed} />
                            <NavItem icon={<HomeOutlined />} label="Usage" collapsed={collapsed} />
                            <NavItem icon={<FileTextOutlined />} label="Tenant Bills" collapsed={collapsed} />
                            <NavItem icon={<CreditCardOutlined />} label="Payables" collapsed={collapsed} />
                        </MenuSection>

                        <MenuSection title="Manage" collapsed={collapsed}>
                            <NavItem icon={<DashboardOutlined />} label="Meters" collapsed={collapsed} />
                            <NavItem icon={<TeamOutlined />} label="Tenants" collapsed={collapsed} />
                            <NavItem icon={<HomeOutlined />} label="Properties" collapsed={collapsed} />
                            <NavItem icon={<TeamOutlined />} label="Team" collapsed={collapsed} />
                        </MenuSection>

                        <MenuSection title="Account" collapsed={collapsed}>
                            <NavItem icon={<SettingOutlined />} label="Account & Settings" collapsed={collapsed} />
                            <NavItem icon={<AppstoreOutlined />} label="Register Applications" collapsed={collapsed} />
                            <NavItem icon={<BellOutlined />} label="Notifications" hasBadge badgeCount={2} collapsed={collapsed} />
                        </MenuSection>
                    </div>

                    <div className="mt-auto pt-4 border-t border-gray-100 flex items-center gap-3 px-2">
                        <Avatar src="https://i.pravatar.cc/150?img=33" size="large" />
                        {!collapsed && (
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-sm text-gray-800 truncate">Ikram Sakib</div>
                                <div className="text-xs text-gray-400 truncate">ikramhsakib2@gmail.c...</div>
                            </div>
                        )}
                        {!collapsed && <LogoutOutlined className="text-gray-400 cursor-pointer hover:text-red-500" />}
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 flex flex-col bg-gray-50/30 overflow-hidden relative">

                    {/* Top Bar */}
                    <header className="h-20 px-8 flex items-center justify-between border-b border-gray-100 bg-white">
                        <div className="flex items-center gap-4">
                            <Button type="text" icon={<MenuOutlined />} onClick={() => setCollapsed(!collapsed)} className="lg:hidden" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">Good Evening <span className="font-normal text-gray-600">Ikram</span></h1>
                                <div className="text-xs text-gray-400">Dashboard &gt; List Item</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <Select defaultValue="Urban Oasis" className="w-32 custom-select" bordered={false}>
                                <Option value="Urban Oasis">Urban Oasis</Option>
                            </Select>
                            <Select defaultValue="Unit" className="w-20 custom-select" bordered={false}>
                                <Option value="Unit">Unit</Option>
                            </Select>
                            <Select defaultValue="Gallons" className="w-24 custom-select" bordered={false}>
                                <Option value="Gallons">Gallons</Option>
                            </Select>

                            <div className="h-6 w-px bg-gray-200 mx-2"></div>

                            <div className="font-bold text-gray-800">$1242</div>
                            <Badge dot>
                                <Button shape="circle" icon={<BellOutlined />} />
                            </Badge>
                            <Button type="primary" shape="circle" icon={<PlusOutlined />} className="bg-blue-600" />

                            <Button className="bg-blue-50 text-blue-600 border-none rounded-full px-4 flex items-center gap-2">
                                <RobotOutlined /> AI assistant
                            </Button>
                        </div>
                    </header>

                    {/* Dashboard Content */}
                    <div className="flex-1 overflow-y-auto p-8">

                        {/* KPI Cards */}
                        <div className="grid grid-cols-3 gap-6 mb-8">
                            <KpiCard title="Usage" value="300 Gal" trend="+3%" trendLabel="From last month" trendUp />
                            <KpiCard title="Sewer" value="420 Gal" trend="+60%" trendLabel="From last month" trendUp />
                            <KpiCard title="Variance / Leak" value="30 Gal" trend="+1%" trendLabel="From last month" trendUp={false} isDanger />
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-12 gap-6 mb-8">
                            {/* Leak Summary - Bar Chart */}
                            <div className="col-span-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold text-gray-800">Leak Summary</h3>
                                    <div className="flex gap-2">
                                        <Button size="small" type="text" className="text-gray-400">Day</Button>
                                        <Button size="small" type="primary" className="bg-blue-50 text-blue-600 border-none font-bold">Month</Button>
                                        <Button size="small" type="text" className="text-gray-400">Year</Button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 text-xs mb-4">
                                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-100"></div> Aqua Meter</div>
                                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-600"></div> Castle Meter</div>
                                </div>

                                {/* Mock Chart */}
                                <div className="h-64 flex items-end justify-between px-4 gap-4">
                                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                                        <div key={i} className="flex flex-col items-center gap-2 flex-1 group relative">
                                            {!['Apr', 'Jun', 'Jul', 'Sep', 'Nov', 'Dec'].includes(m) && (
                                                <>
                                                    <div className="w-2 bg-blue-600 rounded-t-full" style={{ height: `${Math.random() * 40 + 20}%` }}></div>
                                                    <div className="w-2 bg-blue-100 rounded-t-full -ml-4" style={{ height: `${Math.random() * 60 + 30}%` }}></div>
                                                </>
                                            )}
                                            <span className="text-[10px] text-gray-400">{m}</span>

                                            {m === 'Apr' && (
                                                <div className="absolute bottom-20 left-10 bg-white p-4 rounded-xl shadow-xl z-20 border border-gray-100 w-64">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <span className="font-bold text-sm">Leak Summary (Unit)</span>
                                                        <span className="text-xs text-gray-400 flex items-center gap-1"><CalendarOutlined /> August</span>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <LeakRow unit="Unit 101" val="3 Gal" w="30%" color="bg-blue-600" />
                                                        <LeakRow unit="Unit 102" val="7 Gal" w="50%" color="bg-blue-600" />
                                                        <LeakRow unit="Unit 103" val="10 Gal" w="80%" color="bg-red-500" />
                                                        <LeakRow unit="Unit 104" val="5 Gal" w="40%" color="bg-blue-600" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* AI Assistant Float */}
                            <div className="col-span-4 relative">
                                <div className="absolute top-10 right-4 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-0 z-10">
                                    <div className="flex justify-between items-center p-4 border-b border-gray-100">
                                        <span className="font-bold">AI Assistant</span>
                                        <span className="text-gray-400 cursor-pointer">×</span>
                                    </div>
                                    <div className="p-4 bg-blue-50/50">
                                        <div className="bg-blue-600 text-white p-3 rounded-2xl rounded-tl-none text-xs mb-3 shadow-lg shadow-blue-200">
                                            Fusce et justo in orci dapibus dignissim. Nam rutrum vulputate nulla.
                                        </div>
                                        <p className="text-xs text-gray-500 font-semibold mb-2">Dolor sit amet consectetur adipisicing elit.</p>
                                        <ol className="list-decimal pl-4 text-[10px] text-gray-500 space-y-2 mb-4">
                                            <li>Amet labore: Lorem ipsum dolor sit amet consectetur adipisicing.</li>
                                            <li>Consequatur labore: Lorem ipsum dolor sit amet consectetur.</li>
                                        </ol>
                                        <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-200">
                                            <PlusOutlined className="text-blue-500" />
                                            <input className="flex-1 text-xs outline-none" placeholder="Write something" />
                                            <Button size="small" type="primary" className="bg-blue-600 flex items-center justify-center p-0 w-6 h-6 rounded-lg pointer-events-none">↑</Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Cards */}
                        <div className="grid grid-cols-2 gap-6">
                            {/* Payables */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex justify-between mb-4">
                                    <h3 className="font-bold text-gray-800">Payables</h3>
                                    <Badge status="default" text={<span className="text-gray-400 text-xs"><CalendarOutlined /> August</span>} />
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="relative w-32 h-32 flex items-center justify-center">
                                        {/* Simple CSS Donut */}
                                        <div className="absolute inset-0 rounded-full border-[12px] border-green-500 border-t-transparent -rotate-45"></div>
                                        <div className="absolute inset-0 rounded-full border-[12px] border-orange-500 border-r-transparent border-b-transparent rotate-45"></div>
                                        <div className="absolute inset-0 rounded-full border-[12px] border-red-500 border-l-transparent border-t-transparent rotate-[135deg]"></div>
                                        <div className="text-center">
                                            <div className="text-[10px] text-gray-400">Total Amount</div>
                                            <div className="font-bold text-lg text-gray-800">$3,200</div>
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <InfoRow label="Paid" val="$2,107" color="green" />
                                        <InfoRow label="Processing" val="$450" color="gray" />
                                        <InfoRow label="Unpaid" val="$866" color="orange" />
                                        <InfoRow label="Failed" val="$160" color="red" />
                                    </div>
                                </div>
                            </div>

                            {/* Tenant Bills Summary */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex justify-between mb-4">
                                    <h3 className="font-bold text-gray-800">Tenant Bills Summary</h3>
                                    <Badge status="default" text={<span className="text-gray-400 text-xs"><CalendarOutlined /> August</span>} />
                                </div>
                                <div className="flex items-center justify-around mt-8">
                                    <div className="relative w-40 h-20 overflow-hidden flex justify-center items-end">
                                        <div className="absolute w-40 h-40 rounded-full border-[20px] border-gray-100 top-0"></div>
                                        <div className="absolute w-40 h-40 rounded-full border-[20px] border-green-500 top-0" style={{ clipPath: 'polygon(0 0, 50% 100%, 0 100%)' }}></div>
                                        <div className="absolute w-40 h-40 rounded-full border-[20px] border-blue-400 top-0" style={{ clipPath: 'polygon(20% 0, 80% 0, 50% 100%)', transform: 'rotate(45deg)' }}></div>
                                        <div className="text-center -mb-2 z-10">
                                            <div className="text-[10px] text-gray-400">Total Amount</div>
                                            <div className="font-bold text-xl text-gray-800">$4,570</div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <DotLabel label="Paid" val="$2,546" color="bg-green-500" />
                                        <DotLabel label="Processing" val="$1,574" color="bg-blue-400" />
                                        <DotLabel label="Unpaid" val="$450" color="bg-orange-400" />
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
};

// --- Sub Components ---

const MenuSection = ({ title, children, collapsed }) => (
    <div className="mb-6">
        {!collapsed && <div className="text-xs text-gray-400 font-semibold mb-3 px-2 uppercase tracking-wide">{title}</div>}
        <div className="space-y-1">
            {children}
        </div>
    </div>
);

const NavItem = ({ icon, label, active, hasBadge, badgeCount, collapsed }) => (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors group relative ${active ? 'bg-blue-50 text-blue-600 font-semibold border-r-4 border-blue-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
        <span className="text-lg">{icon}</span>
        {!collapsed && <span className="text-sm">{label}</span>}
        {hasBadge && !collapsed && <div className="ml-auto w-1.5 h-1.5 bg-blue-500 rounded-full"></div>}
    </div>
);

const KpiCard = ({ title, value, trend, trendLabel, trendUp, isDanger }) => (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-2">
            <span className="text-gray-500 text-sm font-medium">{title}</span>
            <Tooltip title="More info"><div className="w-3 h-3 rounded-full border border-gray-300 text-[8px] flex items-center justify-center text-gray-400">?</div></Tooltip>
        </div>
        <div className="text-3xl font-bold text-gray-800 mb-2">{value}</div>
        <div className="flex items-center gap-2 text-xs">
            <span className={`font-bold ${trendUp ? 'text-green-500' : isDanger ? 'text-red-500' : 'text-green-500'}`}>{trend}</span>
            <span className="text-gray-400">{trendLabel}</span>
        </div>
    </div>
);

const LeakRow = ({ unit, val, w, color }) => (
    <div className="flex items-center gap-2 text-xs">
        <span className="w-12 text-gray-500">{unit}</span>
        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
            <div className={`h-full rounded-full ${color}`} style={{ width: w }}></div>
        </div>
        <span className="w-8 text-right text-gray-400">{val}</span>
    </div>
)

const InfoRow = ({ label, val, color }) => {
    const colors = { green: 'bg-green-500', gray: 'bg-gray-500', orange: 'bg-orange-400', red: 'bg-red-500' };
    return (
        <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
                <span className="text-gray-500 font-medium">{label}</span>
                <div className="w-3 h-3 rounded-full border border-gray-200 text-[8px] flex items-center justify-center text-gray-300">i</div>
            </div>
            <div className="font-bold flex items-center gap-2">
                <div className={`w-20 h-1 rounded-full ${colors[color]} opacity-20 relative`}>
                    <div className={`absolute top-0 left-0 h-full ${colors[color]} rounded-full`} style={{ width: '70%' }}></div>
                </div>
                {val}
            </div>
        </div>
    )
}

const DotLabel = ({ label, val, color }) => (
    <div className="flex items-center gap-2 text-xs">
        <div className={`w-2 h-2 rounded-full ${color}`}></div>
        <span className="text-gray-500 w-16">{label}</span>
        <span className="font-bold">{val}</span>
    </div>
)

export default CastleDashboard;
