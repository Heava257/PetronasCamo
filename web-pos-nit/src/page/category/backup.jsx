import React, { useEffect, useState } from "react";
import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  InputNumber,
  Radio,
} from "antd";
import { request,isPermission } from "../../util/helper";
import { MdAdd, MdDelete, MdEdit, MdOutlineCreateNewFolder } from "react-icons/md";
import MainPage from "../../component/layout/MainPage";
import { configStore } from "../../store/configStore";
import "./Category.css"; // Your custom CSS
import { getProfile } from "../../store/profile.store";

function CategoryPage() {
  const { config } = configStore();
  const [formRef] = Form.useForm();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('my'); // 'my' | 'group'
  const [state, setState] = useState({
    visibleModal: false,
    id: null,
    name: "",
    description: "",
    status: "",
    parentId: null,
    txtSearch: "",
    barcode: "",
    actual_price: 0,
  });

  useEffect(() => {
    getList();
  }, [viewMode]); // Add viewMode as dependency

  const getList = async () => {
    setLoading(true);

    try {
      let res;
      if (viewMode === 'my') {
        // ទាញទិន្នន័យរបស់ខ្ញុំតែប៉ុណ្ណោះ
        const { id } = getProfile();
        if (!id) {
          setLoading(false);
          return;
        }
        res = await request(`category/user/${id}`, "get");
      } else {
        // ទាញទិន្នន័យទាំងអស់ក្នុង group របស់ខ្ញុំ
        res = await request(`category/my-group`, "get");
      }
      
      if (res) {
        setList(res.list);
      }
    } catch (error) {
      message.error("Error loading categories");
    } finally {
      setLoading(false);
    }
  };

  const onClickEdit = (data) => {
    setState({
      ...state,
      visibleModal: true,
      id: data.id,
    });
    formRef.setFieldsValue({
      id: data.id,
      name: data.name,
      description: data.description,
      status: data.status,
      barcode: data.barcode,
      actual_price: data.actual_price,
    });
  };

  const onClickDelete = async (data) => {
    // Check if user can delete this category
    const { id: currentUserId } = getProfile();
    if (viewMode === 'group' && data.user_id !== currentUserId) {
      message.warning("អ្នកអាចលុបតែប្រភេទដែលអ្នកបានបង្កើតប៉ុណ្ណោះ!");
      return;
    }

    Modal.confirm({
      title: "លុប",
      content: "Are you sure you want to remove this category?",
      okText: "យល់ព្រម",
      cancelText: "បោះបង់",
      onOk: async () => {
        const { id: user_id } = getProfile();
        const res = await request("category", "delete", {
          id: data.id,
          user_id: user_id
        });
        if (res && !res.error) {
          message.success(res.message);
          setList(list.filter((item) => item.id !== data.id));
        }
      },
    });
  };

  const onClickAddBtn = () => {
    setState({
      ...state,
      visibleModal: true,
    });
    formRef.resetFields();
  };

  const onCloseModal = () => {
    formRef.resetFields();
    setState({
      ...state,
      visibleModal: false,
      id: null,
    });
  };

  const onFinish = async (items) => {
    const { id: user_id } = getProfile();
    const data = {
      id: formRef.getFieldValue("id"),
      name: items.name,
      description: items.description,
      status: items.status,
      parent_id: 0,
      barcode: items.barcode,
      actual_price: items.actual_price,
      user_id: user_id,
    };
    const method = data.id ? "put" : "post";

    const res = await request("category", method, data);
    if (res && !res.error) {
      message.success(res.message);
      getList();
      onCloseModal();
    }
  };

  const canEditOrDelete = (record) => {
    const { id: currentUserId } = getProfile();
    return viewMode === 'my' || record.user_id === currentUserId;
  };

  return (
    <MainPage loading={loading}>
      <div className="pageHeader">
        <Space>
          <div className="khmer-title1">ប្រភេទផលិតផល</div>
          <Input.Search
            onChange={(e) => setState((prev) => ({ ...prev, txtSearch: e.target.value }))}
            allowClear
            onSearch={getList}
            placeholder="Search"
          />
        </Space>
        <Space>
          <Radio.Group 
            value={viewMode} 
            onChange={(e) => setViewMode(e.target.value)}
            buttonStyle="solid"
          >
            <Radio.Button value="my">
              <span className="khmer-title1">របស់ខ្ញុំ</span>
            </Radio.Button>
            <Radio.Button value="group">
              <span className="khmer-title1">ក្រុម</span>
            </Radio.Button>
          </Radio.Group>
          <Button type="primary" onClick={onClickAddBtn} icon={<MdOutlineCreateNewFolder />}>
            NEW
          </Button>
        </Space>
      </div>

      <Modal
        open={state.visibleModal}
        title={<div className="khmer-title1">{formRef.getFieldValue("id") ? "កែសម្រួលប្រភេទ" : "ប្រភេទថ្មី"}</div>}
        footer={null}
        onCancel={onCloseModal}
        width={600}
      >
        <Form layout="vertical" onFinish={onFinish} form={formRef}>
          <Form.Item
            name="name"
            label={<div className="khmer-title1">ឈ្មោះប្រភេទ</div>}
            rules={[{ required: true, message: "Please enter category name!" }]}
          >
            <Input placeholder="Input Category name" />
          </Form.Item>

          <Form.Item name="description" label={<div className="khmer-title1">ការពិពណ៌នា</div>}>
            <Input.TextArea placeholder="Enter description" />
          </Form.Item>

          <Form.Item
            name="barcode"
            label={<div className="khmer-title1">បាកូដ</div>}
            rules={[{ required: true, message: "Please enter barcode!" }]}
          >
            <Input placeholder="Enter barcode" />
          </Form.Item>

          <Form.Item
            name="actual_price"
            label={<div className="khmer-title1">មេចែក</div>}
            rules={[{ required: true, message: "Please enter actual price!" }]}
          >
            <InputNumber
              placeholder="Enter actual price"
              style={{ width: "100%" }}
              formatter={(value) =>
                value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : ""
              }
              parser={(value) => value.replace(/(,*)/g, "")}
            />
          </Form.Item>

          <Form.Item name="status" label={<div className="khmer-title1">ស្ថានភាព</div>}>
            <Select
              placeholder="Select status"
              options={[
                { label: <div className="khmer-title1">សកម្ម</div>, value: 1 },
                { label: <div className="khmer-title1">អសកម្ម</div>, value: 0 },
              ]}
            />
          </Form.Item>

          <Space>
            <Button onClick={onCloseModal}>
              <span className="khmer-text1">បោះបង់</span>
            </Button>
            <Button type="primary" htmlType="submit">
              <span className="khmer-title1">{formRef.getFieldValue("id") ? "កែសម្រួល" : "រក្សាទុក"}</span>
            </Button>
          </Space>
        </Form>
      </Modal>

      <Table
        dataSource={list}
        rowKey="id"
        scroll={{ x: 1200 }}
        columns={[
          {
            key: "No",
            title: <div className="khmer-text1">លេខ</div>,
            render: (text, record, index) => index + 1,
            width: 60,
          },
          {
            key: "name",
            title: <div className="khmer-text1">ឈ្មោះ</div>,
            dataIndex: "name",
            render: (text) => <div className="khmer-title1">{text}</div>,
            width: 150,
          },
          {
            key: "description",
            title: <div className="khmer-text1">សេចក្ដីពិពណ៌នា</div>,
            dataIndex: "description",
            render: (text) => <div className="khmer-title1">{text}</div>,
            width: 200,
          },
          {
            key: "barcode",
            title: <div className="khmer-text1">លេខបាកូដ</div>,
            dataIndex: "barcode",
            render: (text) => <div className="khmer-title1">{text}</div>,
            width: 120,
          },
          {
            key: "actual_price",
            title: <div className="khmer-title1">មេចែក</div>,
            dataIndex: "actual_price",
            render: (price) => {
              const formatted = price
                ? parseFloat(price).toLocaleString('en-US', { maximumFractionDigits: 2 })
                : '0.00';
              return <div className="khmer-title1">${formatted}</div>;
            },
            width: 100,
          },
          {
            key: "status",
            title: <div className="khmer-text1">ស្ថានភាព</div>,
            dataIndex: "status",
            render: (status) => (status === 1 ? <Tag color="green">Active</Tag> : <Tag color="red">Inactive</Tag>),
            width: 100,
          },
          // បង្ហាញអ្នកបង្កើត នៅពេលមើលក្រុម
          ...(viewMode === 'group' ? [{
            key: "creator",
            title: <div className="khmer-text1">អ្នកបង្កើត</div>,
            render: (text, record) => {
              const { id: currentUserId } = getProfile();
              const isCurrentUser = record.user_id === currentUserId;
              
              // បើជាខ្លួនឯង
              if (isCurrentUser) {
                return <Tag color="blue">ខ្ញុំ</Tag>;
              }
              
              // បើមានឈ្មោះ បង្ហាញឈ្មោះ
              if (record.created_by_name) {
                return (
                  <div>
                    <Tag color="default">{record.created_by_name}</Tag>
                    {record.created_by_username && (
                      <div style={{ fontSize: '11px', color: '#999' }}>
                        @{record.created_by_username}
                      </div>
                    )}
                  </div>
                );
              }
              
              // បើគ្មានឈ្មោះ បង្ហាញ username
              if (record.created_by_username) {
                return <Tag color="default">@{record.created_by_username}</Tag>;
              }
              
              // fallback
              return <Tag color="default">បុគ្គលិកផ្សេង</Tag>;
            },
            width: 120,
          }] : []),
          {
            key: "Action",
            title: <div className="khmer-text1">សកម្មភាព</div>,
            align: "center",
            render: (item, data) => (
             <Space>
                {isPermission("customer.getone")&&(
                <Button 
                  type="primary" 
                  icon={<MdEdit />} 
                  onClick={() => onClickEdit(data)}
                  
                />
                )}
                 {isPermission("customer.getone")&&(
                <Button 
                  type="primary" 
                  danger 
                  icon={<MdDelete />} 
                  onClick={() => onClickDelete(data)}
                  
                />
                )}
              </Space>
            ),
            width: 120,
            fixed: "right",
          },
        ]}
      />
    </MainPage>
  );
}

export default CategoryPage;