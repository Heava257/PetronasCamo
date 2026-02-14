
import React from 'react';
import { Card, Row, Col, Typography, Button, Input, DatePicker, Table, Avatar, Empty, Spin } from 'antd';
import {
    FileTextOutlined,
    CalendarOutlined,
    InfoCircleOutlined,
    UserOutlined,
    EnvironmentOutlined,
    SearchOutlined
} from '@ant-design/icons';
import { BiStats } from "react-icons/bi";
import { Link } from "react-router-dom";
import { Config } from '../../../util/config';

const { Text, Title } = Typography;

const SummaryCard = ({ title, icon: Icon, data, type, t }) => {
    const getStyles = () => {
        switch (type) {
            case 'present': return { iconBg: '#e0f2fe', iconColor: '#0ea5e9' };
            case 'not-present': return { iconBg: '#fee2e2', iconColor: '#ef4444' };
            case 'away': return { iconBg: '#fef3c7', iconColor: '#f59e0b' };
            default: return { iconBg: '#f3f4f6', iconColor: '#6b7280' };
        }
    };
    const styles = getStyles();

    return (
        <Card className="summary-card h-full rounded-xl shadow-sm border-gray-100 transition-all hover:shadow-md">
            <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-3">
                    <div style={{ background: styles.iconBg }} className="p-2 rounded-lg flex items-center justify-center">
                        <Icon style={{ color: styles.iconColor, fontSize: 18 }} />
                    </div>
                    <Text strong className="text-gray-700 text-base">{t(title)}</Text>
                </div>
                <Button type="text" size="small" icon={<InfoCircleOutlined className="text-gray-400" />} />
            </div>
            <Row gutter={[16, 16]}>
                {Object.entries(data).map(([key, value]) => {
                    if (key === 'comparison' || key === 'total') return null;
                    const comparison = data.comparison?.[key] || 0;
                    const isPositive = comparison >= 0;
                    return (
                        <Col span={8} key={key}>
                            <div className="mb-1">
                                <Text type="secondary" className="text-xs capitalize">{t(key.replace(/_/g, ' '))}</Text>
                            </div>
                            <div className="flex flex-col">
                                <Title level={3} className="m-0 text-2xl font-bold text-gray-800">{value}</Title>
                                <div className="flex items-center gap-1 mt-1">
                                    <Text className={`text-xs font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                        {isPositive ? '+' : ''}{comparison} vs yesterday
                                    </Text>
                                </div>
                            </div>
                        </Col>
                    );
                })}
            </Row>
        </Card>
    );
};

const AttendanceDashboard = ({ dashboardStats, attendanceList, loading, t, onSearch, onDateRangeChange, onAdvanceFilter }) => {

    if (!dashboardStats && loading) return <div className="flex justify-center p-12"><Spin size="large" /></div>;
    if (!dashboardStats) return <Empty description={t('no_data')} />;

    const columns = [
        {
            title: t('Employee Name'),
            key: 'employee',
            render: (_, record) => (
                <div className="flex items-center gap-3">
                    <Avatar
                        src={record.profile_image ? Config.getFullImagePath(record.profile_image) : null}
                        icon={!record.profile_image && <UserOutlined />}
                        className="bg-gray-100 border border-gray-200"
                    />
                    <div>
                        <div className="font-semibold text-gray-800">{record.user_name}</div>
                        <div className="text-xs text-gray-500">{record.id}</div>
                    </div>
                </div>
            )
        },
        {
            title: t('Clock-in & Out'),
            key: 'clock',
            render: (_, record) => (
                <div className="flex items-center gap-2">
                    <Text strong style={{ color: record.status === 'on-time' ? '#10b981' : '#f59e0b' }}>{record.check_in_display || '--:--'}</Text>
                    <div className="w-10 h-px bg-gray-200 relative mx-2">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] text-gray-400">
                            {record.working_hours ? `${record.working_hours}h` : ''}
                        </div>
                    </div>
                    <Text strong className="text-gray-500">{record.check_out_display || record.scheduled_end_display || '--:--'}</Text>
                </div>
            )
        },
        {
            title: t('Overtime'),
            key: 'overtime',
            render: (_, record) => {
                const ot = record.early_departure_minutes < 0 ? Math.abs(record.early_departure_minutes) : 0;
                return ot > 0 ? (
                    <Text strong className="text-blue-600">{Math.floor(ot / 60)}h {ot % 60}m</Text>
                ) : '-';
            }
        },
        {
            title: t('Picture'),
            key: 'picture',
            render: (_, record) => record.profile_image ? (
                <Link to="#" className="text-blue-500 text-xs flex items-center gap-1 hover:underline">
                    <FileTextOutlined />
                    {record.profile_image.split('/').pop().substring(0, 15)}...
                </Link>
            ) : '-'
        },
        {
            title: t('Location'),
            key: 'location',
            render: (_, record) => (
                <div className="flex items-center gap-1 text-blue-500 text-xs">
                    <EnvironmentOutlined />
                    <span>{record.location || 'HQ Office'}</span>
                </div>
            )
        },
        {
            title: t('Notes'),
            key: 'notes',
            render: (_, record) => (
                <div className="text-xs text-gray-500 max-w-[200px] truncate" title={record.notes}>
                    {record.notes || t('No discussion notes')}
                </div>
            )
        }
    ];

    return (
        <div className="attendance-dashboard space-y-6">
            <Row gutter={[24, 24]}>
                <Col xs={24} lg={8}>
                    <SummaryCard
                        title="Present Summary"
                        icon={FileTextOutlined}
                        data={dashboardStats.present}
                        type="present"
                        t={t}
                    />
                </Col>
                <Col xs={24} lg={8}>
                    <SummaryCard
                        title="Not Present Summary"
                        icon={FileTextOutlined}
                        data={dashboardStats.not_present}
                        type="not-present"
                        t={t}
                    />
                </Col>
                <Col xs={24} lg={8}>
                    <SummaryCard
                        title="Away Summary"
                        icon={CalendarOutlined}
                        data={dashboardStats.away}
                        type="away"
                        t={t}
                    />
                </Col>
            </Row>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <Input
                        placeholder={t('Search employee')}
                        prefix={<SearchOutlined className="text-gray-400" />}
                        className="w-full sm:w-64"
                        allowClear
                        onChange={onSearch} // Assuming onSearch handles input change directly or via debounce
                    />
                    <DatePicker.RangePicker
                        placeholder={[t('Start Date'), t('End Date')]}
                        className="w-full sm:w-auto"
                        onChange={onDateRangeChange}
                    />
                </div>
                <Button icon={<BiStats />} onClick={onAdvanceFilter} className="w-full sm:w-auto">
                    {t('Advance Filter')}
                </Button>
            </div>

            <Card bordered={false} className="rounded-xl shadow-sm overflow-hidden" bodyStyle={{ padding: 0 }}>
                <Table
                    dataSource={attendanceList}
                    columns={columns}
                    pagination={{ pageSize: 10 }}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: 800 }}
                />
            </Card>
        </div>
    );
};

export default AttendanceDashboard;
