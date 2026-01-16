import React, { useEffect, useState } from "react";
import {
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
} from "antd";
import { 
  MdAdd, 
  MdDelete, 
  MdEdit, 
  MdLocationOn, 
  MdStar, 
  MdStarOutline,
  MdContentPaste 
} from "react-icons/md";
import { request } from "../../util/helper";
import { useTranslation } from "../../locales/TranslationContext";

function CustomerLocationsModal({ visible, onClose, customerId, customerName }) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalState, setModalState] = useState({
    visible: false,
    isEditing: false,
    currentLocation: null,
  });

  // ✅ បន្ថែម state សម្រាប់ការបិទទៅក្នុងស៊ុមតែមួយ
  const [coordinateInput, setCoordinateInput] = useState("");

  // ✅ បន្ថែម useEffect សម្រាប់ការដាក់កូអរដោនេ
  useEffect(() => {
    if (coordinateInput) {
      parseCoordinates(coordinateInput);
    }
  }, [coordinateInput]);

  // ✅ មុខងារសម្រាប់ Parse កូអរដោនេ
  const parseCoordinates = (input) => {
    try {
      // ជម្រះអក្សរ និងចន្លោះទំនេរ
      const cleaned = input.trim();
      
      // បំបែកតាមសញ្ញាក្បៀស
      const parts = cleaned.split(',').map(part => part.trim());
      
      if (parts.length >= 2) {
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        
        if (!isNaN(lat) && !isNaN(lng)) {
          // ដាក់តម្លៃទៅក្នុង Form
          form.setFieldsValue({
            latitude: lat,
            longitude: lng
          });
          
          // ជម្រះស៊ុមបញ្ចូល
          setCoordinateInput("");
          
          message.success(t("coordinates_parsed_successfully"));
          return;
        }
      }
      
      message.error(t("invalid_coordinate_format"));
    } catch (error) {
      console.error("Parse coordinate error:", error);
      message.error(t("failed_to_parse_coordinates"));
    }
  };

  // ✅ មុខងារសម្រាប់ Handle Paste ពី Clipboard
  const handlePasteCoordinates = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setCoordinateInput(text);
      }
    } catch (error) {
      console.error("Paste failed:", error);
      message.error(t("failed_to_paste"));
    }
  };

  // ✅ មុខងារសម្រាប់ពិនិត្យកូអរដោនេពី Google Maps URL
  const extractFromGoogleMapsUrl = (url) => {
    try {
      // Pattern 1: https://www.google.com/maps?q=11.58799,104.93009
      const qParamMatch = url.match(/q=([\d\.-]+),([\d\.-]+)/);
      if (qParamMatch) {
        return {
          lat: parseFloat(qParamMatch[1]),
          lng: parseFloat(qParamMatch[2])
        };
      }
      
      // Pattern 2: https://www.google.com/maps/@11.58799,104.93009,15z
      const atParamMatch = url.match(/@([\d\.-]+),([\d\.-]+)/);
      if (atParamMatch) {
        return {
          lat: parseFloat(atParamMatch[1]),
          lng: parseFloat(atParamMatch[2])
        };
      }
      
      // Pattern 3: /@11.58799,104.93009,15z
      const directMatch = url.match(/([\d\.-]+),([\d\.-]+)/);
      if (directMatch) {
        return {
          lat: parseFloat(directMatch[1]),
          lng: parseFloat(directMatch[2])
        };
      }
      
      return null;
    } catch (error) {
      console.error("Extract from URL error:", error);
      return null;
    }
  };

  useEffect(() => {
    if (visible && customerId) {
      loadLocations();
    }
  }, [visible, customerId]);

  const loadLocations = async () => {
    setLoading(true);
    try {
      const res = await request(`locations/customer/${customerId}`, "get");
      if (res && res.success) {
        setLocations(res.locations || []);
      } else {
        message.error(t("failed_to_load_locations"));
      }
    } catch (error) {
      console.error("Error loading locations:", error);
      message.error(t("failed_to_load_locations"));
    } finally {
      setLoading(false);
    }
  };

  const handleAddLocation = () => {
    setModalState({
      visible: true,
      isEditing: false,
      currentLocation: null,
    });
    form.resetFields();
    form.setFieldsValue({
      customer_id: customerId,
      status: 1,
      is_default: false,
      default_price_adjustment: 0,
    });
    setCoordinateInput(""); // ជម្រះស៊ុមបញ្ចូល
  };

  const handleEditLocation = (location) => {
    setModalState({
      visible: true,
      isEditing: true,
      currentLocation: location,
    });
    form.setFieldsValue({
      ...location,
      // ✅ បម្លែងតម្លៃជា number
      latitude: location.latitude ? Number(location.latitude) : undefined,
      longitude: location.longitude ? Number(location.longitude) : undefined,
      default_price_adjustment: location.default_price_adjustment ? Number(location.default_price_adjustment) : 0,
    });
    setCoordinateInput(""); // ជម្រះស៊ុមបញ្ចូល
  };

  const handleDeleteLocation = (location) => {
    Modal.confirm({
      title: t("delete_location"),
      content: t("delete_location_confirm").replace("{name}", location.location_name),
      onOk: async () => {
        try {
          const res = await request(`locations/${location.id}`, "delete");
          if (res && res.success) {
            message.success(res.message || t("location_deleted"));
            loadLocations();
          } else {
            message.error(res?.message || t("failed_to_delete"));
          }
        } catch (error) {
          console.error("Delete Error:", error);
          message.error(t("failed_to_delete"));
        }
      },
    });
  };

  const handleSetDefault = async (location) => {
    try {
      const res = await request(`locations/${location.id}/set-default`, "patch");
      if (res && res.success) {
        message.success(t("default_location_set"));
        loadLocations();
      } else {
        message.error(res?.message || t("failed_to_set_default"));
      }
    } catch (error) {
      console.error("Set Default Error:", error);
      message.error(t("failed_to_set_default"));
    }
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const { isEditing, currentLocation } = modalState;
      
      if (isEditing) {
        const res = await request(`locations/${currentLocation.id}`, "put", values);
        if (res && res.success) {
          message.success(t("location_updated"));
          setModalState({ visible: false, isEditing: false, currentLocation: null });
          loadLocations();
        } else {
          message.error(res?.message || t("failed_to_update"));
        }
      } else {
        const res = await request("locations", "post", values);
        if (res && res.success) {
          message.success(t("location_created"));
          setModalState({ visible: false, isEditing: false, currentLocation: null });
          loadLocations();
        } else {
          message.error(res?.message || t("failed_to_create"));
        }
      }
    } catch (error) {
      console.error("Validation or API error:", error);
      message.error(t("failed_to_save"));
    }
  };

  const handleModalCancel = () => {
    setModalState({ visible: false, isEditing: false, currentLocation: null });
    form.resetFields();
  };

  const columns = [
    {
      title: "#",
      key: "index",
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: t("location_name"),
      dataIndex: "location_name",
      key: "location_name",
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MdLocationOn style={{ color: record.is_default ? '#faad14' : '#1890ff', fontSize: '18px' }} />
          <span style={{ fontWeight: record.is_default ? '600' : '400' }}>
            {text}
          </span>
          {record.is_default && (
            <Tag color="gold" style={{ marginLeft: '8px' }}>
              {t("default")}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: t("address"),
      dataIndex: "address",
      key: "address",
      ellipsis: {
        showTitle: false,
      },
      render: (address) => (
        <Tooltip placement="topLeft" title={address}>
          {address || "-"}
        </Tooltip>
      ),
    },
    {
      title: t("coordinates"),
      key: "coordinates",
      width: 150,
      render: (_, record) => {
        if (record.latitude && record.longitude) {
          return (
            <Tooltip title={t("click_to_view_map")}>
              <a
                href={`https://www.google.com/maps?q=${record.latitude},${record.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#1890ff' }}
              >
                📍 {Number(record.latitude).toFixed(4)}, {Number(record.longitude).toFixed(4)}
              </a>
            </Tooltip>
          );
        }
        return "-";
      },
    },
    {
      title: t("price_adjustment"),
      dataIndex: "default_price_adjustment",
      key: "default_price_adjustment",
      width: 120,
      align: "right",
      render: (value) => {
        if (!value || value === 0) return "-";
        const color = value > 0 ? "green" : "red";
        return (
          <Tag color={color}>
            {value > 0 ? "+" : ""}{Number(value).toFixed(2)}
          </Tag>
        );
      },
    },
    {
      title: t("status"),
      dataIndex: "status",
      key: "status",
      width: 100,
      align: "center",
      render: (status) => (
        <Tag color={status ? "green" : "red"}>
          {status ? t("active") : t("inactive")}
        </Tag>
      ),
    },
    {
      title: t("action"),
      key: "action",
      width: 180,
      align: "center",
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          {!record.is_default && (
            <Tooltip title={t("set_as_default")}>
              <Button
                type="text"
                icon={<MdStarOutline style={{ fontSize: '18px', color: '#faad14' }} />}
                onClick={() => handleSetDefault(record)}
                size="small"
              />
            </Tooltip>
          )}
          {record.is_default && (
            <Tooltip title={t("default_location")}>
              <MdStar style={{ fontSize: '18px', color: '#faad14' }} />
            </Tooltip>
          )}
          <Button
            type="primary"
            icon={<MdEdit />}
            onClick={() => handleEditLocation(record)}
            size="small"
          />
          <Button
            type="primary"
            danger
            icon={<MdDelete />}
            onClick={() => handleDeleteLocation(record)}
            size="small"
            disabled={record.is_default}
          />
        </Space>
      ),
    },
  ];

  return (
    <>
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MdLocationOn style={{ fontSize: '24px', color: '#1890ff' }} />
            <div>
              <div style={{ fontSize: '18px', fontWeight: '600' }}>
                {t("manage_locations")}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '400', color: '#888' }}>
                {customerName}
              </div>
            </div>
          </div>
        }
        open={visible}
        onCancel={onClose}
        footer={[
          <Button key="close" onClick={onClose}>
            {t("close")}
          </Button>,
        ]}
        width={1200}
        centered
      >
        <div style={{ marginBottom: '16px' }}>
          <Button
            type="primary"
            icon={<MdAdd />}
            onClick={handleAddLocation}
          >
            {t("add_location")}
          </Button>
        </div>

        <Table
          dataSource={locations}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `${t("total")} ${total} ${t("items")}`,
          }}
          scroll={{ x: 1000 }}
        />
      </Modal>

      {/* Add/Edit Location Modal */}
      <Modal
        title={
          modalState.isEditing
            ? t("edit_location")
            : t("add_location")
        }
        open={modalState.visible}
        onOk={handleModalSubmit}
        onCancel={handleModalCancel}
        width={700}
        okText={t("save")}
        cancelText={t("cancel")}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="customer_id" hidden>
            <Input />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="location_name"
                label={t("location_name")}
                rules={[{ required: true, message: t("location_name_required") }]}
              >
                <Input placeholder={t("enter_location_name")} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label={t("status")}
                valuePropName="checked"
              >
                <Switch
                  checkedChildren={t("active")}
                  unCheckedChildren={t("inactive")}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="address"
            label={t("address")}
            rules={[{ required: true, message: t("address_required") }]}
          >
            <Input.TextArea rows={3} placeholder={t("enter_full_address")} />
          </Form.Item>

          {/* ✅ បន្ថែមស៊ុមសម្រាប់បិទទៅក្នុងកូអរដោនេពីរជួររាងយក */}
          <Form.Item
            label={t("paste_coordinates")}
            tooltip={t("paste_coordinates_tooltip")}
          >
            <div style={{ display: 'flex', gap: '8px' }}>
              <Input
                placeholder="11.58799,104.93009 ឬ https://maps.google.com/..."
                value={coordinateInput}
                onChange={(e) => setCoordinateInput(e.target.value)}
                onPressEnter={() => parseCoordinates(coordinateInput)}
              />
              <Tooltip title={t("paste_from_clipboard")}>
                <Button 
                  icon={<MdContentPaste />}
                  onClick={handlePasteCoordinates}
                />
              </Tooltip>
              <Button
                type="primary"
                onClick={() => parseCoordinates(coordinateInput)}
              >
                {t("parse")}
              </Button>
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              {t("coordinate_format_hint")}
            </div>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="latitude"
                label={t("latitude")}
                rules={[
                  {
                    validator: (_, value) => {
                      if (value === undefined || value === null || value === '') {
                        return Promise.resolve();
                      }
                      const num = Number(value);
                      if (isNaN(num) || num < -90 || num > 90) {
                        return Promise.reject(new Error(t("invalid_latitude")));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input
                  placeholder="11.58799"
                  onChange={(e) => {
                    const value = e.target.value;
                    // បម្លែងទៅជា number បើអាច
                    const num = parseFloat(value);
                    if (!isNaN(num)) {
                      form.setFieldValue('latitude', num);
                    }
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="longitude"
                label={t("longitude")}
                rules={[
                  {
                    validator: (_, value) => {
                      if (value === undefined || value === null || value === '') {
                        return Promise.resolve();
                      }
                      const num = Number(value);
                      if (isNaN(num) || num < -180 || num > 180) {
                        return Promise.reject(new Error(t("invalid_longitude")));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input
                  placeholder="104.93009"
                  onChange={(e) => {
                    const value = e.target.value;
                    const num = parseFloat(value);
                    if (!isNaN(num)) {
                      form.setFieldValue('longitude', num);
                    }
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="default_price_adjustment"
            label={t("price_adjustment")}
            tooltip={t("price_adjustment_tooltip")}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="0.00"
              step={0.01}
              precision={2}
              prefix="$"
              formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item
            name="is_default"
            label={t("set_as_default_location")}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="notes"
            label={t("notes")}
          >
            <Input.TextArea rows={3} placeholder={t("enter_notes")} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default CustomerLocationsModal;