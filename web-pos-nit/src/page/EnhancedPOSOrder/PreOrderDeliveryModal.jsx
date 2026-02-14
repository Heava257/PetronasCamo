import React, { useState, useEffect } from "react";
import { Modal, Table, Form, InputNumber, Input, Button, message, Space, Tag, Typography } from "antd";
import Swal from "sweetalert2";
import { request, formatPrice } from "../../util/helper";
import { CheckCircleOutlined } from "@ant-design/icons";
import { useTranslation } from "../../locales/TranslationContext";

const { Text } = Typography;

const PreOrderDeliveryModal = ({ visible, preOrderId, onCancel, onSuccess }) => {
    const { t } = useTranslation();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [preOrder, setPreOrder] = useState(null);
    const [details, setDetails] = useState([]);

    useEffect(() => {
        if (visible && preOrderId) {
            loadPreOrderDetail();
        }
    }, [visible, preOrderId]);

    const loadPreOrderDetail = async () => {
        setLoading(true);
        try {
            const res = await request(`pre-order/${preOrderId}`, "get");
            if (res && res.success) {
                setPreOrder(res.data);
                const items = res.data.details || [];
                setDetails(items);

                // Set initial form values for quantities
                const initialValues = {};
                items.forEach(item => {
                    initialValues[`qty_${item.id}`] = item.remaining_qty > 0 ? item.remaining_qty : 0;
                });
                form.setFieldsValue(initialValues);
            }
        } catch (error) {
            console.error("Error loading pre-order detail:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: t("pre_order.failed_load") || "មិនអាចទាញយកព័ត៌មានបានទេ",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleFinish = async (values) => {
        const deliveries = details
            .filter(item => values[`qty_${item.id}`] > 0)
            .map(item => ({
                pre_order_detail_id: item.id,
                delivered_qty: values[`qty_${item.id}`],
                destination: item.destination
            }));

        if (deliveries.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Warning',
                text: t("pre_order.please_enter_delivery_qty") || "សូមបញ្ចូលបរិមាណដែលត្រូវដឹកជញ្ជូនយ៉ាងហោចណាស់មួយមុខ",
            });
            return;
        }

        setLoading(true);
        try {
            const payload = {
                pre_order_id: preOrderId,
                deliveries: deliveries,
                notes: values.notes
            };

            const res = await request("pre-order/record-delivery", "post", payload);
            if (res && res.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: res.message_kh || (t("pre_order.delivery_recorded") || "បានកត់ត្រាការដឹកជញ្ជូនជោគជ័យ"),
                    showConfirmButton: false,
                    timer: 1500
                });
                onSuccess();
                form.resetFields();
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: res.message || (t("pre_order.save_error") || "មានបញ្ហាពេលរក្សាទុក"),
                });
            }
        } catch (error) {
            console.error("Delivery recording error:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: t("pre_order.system_error") || "កំហុសប្រព័ន្ធ",
            });
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: t("pre_order.product") || "មុខទំនិញ",
            dataIndex: "product_name",
            key: "product_name",
            render: (text) => <span className="khmer-text-product">{text}</span>
        },
        {
            title: t("pre_order.ordered_qty") || "ចំនួនកុម្ម៉ង់",
            dataIndex: "qty",
            key: "qty",
            align: 'center',
            render: (v) => <Text strong>{parseFloat(v).toLocaleString()} L</Text>
        },
        {
            title: t("pre_order.delivered_qty") || "បានដឹករួច",
            dataIndex: "delivered_qty",
            key: "delivered_qty",
            align: 'center',
            render: (v) => <Text type="success">{parseFloat(v || 0).toLocaleString()} L</Text>
        },
        {
            title: t("pre_order.remaining_qty") || "នៅសល់",
            dataIndex: "remaining_qty",
            key: "remaining_qty",
            align: 'center',
            render: (v) => <Text type="danger" strong>{parseFloat(v).toLocaleString()} L</Text>
        },
        {
            title: t("pre_order.current_delivery_qty") || "ចំនួនដឹកលើកនេះ",
            key: "delivery_qty",
            width: 150,
            render: (_, record) => (
                <Form.Item
                    name={`qty_${record.id}`}
                    noStyle
                >
                    <InputNumber
                        min={0}
                        max={parseFloat(record.remaining_qty)}
                        style={{ width: '100%' }}
                        placeholder="0"
                    />
                </Form.Item>
            )
        }
    ];

    return (
        <Modal
            title={
                <span className="khmer-text-product" style={{ fontSize: 18, fontWeight: 'bold' }}>
                    {t("pre_order.delivery_modal_title") || "📦 កត់ត្រាការដឹកជញ្ជូន (Stage 2 & 3)"}
                </span>
            }
            open={visible}
            onCancel={onCancel}
            onOk={form.submit}
            confirmLoading={loading}
            width={800}
            centered
            okText={t("pre_order.record_delivery") || "កត់ត្រាការដឹក"}
            cancelText={t("pre_order.cancel") || "បោះបង់"}
        >
            {preOrder && (
                <div style={{ marginBottom: 15 }}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text>{t("pre_order.po_no_label") || "លេខកម្មង់"}: <Tag color="blue">{preOrder.pre_order_no}</Tag></Text>
                            <Text>{t("pre_order.customer_label") || "អតិថិជន"}: <Text strong className="khmer-text-product">{preOrder.customer_name}</Text></Text>
                        </div>
                    </Space>
                </div>
            )}

            <Form form={form} onFinish={handleFinish} layout="vertical">
                <Table
                    dataSource={details}
                    columns={columns}
                    rowKey="id"
                    pagination={false}
                    loading={loading}
                    bordered
                    size="small"
                />

                <div style={{ marginTop: 20 }}>
                    <Form.Item
                        name="notes"
                        label={<span className="khmer-text-product">{t("pre_order.notes_label") || "មូលហេតុ/កំណត់សម្គាល់ (ប្រសិនបើដឹកមិនគ្រប់)"}</span>}
                    >
                        <Input.TextArea
                            rows={3}
                            placeholder={t("pre_order.notes_placeholder") || "ពន្យល់ពីមូលហេតុដែលដឹកមិនគ្រប់ ឬព័ត៌មានបន្ថែម..."}
                        />
                    </Form.Item>
                </div>
            </Form>

            <div style={{ marginTop: 10, padding: 10, backgroundColor: '#fffbe6', borderRadius: 4, border: '1px solid #ffe58f' }}>
                <Text type="secondary" size="small" className="khmer-text-product">
                    {t("pre_order.delivery_hint") || "💡 ប្រសិនបើអ្នកដឹកជញ្ជូនគ្រប់ចំនួន បរិមាណនៅសល់នឹងក្លាយជា 0 ហើយប័ណ្ណនឹងត្រូវប្តូរទៅជា \"បានដឹកជញ្ជូន\"។"}
                </Text>
            </div>
        </Modal>
    );
};

export default PreOrderDeliveryModal;
