
import React from 'react';
import { Card, Col, Row, Statistic, Typography } from 'antd';
import { UserOutlined, ManOutlined, WomanOutlined, UsergroupAddOutlined } from '@ant-design/icons';
import { useSettings } from '../../../settings';


const { Text } = Typography;

const CustomerStats = ({ stats, t }) => {
    const { isDarkMode } = useSettings();

    return (
        <Row gutter={[16, 16]} className="mb-6">
            <Col xs={12} sm={6} md={6}>
                <Card bordered={false} className={`shadow-sm hover:shadow-md transition-shadow h-full rounded-xl border ${isDarkMode ? 'bg-gradient-to-br from-blue-900/40 to-slate-900 border-blue-800' : 'bg-gradient-to-br from-blue-50 to-white border-blue-100'}`}>
                    <Statistic
                        title={<Text className={`font-medium ${isDarkMode ? 'text-blue-300' : 'text-gray-500'}`}>{t("total_customers")}</Text>}
                        value={stats.total}
                        prefix={<UsergroupAddOutlined className={`${isDarkMode ? 'text-blue-400 bg-blue-900/50' : 'text-blue-500 bg-blue-100'} p-2 rounded-lg text-xl mr-2`} />}
                        valueStyle={{ color: isDarkMode ? '#60a5fa' : '#1d4ed8', fontWeight: 'bold' }}
                    />
                </Card>
            </Col>

            <Col xs={12} sm={6} md={6}>
                <Card bordered={false} className={`shadow-sm hover:shadow-md transition-shadow h-full rounded-xl border ${isDarkMode ? 'bg-gradient-to-br from-cyan-900/40 to-slate-900 border-cyan-800' : 'bg-gradient-to-br from-cyan-50 to-white border-cyan-100'}`}>
                    <Statistic
                        title={<Text className={`font-medium ${isDarkMode ? 'text-cyan-300' : 'text-gray-500'}`}>{t("male")}</Text>}
                        value={stats.male}
                        prefix={<ManOutlined className={`${isDarkMode ? 'text-cyan-400 bg-cyan-900/50' : 'text-cyan-500 bg-cyan-100'} p-2 rounded-lg text-xl mr-2`} />}
                        valueStyle={{ color: isDarkMode ? '#22d3ee' : '#0891b2', fontWeight: 'bold' }}
                    />
                </Card>
            </Col>

            <Col xs={12} sm={6} md={6}>
                <Card bordered={false} className={`shadow-sm hover:shadow-md transition-shadow h-full rounded-xl border ${isDarkMode ? 'bg-gradient-to-br from-pink-900/40 to-slate-900 border-pink-800' : 'bg-gradient-to-br from-pink-50 to-white border-pink-100'}`}>
                    <Statistic
                        title={<Text className={`font-medium ${isDarkMode ? 'text-pink-300' : 'text-gray-500'}`}>{t("female")}</Text>}
                        value={stats.female}
                        prefix={<WomanOutlined className={`${isDarkMode ? 'text-pink-400 bg-pink-900/50' : 'text-pink-500 bg-pink-100'} p-2 rounded-lg text-xl mr-2`} />}
                        valueStyle={{ color: isDarkMode ? '#f472b6' : '#db2777', fontWeight: 'bold' }}
                    />
                </Card>
            </Col>

            <Col xs={12} sm={6} md={6}>
                <Card bordered={false} className={`shadow-sm hover:shadow-md transition-shadow h-full rounded-xl border ${isDarkMode ? 'bg-gradient-to-br from-gray-800 to-slate-900 border-gray-700' : 'bg-gradient-to-br from-gray-50 to-white border-gray-100'}`}>
                    <Statistic
                        title={<Text className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t("other")}</Text>}
                        value={stats.other}
                        prefix={<UserOutlined className={`${isDarkMode ? 'text-gray-400 bg-gray-800' : 'text-gray-500 bg-gray-100'} p-2 rounded-lg text-xl mr-2`} />}
                        valueStyle={{ color: isDarkMode ? '#9ca3af' : '#4b5563', fontWeight: 'bold' }}
                    />
                </Card>
            </Col>

        </Row>
    );
};

export default CustomerStats;
