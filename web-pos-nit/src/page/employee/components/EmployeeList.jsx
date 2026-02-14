
import React from 'react';
import { Table, Button, Input, Space, Tag, Avatar, Tooltip, Row, Col, Card, Typography } from 'antd';
import {
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    UserAddOutlined,
    LockOutlined,
    CheckCircleOutlined,
    SearchOutlined,
    ClockCircleOutlined,
    FilterOutlined,
    FileExcelOutlined
} from '@ant-design/icons';
import { MdNewLabel } from 'react-icons/md';
import { Config } from '../../../util/config';

const { Text } = Typography;

const EmployeeList = ({
    list,
    loading,
    onSearch,
    onRefresh,
    onEdit,
    onDelete,
    onView,
    onCreateAccount,
    onResetPassword,
    isPermission,
    t,
    searchText,
    setSearchText,
    onExportExcel,
    permission // Include permission object if needed for specific checks 
}) => {

    const columns = [
        {
            title: t('no'),
            key: 'no',
            render: (_, __, index) => <Text type="secondary">{index + 1}</Text>,
            width: 60,
            align: 'center',
        },
        {
            title: t('employee_info'),
            key: 'employee',
            width: 250,
            render: (_, record) => (
                <div className="flex items-center gap-3">
                    <Avatar
                        src={record.profile_image ? Config.getFullImagePath(record.profile_image) : null}
                        size={48}
                        className="bg-primary/10 text-primary border border-primary/20"
                    >
                        {record.name?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <div className="flex flex-col">
                        <Text strong className="text-base">{record.name}</Text>
                        <Text type="secondary" className="text-xs">{record.code || 'No Code'}</Text>
                        <Text type="secondary" className="text-xs">{record.position}</Text>
                    </div>
                </div>
            ),
        },
        {
            title: t('contact_info'),
            key: 'contact',
            width: 200,
            render: (_, record) => (
                <div className="flex flex-col gap-1">
                    <Text className="text-sm">{record.tel}</Text>
                    <Text type="secondary" className="text-xs break-all">{record.email || '-'}</Text>
                </div>
            ),
        },
        {
            title: t('work_schedule'),
            key: 'schedule',
            width: 200,
            render: (_, record) => {
                const isFullTime = record.work_type === 'full-time';
                return (
                    <div className="flex flex-col gap-1">
                        <Tag color={isFullTime ? 'blue' : 'orange'} className="w-fit">
                            {record.work_type?.toUpperCase() || 'FULL-TIME'}
                        </Tag>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                            <ClockCircleOutlined />
                            {record.work_start_display} - {record.work_end_display}
                        </div>
                    </div>
                );
            }
        },
        {
            title: t('salary'),
            key: 'salary',
            dataIndex: 'salary',
            width: 120,
            render: (value) => <Text strong type="success">${parseFloat(value || 0).toFixed(2)}</Text>,
            align: 'right',
        },
        {
            title: t('status'),
            key: 'status',
            dataIndex: 'status',
            width: 100,
            align: 'center',
            render: (value) => (
                <Tag color={value === 1 ? 'success' : 'error'} className="px-2 py-0.5 rounded-full">
                    {value === 1 ? t('active') : t('inactive')}
                </Tag>
            ),
        },
        {
            title: t('account_status'),
            key: 'account',
            width: 160,
            align: 'center',
            render: (_, record) => (
                record.has_account ? (
                    <div className="flex flex-col items-center gap-1">
                        <Tag color="cyan" icon={<CheckCircleOutlined />}>
                            {t('has_account')}
                        </Tag>
                        {isPermission("employee.update") && (
                            <Button
                                type="link"
                                size="small"
                                icon={<LockOutlined />}
                                onClick={() => onResetPassword(record)}
                                className="text-xs p-0 h-auto"
                            >
                                {t('reset_password')}
                            </Button>
                        )}
                    </div>
                ) : (
                    isPermission("employee.update") && (
                        <Button
                            type="dashed"
                            size="small"
                            icon={<UserAddOutlined />}
                            onClick={() => onCreateAccount(record)}
                            className="text-xs"
                        >
                            {t('create_account')}
                        </Button>
                    )
                )
            ),
        },
        {
            title: t('action'),
            key: 'action',
            fixed: 'right',
            width: 120,
            align: 'center',
            render: (_, record) => (
                <Space size="small">
                    {isPermission("employee.view") && (
                        <Tooltip title={t('view')}>
                            <Button
                                type="text"
                                icon={<EyeOutlined className="text-blue-500" />}
                                onClick={() => onView(record)}
                            />
                        </Tooltip>
                    )}
                    {isPermission("employee.update") && (
                        <Tooltip title={t('edit')}>
                            <Button
                                type="text"
                                icon={<EditOutlined className="text-yellow-600" />}
                                onClick={() => onEdit(record)}
                            />
                        </Tooltip>
                    )}
                    {isPermission("employee.remove") && (
                        <Tooltip title={t('delete')}>
                            <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => onDelete(record)}
                            />
                        </Tooltip>
                    )}
                </Space>
            ),
        },
    ];

    // Mobile Card View
    const renderMobileCard = (record) => (
        <Card
            key={record.id}
            className="mb-4 shadow-sm border-gray-100"
            bodyStyle={{ padding: '16px' }}
        >
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <Avatar
                        src={record.profile_image ? Config.getFullImagePath(record.profile_image) : null}
                        size={40}
                        className="bg-primary/10 text-primary"
                    >
                        {record.name?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <div>
                        <Text strong className="block text-base">{record.name}</Text>
                        <Text type="secondary" className="text-xs">{record.position}</Text>
                    </div>
                </div>
                <Tag color={record.status === 1 ? 'success' : 'error'}>
                    {record.status === 1 ? t('active') : t('inactive')}
                </Tag>
            </div>

            <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                    <Text type="secondary">{t('code')}:</Text>
                    <Text>{record.code || '-'}</Text>
                </div>
                <div className="flex justify-between text-sm">
                    <Text type="secondary">{t('telephone')}:</Text>
                    <Text>{record.tel}</Text>
                </div>
                <div className="flex justify-between text-sm">
                    <Text type="secondary">{t('work_type')}:</Text>
                    <Text>{record.work_type?.toUpperCase()}</Text>
                </div>
                <div className="flex justify-between text-sm">
                    <Text type="secondary">{t('salary')}:</Text>
                    <Text strong type="success">${parseFloat(record.salary || 0).toFixed(2)}</Text>
                </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-3 mt-2">
                {isPermission("employee.view") && (
                    <Button size="small" icon={<EyeOutlined />} onClick={() => onView(record)}>{t('view')}</Button>
                )}
                {isPermission("employee.update") && (
                    <Button size="small" type="primary" ghost icon={<EditOutlined />} onClick={() => onEdit(record)}>{t('edit')}</Button>
                )}
                {isPermission("employee.remove") && (
                    <Button size="small" danger icon={<DeleteOutlined />} onClick={() => onDelete(record)}>{t('delete')}</Button>
                )}
            </div>
        </Card>
    );

    return (
        <div className="employee-list-container bg-white rounded-lg shadow-sm p-4">
            {/* Header / Filters */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto flex-1">
                    <Input
                        placeholder={t('search_by_name_code')}
                        prefix={<SearchOutlined className="text-gray-400" />}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        onPressEnter={onSearch}
                        className="w-full sm:w-64"
                        allowClear
                    />
                    <Button type="primary" ghost icon={<FilterOutlined />} onClick={onSearch}>
                        {t('filter')}
                    </Button>
                    <Button icon={<FileExcelOutlined />} onClick={onExportExcel} className="hidden sm:flex">
                        {t('export')}
                    </Button>
                </div>

                <div className="flex gap-2 w-full md:w-auto justify-end">
                    {/* Additional Actions if needed */}
                </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block">
                <Table
                    columns={columns}
                    dataSource={list}
                    loading={loading}
                    rowKey="id"
                    pagination={{
                        pageSize: 10,
                        showTotal: (total) => `${t('total')} ${total} ${t('items')}`,
                        showSizeChanger: true
                    }}
                    scroll={{ x: 1000 }}
                />
            </div>

            {/* Mobile View */}
            <div className="md:hidden">
                {loading ? (
                    <div className="text-center py-8">Loading...</div> // Replace with Skeleton if available
                ) : (
                    list.length > 0 ? (
                        list.map(record => renderMobileCard(record))
                    ) : (
                        <div className="text-center py-8 text-gray-500">{t('no_data')}</div>
                    )
                )}
                {/* Add simple pagination for mobile if needed, or handle via infinite scroll */}
            </div>
        </div>
    );
};

export default EmployeeList;
