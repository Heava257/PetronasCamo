
import React from 'react';
import { Table, Tag, Typography, Button, Space, Avatar, Tooltip, Row, Col, Card } from 'antd';
import {
    EditOutlined,
    DeleteOutlined,
    EnvironmentOutlined,
    UserOutlined,
    PhoneOutlined,
    MailOutlined,
    IdcardOutlined
} from '@ant-design/icons';
import { useSettings } from '../../../settings';


const { Text } = Typography;

const CustomerList = ({
    list,
    loading,
    isPermission,
    profile,
    blockedPermissions,
    onClickEdit,
    onClickDelete,
    setLocationModalVisible,
    setSelectedCustomer,
    getPhoneCarrierInfo,
    t,
    viewMode,
    isMobile
}) => {
    const { isDarkMode } = useSettings();


    const columns = [
        {
            title: t('no'),
            key: 'no',
            render: (_, __, index) => <Text type="secondary">{index + 1}</Text>,
            width: 60,
            align: 'center',
            fixed: 'left',
        },
        {
            title: t('customer_info'),
            key: 'name',
            width: 280,
            fixed: 'left',
            render: (_, record) => (
                <div className="flex items-center gap-3">
                    <Avatar
                        size={48}
                        className={`border-2 ${record.gender === 'Female'
                            ? (isDarkMode ? 'bg-pink-900/30 text-pink-400 border-pink-900/50' : 'bg-pink-50 text-pink-500 border-pink-100')
                            : (isDarkMode ? 'bg-blue-900/30 text-blue-400 border-blue-900/50' : 'bg-blue-50 text-blue-500 border-blue-100')}`}
                        icon={record.gender === 'Female' ? <UserOutlined /> : <UserOutlined />}
                    >
                        {record.name?.charAt(0)?.toUpperCase()}
                    </Avatar>

                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <Text strong className={`text-base ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{record.name}</Text>

                            {record.type === 'special' && (
                                <Tag color="purple" className="text-[10px] m-0 px-1 py-0 rounded-sm font-bold uppercase tracking-wider">{t('VIP')}</Tag>
                            )}
                        </div>
                        <div className={`flex items-center gap-2 text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>

                            <Tag color="blue" className="m-0 text-[10px] px-1">{record.code || 'NO CODE'}</Tag>
                            <span>|</span>
                            <span>{record.gender ? t(record.gender) : '-'}</span>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: t('contact'),
            key: 'contact',
            width: 250,
            render: (_, record) => {
                const carrierInfo = getPhoneCarrierInfo(record.tel);
                return (
                    <div className="flex flex-col gap-2">
                        {record.tel && (
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-full bg-gray-50 text-gray-400">
                                    {carrierInfo.logo ? (
                                        <img src={carrierInfo.logo} alt="carrier" className="w-4 h-4 object-contain" />
                                    ) : (
                                        <PhoneOutlined />
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <Text strong className="leading-tight" style={{ color: carrierInfo.color }}>{record.tel}</Text>
                                    <Text type="secondary" className="text-[10px] uppercase font-bold tracking-wider">{carrierInfo.carrier}</Text>
                                </div>
                            </div>
                        )}
                        {record.email && (
                            <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-full ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-gray-50 text-gray-400'}`}>
                                    <MailOutlined />
                                </div>
                                <Text className={`text-sm truncate max-w-[180px] ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`} title={record.email}>{record.email}</Text>

                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            title: t('address'),
            key: 'address',
            width: 250,
            render: (_, record) => (
                <div className="flex items-start gap-2 max-w-[250px]">
                    <EnvironmentOutlined className={`mt-1 ${isDarkMode ? 'text-blue-400' : 'text-gray-400'}`} />
                    <Text className={`custom-scrollbar max-h-16 overflow-y-auto block text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`} title={record.address}>
                        {record.address || <span className={isDarkMode ? 'text-slate-600 italic' : 'text-gray-300 italic'}>{t('no_address')}</span>}
                    </Text>

                </div>
            ),
        },
        {
            title: t('additional_info'),
            key: 'info',
            width: 200,
            render: (_, record) => (
                <div className="flex flex-col gap-1 text-xs text-gray-500">
                    {record.id_card_number && (
                        <div className="flex items-center gap-1">
                            <IdcardOutlined /> <span>ID: {record.id_card_number}</span>
                        </div>
                    )}
                    {record.spouse_name && (
                        <div>{t("spouse_name")}: {record.spouse_name}</div>
                    )}

                    <div className={`mt-1 pt-1 border-t border-dashed ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                        <span className={isDarkMode ? 'text-slate-500' : 'text-gray-400'}>{t("added_by")}</span> <span className={`font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{record.create_by}</span>
                    </div>


                </div>
            )
        },
        {
            title: t('action'),
            key: 'action',
            fixed: 'right',
            width: 120,
            align: 'center',
            render: (_, record) => (
                <Space size="small">
                    {isPermission("customer.update") && (
                        <Tooltip title={t('manage_locations')}>
                            <Button
                                type="text"
                                size="small"
                                icon={<EnvironmentOutlined className="text-blue-500" />}
                                className={`${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'} hover:bg-blue-100 border-blue-100`}
                                onClick={() => {
                                    setSelectedCustomer(record);
                                    setLocationModalVisible(true);
                                }}
                            />
                        </Tooltip>
                    )}
                    {isPermission("customer.update") && (
                        <Tooltip title={t('edit')}>
                            <Button
                                type="text"
                                size="small"
                                icon={<EditOutlined className="text-orange-500" />}
                                className={`${isDarkMode ? 'bg-orange-900/30' : 'bg-orange-50'} hover:bg-orange-100 border-orange-100`}
                                onClick={() => onClickEdit(record)}
                            />
                        </Tooltip>
                    )}
                    {isPermission("customer.remove") && !blockedPermissions.delete.includes(profile?.id) && (
                        <Tooltip title={t('delete')}>
                            <Button
                                type="text"
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                className={`${isDarkMode ? 'bg-red-900/30' : 'bg-red-50'} hover:bg-red-100 border-red-100`}
                                onClick={() => onClickDelete(record)}
                            />
                        </Tooltip>
                    )}
                </Space>

            ),
        },
    ];

    // Card View for Grid Mode
    const renderCard = (record) => {
        const carrierInfo = getPhoneCarrierInfo(record.tel);
        return (
            <Col key={record.id} xs={24} sm={12} md={12} lg={8} xl={6}>
                <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700 shadow-slate-900/50' : 'bg-white border-gray-100 shadow-sm'} rounded-2xl border hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden group h-full flex flex-col`}>
                    <div className={`h-2 w-full ${record.type === 'special' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gradient-to-r from-blue-400 to-cyan-400'}`}></div>


                    <div className="p-5 flex-1 relative">
                        {/* Type Badge */}
                        <div className="absolute top-4 right-4 z-10">
                            <Tag
                                color={record.type === 'special' ? 'purple' : 'cyan'}
                                className="m-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase border-0 bg-opacity-10"
                            >
                                {record.type === 'special' ? t('vip') : t('regular')}
                            </Tag>

                        </div>

                        <div className="flex flex-col items-center mb-4 text-center">
                            <Avatar
                                size={64}
                                className={`mb-3 border-4 shadow-sm ${isDarkMode ? 'border-slate-700' : 'border-white'} ${record.gender === 'Female' ? (isDarkMode ? 'bg-pink-900/30 text-pink-400' : 'bg-pink-50 text-pink-500') : (isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-500')}`}
                            >
                                {record.name?.charAt(0)?.toUpperCase()}
                            </Avatar>
                            <h3 className={`text-lg font-bold mb-0 leading-tight line-clamp-1 w-full ${isDarkMode ? 'text-white' : 'text-gray-800'}`} title={record.name}>
                                {record.name}
                            </h3>
                            <Text className={`text-xs mt-1 mb-2 px-2 py-0.5 rounded-md ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-500'}`}>
                                {record.code || 'NO CODE'}
                            </Text>


                            {/* Contact Info */}
                            <div className="w-full space-y-2 mt-2">
                                {record.tel && (
                                    <div
                                        className="flex items-center justify-center gap-2 p-2 rounded-lg w-full transition-colors"
                                        style={{ backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.4)' : carrierInfo.bgColor }}
                                    >
                                        {carrierInfo.logo ? (
                                            <img src={carrierInfo.logo} alt="" className="w-4 h-4 object-contain" />
                                        ) : (
                                            <PhoneOutlined style={{ color: carrierInfo.color }} />
                                        )}
                                        <span className={`font-bold text-sm ${isDarkMode ? 'text-blue-300' : ''}`} style={{ color: isDarkMode ? undefined : carrierInfo.color }}>{record.tel}</span>
                                    </div>

                                )}
                                {record.address && (
                                    <div className={`flex items-start justify-center gap-1 text-xs px-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                        <EnvironmentOutlined className="mt-0.5 flex-shrink-0" />
                                        <span className="line-clamp-2 text-left">{record.address}</span>
                                    </div>
                                )}

                            </div>
                        </div>
                    </div>

                    <div className={`border-t p-2 flex justify-between items-center opacity-90 group-hover:opacity-100 transition-opacity ${isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-gray-100 bg-gray-50/50'}`}>
                        <div className={`text-[10px] font-medium px-2 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                            {t("added_by")} {record.create_by}
                        </div>


                        <div className="flex gap-1">
                            {isPermission("customer.update") && (
                                <Tooltip title={t('locations')}>
                                    <Button
                                        size="small"
                                        type="text"
                                        icon={<EnvironmentOutlined className="text-blue-500" />}
                                        onClick={() => {
                                            setSelectedCustomer(record);
                                            setLocationModalVisible(true);
                                        }}
                                    />
                                </Tooltip>
                            )}
                            {isPermission("customer.update") && (
                                <Tooltip title={t('edit')}>
                                    <Button
                                        size="small"
                                        type="text"
                                        icon={<EditOutlined className="text-orange-500" />}
                                        onClick={() => onClickEdit(record)}
                                    />
                                </Tooltip>
                            )}
                            {isPermission("customer.remove") && !blockedPermissions.delete.includes(profile?.id) && (
                                <Tooltip title={t('delete')}>
                                    <Button
                                        size="small"
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => onClickDelete(record)}
                                    />
                                </Tooltip>
                            )}
                        </div>
                    </div>
                </div>
            </Col>
        );
    };

    if (viewMode === 'grid') {
        return (
            <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-slate-900/40' : 'bg-gray-50/50'}`}>

                {list.length > 0 ? (
                    <Row gutter={[20, 20]}>
                        {list.map(renderCard)}
                    </Row>
                ) : (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                        <div className="text-gray-400 text-lg">{t('no_data')}</div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <Card bordered={false} className={`shadow-sm rounded-xl overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800' : ''}`} bodyStyle={{ padding: 0 }}>
            {isMobile ? (
                <div className={`p-4 ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>

                    {list.length > 0 ? (
                        <Row gutter={[16, 16]}>
                            {list.map(renderCard)}
                        </Row>
                    ) : (
                        <div className="text-center py-8 text-gray-400">{t('no_data')}</div>
                    )}
                </div>
            ) : (
                <Table
                    columns={columns}
                    dataSource={list}
                    loading={loading}
                    rowKey="id"
                    pagination={false}
                    scroll={{ x: 1200, y: 'calc(100vh - 380px)' }}
                    className="customer-table-modern"
                />
            )}
        </Card>
    );
};

export default CustomerList;
