// ✅ FINAL InventoryTransactionPage.jsx - Using converted_amount from backend

import React, { useEffect, useState } from "react";
import { request } from "../../util/helper";
import MainPage from "../../component/layout/MainPage";
import {
    Table,
    Tag,
    Typography,
    Row,
    Col,
    Input,
    Select,
    DatePicker,
    Card,
    Space,
    Statistic,
    Tooltip,
    Modal,
    Form,
    Button,
    Divider
} from "antd";
import dayjs from "dayjs";
import {
    SearchOutlined,
    HistoryOutlined,
    DollarOutlined,
    RiseOutlined,
    FallOutlined,
    InfoCircleOutlined,
    FormOutlined
} from '@ant-design/icons';
import { useTranslation } from "../../locales/TranslationContext";
import { useAuth } from "../../hooks/useAuth.js";
import { getProfile, getPermission } from "../../store/profile.store";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

function InventoryTransactionPage() {
    const { t } = useTranslation();
    const { isAuthenticated } = useAuth();

    // Check if user is Admin
    const profile = getProfile();
    const permissions = getPermission();
    const isAdmin = profile?.role_name === 'Admin' || profile?.role_name === 'admin' ||
        (permissions && permissions.includes('inventory_edit'));

    const [state, setState] = useState({
        list: [],
        loading: false,
        total: 0,
        page: 1,
        pageSize: 10,
        txtSearch: "",
        status: null,
        dateRange: null,
        statistics: {
            totalIn: 0,
            totalOut: 0,
            totalValue: 0,
            totalQtyIn: 0,
            totalQtyOut: 0,
            currentStock: 0
        },
        categoryStats: [] // ✅ New state for category-wise breakdown
    });

    useEffect(() => {
        getList();
    }, [state.page, state.pageSize, state.txtSearch, state.status, state.dateRange]);

    const getList = async () => {
        setState(p => ({ ...p, loading: true }));

        const params = {
            page: state.page,
            pageSize: state.pageSize,
            txtSearch: state.txtSearch,
            status: state.status,
            from_date: state.dateRange ? state.dateRange[0].format('YYYY-MM-DD') : null,
            to_date: state.dateRange ? state.dateRange[1].format('YYYY-MM-DD') : null
        };

        // ✅ Fetch Transactions
        const res = await request("inventory/transactions", "get", params);

        // ✅ Fetch Category Statistics (Gasoline, Diesel breakdown)
        const catRes = await request("inventory/category-statistics", "get");

        if (res && !res.error) {
            const list = res.list || [];

            // ✅ Use global statistics from backend
            const stats = {
                totalIn: Number(res.statistics?.total_in || 0),
                totalOut: Number(res.statistics?.total_out || 0),
                totalValue: Number(res.statistics?.net_value || 0),
                totalQtyIn: Number(res.statistics?.total_qty_in || 0),
                totalQtyOut: Number(res.statistics?.total_qty_out || 0),
                currentStock: Number(res.statistics?.current_stock || 0)
            };

            setState(p => ({
                ...p,
                list,
                total: res.total || 0,
                statistics: stats,
                categoryStats: catRes?.data || [], // ✅ Store category stats
                loading: false
            }));
        } else {
            setState(p => ({ ...p, loading: false }));
        }
    };

    const getTransactionColor = (type) => {
        switch (type) {
            case 'PURCHASE_IN': return 'green';
            case 'SALE_OUT': return 'blue';
            case 'ADJUSTMENT': return 'orange';
            case 'RETURN': return 'red';
            default: return 'default';
        }
    };

    const [isSellingPriceModalVisible, setIsSellingPriceModalVisible] = useState(false);
    const [editingSellingPriceRecord, setEditingSellingPriceRecord] = useState(null);
    const [sellingPriceForm] = Form.useForm();

    const handleEditSellingPrice = (record) => {
        // ✅ Load selling_price (not unit_price!)
        const currentSellingPrice = Number(record.selling_price || 0);

        setEditingSellingPriceRecord(record);
        sellingPriceForm.setFieldsValue({
            selling_price: currentSellingPrice
        });
        setIsSellingPriceModalVisible(true);
    };
    const handleUpdateSellingPrice = async () => {
        try {
            const values = await sellingPriceForm.validateFields();
            const newSellingPrice = values.selling_price;
            const qty = Math.abs(Number(editingSellingPriceRecord.quantity || 0));

    

            // Backend updateTransaction now accepts both unit_price and selling_price
            const res = await request("inventory/transaction", "put", {
                id: editingSellingPriceRecord.id,
                unit_price: newSellingPrice,
                selling_price: newSellingPrice
            });

            if (res && !res.error) {
                setIsSellingPriceModalVisible(false);
                setEditingSellingPriceRecord(null);
                getList(); // Refresh list
            } else {
                console.error("API Error:", res);
            }
        } catch (error) {
            console.error("Update selling price failed:", error);
        }
    };

    const columns = [
        {
            title: t("No"),
            key: "no",
            width: 60,
            render: (_, __, index) => (state.page - 1) * state.pageSize + index + 1
        },
        {
            title: t("date"),
            dataIndex: "created_at",
            key: "created_at",
            render: (date) => dayjs(date).format("DD/MM/YYYY HH:mm"),
            width: 150
        },
        {
            title: t("product"),
            dataIndex: "product_name",
            key: "product_name",
            render: (text, record) => (
                <div>
                    <div className="font-medium">{text || 'N/A'}</div>
                    <div className="text-xs text-gray-500">{record.product_code || ''}</div>
                </div>
            )
        },
        {
            title: t("type"),
            dataIndex: "transaction_type",
            key: "transaction_type",
            render: (type) => (
                <Tag color={getTransactionColor(type)}>
                    {t(type?.toLowerCase() || type)}
                </Tag>
            ),
            width: 120
        },
        {
            title: (
                <Tooltip title="បរិមាណក្នុង Liters">
                    <span>{t("quantity")} (L) <InfoCircleOutlined /></span>
                </Tooltip>
            ),
            dataIndex: "quantity",
            key: "quantity",
            render: (qty, record) => {
                const isPositive = record.transaction_type === 'PURCHASE_IN' ||
                    record.transaction_type === 'RETURN' ||
                    (record.transaction_type === 'ADJUSTMENT' && qty > 0);
                return (
                    <span className={isPositive ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                        {qty > 0 ? '+' : ''}{Number(qty).toFixed(2)}
                    </span>
                );
            },
            width: 120,
            align: 'right'
        },
        // ✅ CORRECT CODE
        {
            title: (
                <Tooltip title="តម្លៃលក់ចេញក្នុង 1 Liter (អាចកែប្រែបាន)">
                    <span className="text-blue-600 font-semibold">
                        {t("selling_price")} ($) <InfoCircleOutlined />
                    </span>
                </Tooltip>
            ),
            key: "selling_price",
            render: (_, record) => {
                // ✅ FIX: Use selling_price field!
                const sellingPrice = Number(record.selling_price || 0);

                return (
                    <div className="flex items-center justify-end gap-2 group">
                        <span className="font-bold text-blue-600 text-base">
                            ${sellingPrice.toFixed(2)}
                        </span>
                        {isAdmin && (
                            <Button
                                type="text"
                                size="small"
                                icon={<FormOutlined className="text-green-500" />}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleEditSellingPrice(record)}
                            />
                        )}
                    </div>
                );
            },
            width: 150,
            align: 'right'
        },
        {
            title: (
                <Tooltip title="តម្លៃទិញចូលក្នុង 1 Liter (Purchase Price)">
                    <span>{t("unit_price")} <InfoCircleOutlined /></span>
                </Tooltip>
            ),
            dataIndex: "unit_price",
            key: "unit_price",
            render: (price, record) => (
                <div className="flex items-center justify-end">
                    <span className="font-medium text-gray-700">
                        ${Number(price || 0).toFixed(2)}
                    </span>
                </div>
            ),
            width: 120,
            align: 'right'
        },
        {
            title: (
                <Tooltip title="តម្លៃសរុបបន្ទាប់ពីបម្លែង: (qty × unit_price) / actual_price">
                    <span className="font-semibold text-purple-600">
                        {t("amount")} <InfoCircleOutlined />
                    </span>
                </Tooltip>
            ),
            dataIndex: "converted_amount",
            key: "converted_amount",
            render: (amount, record) => {
                const isPositive = amount >= 0;
                return (
                    <Tooltip title={`Calculation: (${record.quantity} × ${record.unit_price}) / ${record.actual_price || 1}`}>
                        <span className={isPositive ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                            ${Math.abs(Number(amount || 0)).toFixed(2)}
                        </span>
                    </Tooltip>
                );
            },
            width: 140,
            align: 'right'
        },
        {
            title: t("reference"),
            dataIndex: "reference_no",
            key: "reference_no",
            width: 120
        },
        {
            title: t("operator"),
            dataIndex: "created_by_name",
            key: "created_by_name",
            width: 120
        }
    ];

    return (
        <MainPage loading={state.loading}>
            <div className="px-2 sm:px-4 lg:px-6">
                {/* Header with Statistics */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                        <Title level={4} className="m-0 flex items-center gap-2">
                            <HistoryOutlined className="text-blue-500" />
                            {t("inventory_transactions")}
                        </Title>
                    </div>

                    {/* Statistics Cards */}
                    <Row gutter={[16, 16]} className="mb-4">
                        <Col xs={24} sm={8}>
                            <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 border-green-200">
                                <div className="flex justify-between items-start">
                                    <Statistic
                                        title={
                                            <span className="flex items-center gap-2">
                                                <RiseOutlined className="text-green-600" />
                                                {t("total_purchases")}
                                            </span>
                                        }
                                        value={state.statistics.totalIn}
                                        precision={2}
                                        prefix="$"
                                        valueStyle={{ color: '#16a34a', fontWeight: 'bold' }}
                                    />
                                    <div className="text-right">
                                        <div className="text-xs text-gray-500 mb-1">{t("total_liters")} IN</div>
                                        <div className="text-lg font-bold text-green-700">{Number(state.statistics.totalQtyIn).toLocaleString()} L</div>
                                    </div>
                                </div>
                                <Text className="text-xs text-gray-500 mt-2 block">សរុបការទិញចូល (បម្លែងជា $) {t("and")} (L)</Text>
                            </Card>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 border-blue-200">
                                <div className="flex justify-between items-start">
                                    <Statistic
                                        title={
                                            <span className="flex items-center gap-2">
                                                <FallOutlined className="text-blue-600" />
                                                {t("total_sales")}
                                            </span>
                                        }
                                        value={state.statistics.totalOut}
                                        precision={2}
                                        prefix="$"
                                        valueStyle={{ color: '#2563eb', fontWeight: 'bold' }}
                                    />
                                    <div className="text-right">
                                        <div className="text-xs text-gray-500 mb-1">{t("total_liters")} OUT</div>
                                        <div className="text-lg font-bold text-blue-700">{Number(state.statistics.totalQtyOut).toLocaleString()} L</div>
                                    </div>
                                </div>
                                <Text className="text-xs text-gray-500 mt-2 block">សរុបការលក់ចេញ (បម្លែងជា $) {t("and")} (L)</Text>
                            </Card>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 border-purple-200 shadow-md">
                                <div className="flex justify-between items-start">
                                    <Statistic
                                        title={
                                            <span className="flex items-center gap-2">
                                                <DollarOutlined className="text-purple-600" />
                                                {t("net_value")}
                                            </span>
                                        }
                                        value={state.statistics.totalValue}
                                        precision={2}
                                        prefix="$"
                                        valueStyle={{
                                            color: state.statistics.totalValue >= 0 ? '#16a34a' : '#dc2626',
                                            fontWeight: 'bold'
                                        }}
                                    />
                                    <div className="text-right">
                                        <div className="text-xs text-purple-600 mb-1 font-semibold">{t("remaining_stock")}</div>
                                        <div className="text-xl font-extrabold text-purple-700 bg-white/50 px-2 rounded">{Number(state.statistics.currentStock).toLocaleString()} L</div>
                                    </div>
                                </div>
                                <Text className="text-xs text-gray-500 mt-2 block">តម្លៃសុទ្ធសរុប {t("and")} ស្តុកដែលនៅសល់បច្ចុប្បន្ន</Text>
                            </Card>
                        </Col>
                    </Row>

                    {/* ✅ NEW: Category Stock Breakdown (Gasoline, Diesel, etc.) */}
                    <div className="mb-6">
                        <Title level={5} className="mb-3 flex items-center gap-2">
                            <span className="text-gray-600">📊 ព័ត៌មានស្តុកតាមប្រភេទផលិតផល (Stock Breakdown)</span>
                        </Title>
                        <Row gutter={[16, 16]}>
                            {state.categoryStats.length === 0 ? (
                                <Col span={24}>
                                    <Card className="text-center text-gray-400 py-4">
                                        មិនទាន់មានទិន្នន័យតាមប្រភេទផលិតផលនៅឡើយទេ
                                    </Card>
                                </Col>
                            ) : (
                                state.categoryStats.map((cat, idx) => (
                                    <Col xs={12} sm={8} md={6} lg={4} key={cat.product_id || idx}>
                                        <Card
                                            size="small"
                                            className="hover:shadow-md transition-shadow cursor-default border-blue-100 bg-blue-50/30"
                                        >
                                            <div className="flex flex-col gap-1">
                                                <Text strong className="text-blue-700 block truncate" title={cat.product_name}>
                                                    {cat.product_name}
                                                </Text>
                                                <div className="flex justify-between items-baseline">
                                                    <Text className="text-[10px] text-gray-500">សរុបចូល (IN):</Text>
                                                    <Text className="text-xs text-blue-600">
                                                        {Number(cat.total_qty_in || 0).toLocaleString()} L
                                                    </Text>
                                                </div>
                                                <div className="flex justify-between items-baseline">
                                                    <Text className="text-[10px] text-gray-500">សរុបចេញ (OUT):</Text>
                                                    <Text className="text-xs text-orange-600">
                                                        {Number(cat.total_qty_out || 0).toLocaleString()} L
                                                    </Text>
                                                </div>
                                                <div className="flex justify-between items-baseline border-t border-gray-100 pt-1 mt-1">
                                                    <Text className="text-xs text-gray-500">ស្តុកនៅសល់:</Text>
                                                    <Text strong className={`text-sm ${Number(cat.total_qty || 0) <= 0 ? 'text-red-500' : 'text-blue-700'}`}>
                                                        {Number(cat.total_qty || 0).toLocaleString()} L
                                                    </Text>
                                                </div>
                                                <div className="flex justify-between items-baseline">
                                                    <Text className="text-xs text-gray-500">តម្លៃសរុប:</Text>
                                                    <Text strong className="text-sm text-green-600">
                                                        ${Number(cat.total_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </Text>
                                                </div>
                                            </div>
                                        </Card>
                                    </Col>
                                ))
                            )}
                        </Row>
                        <Divider className="my-4" />
                    </div>

                    {/* Filters */}
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={8} md={6}>
                            <Input
                                placeholder={t("search_product_or_ref")}
                                prefix={<SearchOutlined />}
                                allowClear
                                size="large"
                                onChange={(e) => setState(p => ({ ...p, txtSearch: e.target.value, page: 1 }))}
                            />
                        </Col>
                        <Col xs={24} sm={8} md={6}>
                            <Select
                                placeholder={t("filter_by_type")}
                                allowClear
                                size="large"
                                style={{ width: '100%' }}
                                onChange={(value) => setState(p => ({ ...p, status: value, page: 1 }))}
                            >
                                <Option value="PURCHASE_IN">{t("purchase_in")}</Option>
                                <Option value="SALE_OUT">{t("sale_out")}</Option>
                                <Option value="ADJUSTMENT">{t("adjustment")}</Option>
                                <Option value="RETURN">{t("return")}</Option>
                            </Select>
                        </Col>
                        <Col xs={24} sm={8} md={8}>
                            <RangePicker
                                size="large"
                                style={{ width: '100%' }}
                                onChange={(dates) => setState(p => ({ ...p, dateRange: dates, page: 1 }))}
                                format="DD/MM/YYYY"
                            />
                        </Col>
                    </Row>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                    <Table
                        dataSource={state.list}
                        columns={columns}
                        rowKey="id"
                        pagination={{
                            current: state.page,
                            pageSize: state.pageSize,
                            total: state.total,
                            onChange: (page, pageSize) => setState(p => ({ ...p, page, pageSize })),
                            showSizeChanger: true,
                            showTotal: (total) => `${t("Total")} ${total} ${t("items")}`,
                            pageSizeOptions: ['10', '20', '50', '100']
                        }}
                        scroll={{ x: true }}
                        summary={(pageData) => {
                            const pageTotal = pageData.reduce((sum, record) => {
                                return sum + Number(record.converted_amount || 0);
                            }, 0);

                            const pageTotalIn = pageData.reduce((sum, record) => {
                                if (record.transaction_type === 'PURCHASE_IN') {
                                    return sum + Number(record.converted_amount || 0);
                                }
                                return sum;
                            }, 0);

                            const pageTotalOut = pageData.reduce((sum, record) => {
                                if (record.transaction_type === 'SALE_OUT') {
                                    return sum + Math.abs(Number(record.converted_amount || 0));
                                }
                                return sum;
                            }, 0);

                            const pageQtyIn = pageData.reduce((sum, record) => {
                                const isPositive = record.transaction_type === 'PURCHASE_IN' ||
                                    record.transaction_type === 'RETURN' ||
                                    (record.transaction_type === 'ADJUSTMENT' && record.quantity > 0);
                                return isPositive ? sum + Number(record.quantity || 0) : sum;
                            }, 0);

                            const pageQtyOut = pageData.reduce((sum, record) => {
                                const isNegative = record.transaction_type === 'SALE_OUT' ||
                                    (record.transaction_type === 'ADJUSTMENT' && record.quantity < 0);
                                return isNegative ? sum + Math.abs(Number(record.quantity || 0)) : sum;
                            }, 0);

                            return (
                                <Table.Summary fixed>
                                    <Table.Summary.Row className="bg-gray-100 dark:bg-gray-700 font-bold">
                                        <Table.Summary.Cell index={0} colSpan={6}>
                                            <Text strong className="text-base">
                                                {t("page_total")}
                                            </Text>
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={6} align="right">
                                            <Text strong className="text-base text-purple-600">
                                                ${Math.abs(pageTotal).toFixed(2)}
                                            </Text>
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={7} colSpan={2}>
                                            <Space split="|" size="small">
                                                <Tooltip title="Total In (Value | Qty)">
                                                    <Text className="text-green-600 text-sm font-semibold">
                                                        In: ${pageTotalIn.toFixed(2)} | {pageQtyIn.toFixed(2)} L
                                                    </Text>
                                                </Tooltip>
                                                <Tooltip title="Total Out (Value | Qty)">
                                                    <Text className="text-blue-600 text-sm font-semibold">
                                                        Out: ${pageTotalOut.toFixed(2)} | {pageQtyOut.toFixed(2)} L
                                                    </Text>
                                                </Tooltip>
                                            </Space>
                                        </Table.Summary.Cell>
                                    </Table.Summary.Row>
                                </Table.Summary>
                            );
                        }}
                    />
                </div>
            </div>

            {/* Selling Price Edit Modal */}
            <Modal
                title="កែប្រែតម្លៃលក់ចេញ"
                open={isSellingPriceModalVisible}
                onOk={handleUpdateSellingPrice}
                onCancel={() => {
                    setIsSellingPriceModalVisible(false);
                    setEditingSellingPriceRecord(null);
                }}
            >
                <Form form={sellingPriceForm} layout="vertical">
                    <Form.Item
                        name="selling_price"
                        label="តម្លៃលក់ចេញក្នុង 1 Liter ($)"
                        rules={[{ required: true, message: 'សូមបនិចតម្លៃលក់ចេញ' }]}
                    >
                        <Input
                            type="number"
                            step="0.01"
                            min={0}
                            placeholder="បញ្ចូលតម្លៃលក់ចេញក្នុង 1 Liter"
                        />
                    </Form.Item>
                    <div className="text-xs text-gray-500 mt-2">
                        កំណែត: នេះតម្លៃលក់ចេញថ្មី × បរិមាណ
                    </div>
                </Form>
            </Modal>
        </MainPage>
    );
}

export default InventoryTransactionPage;