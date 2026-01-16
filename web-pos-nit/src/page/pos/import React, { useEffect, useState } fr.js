import React, { useEffect, useState } from "react";
import { formatDateServer, request } from "../../util/helper";
import {
  Button,
  Col,
  Form,
  Image,
  Input,
  message,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Upload,
} from "antd";
import { configStore } from "../../store/configStore";
import { MdOutlineCreateNewFolder } from "react-icons/md";
import { UploadOutlined, FileImageOutlined } from "@ant-design/icons";
import { Config } from "../../util/config";
import { IoEyeOutline } from "react-icons/io5";
import imageExtensions from 'image-extensions';
import dayjs from "dayjs";

function TotalDuePage() {
 
  const { config } = configStore();
  const [state, setState] = useState({
    list: [],
    loading: false,
    visible: false,
  });

  useEffect(() => {
    getList();
  }, []);

  // Function to convert file to base64
 
  // Fetch totaldue list
  const getList = async () => {
    const res = await request("totaldue/get-list", "get");
    if (res && !res.error) {
      setState((pre) => ({
        ...pre,
        list: res.list,
      }));
    }
  };

  // Handle edit totaldue
  const onClickEdit = (item) => {
    // Set form values
    form.setFieldsValue({
      ...item,
    });

    // Open the modal
    setState((pre) => ({
      ...pre,
      visible: true,
    }));

    // Initialize imageDefault if the payment has a bank slip image
    if (item.bank_slip && item.bank_slip !== "") {
      const bankSlipImage = [
        {
          uid: "-1", // Unique ID for the file
          name: item.bank_slip, // File name
          status: "done", // File status
          url: Config.getFullImagePath(item.bank_slip), // Use Config helper function
        },
      ];
      setImageDefault(bankSlipImage); // Set the imageDefault state
    } else {
      setImageDefault([]); // Clear the imageDefault state if no image exists
    }
  };

  // Handle delete totaldue
  const clickBtnDelete = (item) => {
    Modal.confirm({
      title: "Delete",
      content: "Are you sure you want to remove this payment?",
      onOk: async () => {
        const res = await request("totaldue", "delete", { id: item.id });
        if (res && !res.error) {
          message.success(res.message);
          const newList = state.list.filter((item1) => item1.id !== item.id);
          setState((prev) => ({
            ...prev,
            list: newList,
          }));
        } else {
          message.error(res.message || "This payment cannot be deleted because it is linked to other records.");
        }
      },
    });
  };

  // Close modal
  const handleCloseModal = () => {
    setState((pre) => ({
      ...pre,
      visible: false,
    }));
    form.resetFields();
    setImageDefault([]);
  };

  // Open modal
  const handleOpenModal = () => {
    setState((pre) => ({
      ...pre,
      visible: true,
    }));
    form.resetFields();
    setImageDefault([]);
  };

  // Validate file before upload
  const beforeUpload = (file) => {
    // Get the file extension
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    // Check if the extension is in the list of valid image extensions
    const isValidExtension = imageExtensions.includes(fileExtension);
    
    // Check if the file type starts with 'image/'
    const isImage = file.type.startsWith('image/');
    
    if (!isValidExtension || !isImage) {
      message.error('You can only upload image files!');
    }
    
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Image must be smaller than 2MB!');
    }
    

    return isValidExtension && isImage && isLt2M;
  };

  // Handle form submission
  

  // Handle image preview
  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    setPreviewImage(file.url || file.preview);
    setPreviewOpen(true);
  };

  // Handle file list changes
  const handleChangeImageDefault = ({ fileList: newFileList }) => {
    // Log information about the files
    if (newFileList.length > 0 && newFileList[0].originFileObj) {
      const file = newFileList[0].originFileObj;

    }
    
    setImageDefault(newFileList);
  };

  // Handle search 
  const handleSearch = (value) => {
    const filtered = state.list.filter(payment => 
      payment.description?.toLowerCase().includes(value.toLowerCase()) || 
      payment.payment_method?.toLowerCase().includes(value.toLowerCase())
    );
    
    setState(prev => ({
      ...prev,
      filteredList: filtered
    }));
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          paddingBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div>Total Due</div>
          <Space>
            <Input.Search 
              style={{ marginLeft: 10 }} 
              placeholder="Search" 
              onSearch={handleSearch}
            />
          </Space>
        </div>
        <Button type="primary" onClick={handleOpenModal} icon={<MdOutlineCreateNewFolder />}>
          New
        </Button>
      </div>

      {/* Image Preview Modal */}
      <Modal
        open={previewOpen}
        title="Image Preview"
        footer={null}
        onCancel={() => setPreviewOpen(false)}
      >
        <img alt="Preview" style={{ width: "100%" }} src={previewImage} />
      </Modal>

      {/* TotalDue Form Modal */}
      <Modal
        className="khmer-branch"
        open={state.visible}
        onCancel={handleCloseModal}
        centered
        footer={null}
        title={form.getFieldValue("id") ? "កែប្រែការបង់ប្រាក់" : "បញ្ចូលការបង់ប្រាក់ថ្មី"}
      >
        <Form layout="vertical" form={form} onFinish={onFinish} className="custom-form">
          <Row justify="center" align="middle">
            <Col>
              
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            {/* Payment Details */}
            <Col span={12}>
              {/* Payment Date */}
              <Form.Item
                name="payment_date"
                label={
                  <div>
                    <span className="khmer-text">កាលបរិច្ឆេទបង់ប្រាក់</span>
                    <span className="english-text">Payment Date</span>
                  </div>
                }
                rules={[
                  {
                    required: true,
                    message: "Please fill in payment date",
                  },
                ]}
              >
                <Input placeholder="Payment Date" className="input-field" />
              </Form.Item>

              {/* Amount */}
              <Form.Item
                name="amount"
                label={
                  <div>
                    <span className="khmer-text">ចំនួនទឹកប្រាក់</span>
                    <span className="english-text">Amount</span>
                  </div>
                }
                rules={[
                  {
                    required: true,
                    message: "Please fill in amount",
                  },
                ]}
              >
                <Input placeholder="Amount" className="input-field" type="number" />
              </Form.Item>
            </Col>

            <Col span={12}>
              {/* Payment Method */}
              <Form.Item
                name="payment_method"
                label={
                  <div>
                    <span className="khmer-text">វិធីបង់ប្រាក់</span>
                    <span className="english-text">Payment Method</span>
                  </div>
                }
                rules={[
                  {
                    required: true,
                    message: "Please select payment method",
                  },
                ]}
              >
                <Select
                  placeholder="Select Payment Method"
                  options={[
                    {
                      label: "Cash",
                      value: "Cash",
                    },
                    {
                      label: "Bank Transfer",
                      value: "Bank Transfer",
                    },
                    {
                      label: "Credit Card",
                      value: "Credit Card",
                    },
                  ]}
                  className="select-field"
                />
              </Form.Item>

              {/* Description */}
              <Form.Item
                name="description"
                label={
                  <div>
                    <span className="khmer-text">ការពិពណ៌នា</span>
                    <span className="english-text">Description</span>
                  </div>
                }
              >
                <Input.TextArea placeholder="Description" className="input-field" />
              </Form.Item>
            </Col>
          </Row>

          {/* Form Footer */}
          <div style={{ textAlign: "right" }}>
            <Space>
              <Button onClick={handleCloseModal}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                {form.getFieldValue("id") ? "Update" : "Save"}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      <Table
        rowClassName={() => "pos-row"}
        dataSource={state.filteredList || state.list}
        columns={[
          {
            key: "bank_slip",
            title: (
              <div>
                <div className="khmer-text">វិក្កយបត្រធនាគារ</div>
                <div className="english-text">Bank Slip</div>
              </div>
            ),
            dataIndex: "bank_slip",
            render: (bankSlip) =>
              bankSlip ? (
                <Image
                  src={Config.getFullImagePath(bankSlip)}
                  alt="Bank Slip"
                  width={50}
                  height={50}
                  style={{
                    objectFit: "cover", // Ensure the image covers the area
                  }}
                  preview={{
                    mask: <div className="khmer-text">{<IoEyeOutline />}</div>, // Preview mask text
                  }}
                />
              ) : (
                <Tag color="orange">No Image</Tag>
              ),
          },
          {
            key: "id",
            title: (
              <div>
                <div className="khmer-text">លេខកូដ</div>
                <div className="english-text">Code</div>
              </div>
            ),
            dataIndex: "id",
            render: (text) => (
              <Tag color="blue">
                {"P" + text}
              </Tag>
            ),
          },
          {
            key: "payment_date",
            title: (
              <div>
                <div className="khmer-text">កាលបរិច្ឆេទបង់ប្រាក់</div>
                <div className="english-text">Payment Date</div>
              </div>
            ),
            dataIndex: "payment_date",
            render: (value) => formatDateServer(value, "YYYY-MM-DD"),
          },
          {
            key: "amount",
            title: (
              <div>
                <div className="khmer-text">ចំនួនទឹកប្រាក់</div>
                <div className="english-text">Amount</div>
              </div>
            ),
            dataIndex: "amount",
            render: (amount) => `$${parseFloat(amount).toFixed(2)}`,
          },
          {
            key: "payment_method",
            title: (
              <div>
                <div className="khmer-text">វិធីបង់ប្រាក់</div>
                <div className="english-text">Payment Method</div>
              </div>
            ),
            dataIndex: "payment_method",
          },
          {
            key: "description",
            title: (
              <div>
                <div className="khmer-text">ការពិពណ៌នា</div>
                <div className="english-text">Description</div>
              </div>
            ),
            dataIndex: "description",
          },
          {
            key: "create_at",
            title: (
              <div>
                <div className="khmer-text">កាលបរិច្ឆេទបង្កើត</div>
                <div className="english-text">Created Date</div>
              </div>
            ),
            dataIndex: "create_at",
            render: (value) => formatDateServer(value, "YYYY-MM-DD h:mm A"),
          },
          {
            key: "action",
            title: (
              <div>
                <div className="khmer-text">សកម្មភាព</div>
                <div className="english-text">Action</div>
              </div>
            ),
            align: "center",
            render: (value, data) => (
              <Space>
                <Button onClick={() => onClickEdit(data)} type="primary" className="dual-text">
                  <span className="khmer-text">កែប្រែ</span> | <span className="english-text">Edit</span>
                </Button>
                <Button onClick={() => clickBtnDelete(data)} danger type="primary" className="dual-text">
                  <span className="khmer-text">លុប</span> | <span className="english-text">Delete</span>
                </Button>
              </Space>
            ),
          }
        ]}
      />
    </div>
  );
}

export default TotalDuePage;