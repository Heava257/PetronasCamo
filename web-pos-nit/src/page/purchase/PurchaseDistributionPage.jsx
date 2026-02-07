
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { request, formatPrice } from "../../util/helper";
import MainPage from "../../component/layout/MainPage";
import {
    Button,
    Card,
    Table,
    Typography,
    Tag,
    Descriptions,
    Space,
    Empty
} from "antd";
import { ArrowLeftOutlined, DropboxOutlined, ReloadOutlined } from "@ant-design/icons";
import { useTranslation } from "../../locales/TranslationContext";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const PurchaseDistributionPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [loading, setLoading] = useState(false);
    const [purchase, setPurchase] = useState(null);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Purchase Details
            const pRes = await request(`purchase/${id}`, "get");
            if (pRes && pRes.list && pRes.list.length > 0) {
                setPurchase(pRes.list[0]);
            } else if (pRes && pRes.data) {
                setPurchase(pRes.data);
            } // Adapt based on actual getById response structure

            // Fetch Distributions
            const dRes = await request(`purchase/${id}/distributions`, "get");
            if (dRes && dRes.success) {
                setHistory(dRes.list || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            'pending': { color: 'orange', text: t('pending') },
            'confirmed': { color: 'blue', text: t('confirmed') },
            'shipped': { color: 'purple', text: t('shipped') },
            'delivered': { color: 'green', text: t('delivered') },
            'cancelled': { color: 'red', text: t('cancelled') },
            'completed': { color: 'green', text: t('completed') }
        };
        const config = statusConfig[status] || statusConfig['pending'];
        return <Tag color={config.color}>{config.text}</Tag>;
    };

    const columns = [
        {
            title: t("date"),
            dataIndex: "created_at",
            key: "created_at",
            render: (val) => dayjs(val).format("DD/MM/YYYY HH:mm")
        },
        {
            title: t("branch"),
            dataIndex: "branch_name",
            key: "branch_name",
            render: (val, record) => (
                <span className="font-semibold">{val || record.receiver_name}</span>
            )
        },
        {
            title: t("product"),
            dataIndex: "product_name",
            key: "product_name",
        },
        {
            title: t("quantity"),
            dataIndex: "quantity",
            key: "quantity",
            align: "right",
            render: (val) => <span className="font-bold text-orange-600">{val} L</span>
        },
        {
            title: t("reference"),
            dataIndex: "reference_no",
            key: "reference_no",
            render: (val) => val ? <Tag>{val}</Tag> : "-"
        },
        {
            title: t("operator"),
            dataIndex: "receiver_name",
            key: "receiver_name",
            render: (val) => val || "-"
        }
    ];

    return (
        <MainPage loading={loading}>
            <div className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Button
                            icon={<ArrowLeftOutlined />}
                            onClick={() => navigate('/purchase-orders')}
                            size="large"
                        />
                        <div>
                            <Title level={2} style={{ margin: 0 }}>
                                {t("distribution_history")}
                            </Title>
                            <Text type="secondary">
                                {t("purchase_order")}: #{purchase?.order_no}
                            </Text>
                        </div>
                    </div>
                    <Button icon={<ReloadOutlined />} onClick={fetchData}>
                        {t("refresh")}
                    </Button>
                </div>

                {/* Purchase Summary */}
                {purchase && (
                    <Card className="mb-6 shadow-sm border-blue-100 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/10">
                        <Descriptions title={t("purchase_details")} column={{ xs: 1, sm: 2, md: 4 }}>
                            <Descriptions.Item label={t("supplier")}>{purchase.supplier_name}</Descriptions.Item>
                            <Descriptions.Item label={t("order_date")}>{dayjs(purchase.order_date).format("DD/MM/YYYY")}</Descriptions.Item>
                            <Descriptions.Item label={t("status")}>{getStatusBadge(purchase.status)}</Descriptions.Item>
                            <Descriptions.Item label={t("total_amount")}>
                                <span className="font-bold text-green-600">{formatPrice(purchase.total_amount)}</span>
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>
                )}

                {/* Distribution Table */}
                <Card
                    title={
                        <Space>
                            <DropboxOutlined className="text-orange-500" />
                            {t("distributions")}
                        </Space>
                    }
                    className="shadow-sm"
                >
                    <Table
                        dataSource={history}
                        columns={columns}
                        rowKey="id"
                        pagination={{ pageSize: 20 }}
                        locale={{ emptyText: <Empty description={t("no_distributions_yet")} /> }}
                    />
                </Card>

            </div>
        </MainPage>
    );
};

export default PurchaseDistributionPage;
