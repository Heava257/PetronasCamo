import { useEffect, useState } from "react";
import {
  Button,
  Col,
  Form,
  Input,
  message,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  InputNumber,
} from "antd";
import { request } from "../../util/helper";
import { MdDelete, MdEdit } from "react-icons/md";
import MainPage from "../../component/layout/MainPage";
import { getProfile } from "../../store/profile.store";
import { configStore } from "../../store/configStore";
function Stock_UserPage() {
  const [formRef] = Form.useForm();
  const { config } = configStore();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState({
    visibleModal: false,
    id: null,
    txtSearch: "",
    user_id: null,
  });
  useEffect(() => {
    const userId = getProfile();
    if (userId) {
      setState((prev) => ({ ...prev, user_id: userId }));
    } else {
      message.error("No user ID found. Please log in again.");
    }
  }, []);
  useEffect(() => {
    if (state.user_id) {
      getList();
    }
  }, [state.user_id]);
  const onFinish = async (items) => {
    try {
      const profile = getProfile();
      if (!profile.id) {
        message.error("User profile not found. Please log in again.");
        return;
      }
      if (!items.product_name) {
        message.error("Product is required");
        return;
      }  
      if (!items.category_id) {
        message.error("Category is required");
        return;
      }
      if (!items.qty || items.qty <= 0) {
        message.error("Quantity must be greater than zero");
        return;
      }
      if (!items.unit) {
        message.error("Unit is required");
        return;
      }
      if (!items.unit_price || items.unit_price <= 0) {
        message.error("Unit price must be greater than zero");
        return;
      }
      const data = {
        user_id: profile.id,
        product_name: items.product_name,
        category_id: items.category_id,
        qty: Number(items.qty),
        barcode: items.barcode || null,
        brand: items.brand || null,
        description: items.description || null,
        price: Number(items.unit_price) * Number(items.qty),
        discount: Number(items.discount) || 0,
        status: Number(items.status) || 1,
        image: items.image || null,
        create_by: profile.name || "System",
        unit: items.unit,
        unit_price: Number(items.unit_price),
      };
      setLoading(true);
      let res;
      const recordId = formRef.getFieldValue("id");
      if (recordId) {
        res = await request(`stock/${recordId}`, "put", data);
      } else {
        res = await request("stock", "post", data);
      }
      setLoading(false);
      if (res && res.success) {
        message.success(res.message || "Operation successful");
        getList();
        onCloseModal();
      } else {
        console.error("Error from server:", res);
        message.error(res?.message || "An error occurred while saving the data");
      }
    } catch (error) {
      setLoading(false);
      console.error("Exception in onFinish:", error);
      message.error("An error occurred while saving the data");
    }
  };
  const onValuesChange = (changedValues, allValues) => {
    if (changedValues.qty || changedValues.unit_price || changedValues.discount) {
      const originalPrice = allValues.qty * allValues.unit_price; // Original price
      const totalPrice = originalPrice * (1 - (allValues.discount || 0) / 100); // Apply discount
      formRef.setFieldsValue({ price: totalPrice }); // Update the total price field
    }
  };
const onClickEdit = (record) => {
  formRef.setFieldsValue({
    id: record.id,
    product_name: record.product_name,
    category_id: record.category_id,
    qty: record.qty,
    barcode: record.barcode,
    brand: record.brand,
    description: record.description,
    price: record.price,
    discount: record.discount,
    status: record.status,
    unit: record.unit,
    unit_price: record.unit_price,
  });
  setState((prev) => ({
    ...prev,
    visibleModal: true,
  }));
};
 const onClickDelete = (item, index) => {
    if (!item.id) {
      message.error("Product ID is missing!");
      return;
    }
    Modal.confirm({
      title: "Remove Product",
      content: "Are you sure you want to remove this product?",
      onOk: async () => {
        try {
          const res = await request(`stock/${item.id}`, "delete");
          if (res && !res.error) {
            message.success(res.message);
            getList();
          } else {
            message.error(res.message || "Failed to delete product!");
          }
        } catch (error) {
          console.error("Delete Error:", error);
          message.error("An error occurred while deleting the product.");
        }
      },
    });
  };
  const getList = async () => {
    if (!state.user_id) {
      message.error("User ID is required!");
      return;
    }
    const param = {
      txtSearch: state.txtSearch || "",
    };
    try {
      const { id } = getProfile();
      if (!id) {
        return;
      }
      const res = await request(`stock/${id}`, "get", param);
      setLoading(false);
      if (res?.success) {
        setList(res.list || []);
      } else {
        message.error(res?.message || "Failed to fetch stock list");
      }
    } catch (error) {
      setLoading(false);
      console.error("Error fetching stock list:", error);
      message.error("Failed to fetch stock list");
    }
  };
  const onClickAddBtn = async () => {
    const res = await request("new_barcode", "post");
    if (res && !res.error) {
      formRef.setFieldValue("barcode", res.barcode);
      setState((p) => ({
        ...p,
        visibleModal: true,
      }));
    }
  };
  const onCloseModal = () => {
    setState((p) => ({
      ...p,
      visibleModal: false,
    }));
    formRef.resetFields();
  };
  return (
    <MainPage loading={loading}>
      <div className="pageHeader">
        <Space>
          <div>Stock User</div>
          <Input.Search
            onChange={(e) =>
              setState((prev) => ({ ...prev, txtSearch: e.target.value }))
            }
            allowClear
            onSearch={getList}
            placeholder="Search by name"
          />
          <Button type="primary" onClick={getList}>
            Filter
          </Button>
        </Space>
        <Button type="primary" onClick={onClickAddBtn}>
          NEW
        </Button>
      </div>
      <Modal
        open={state.visibleModal}
        title={formRef.getFieldValue("id") ? "Edit Stock" : "New Stock"}
        footer={null}
        onCancel={onCloseModal}
        width={700}
      >
        <Form
          layout="vertical"
          onFinish={onFinish}
          form={formRef}
          onValuesChange={onValuesChange}
        >
          <Row gutter={8}>
            <Col span={12}>
              {/* Product ID */}
              <Form.Item
                name={"product_name"}
                label={
                  <div>
                    <div className="khmer-text">ផលិតផល</div>
                    <div className="english-text">Product Name</div>
                  </div>
                }
                rules={[{ required: true, message: "Please select product" }]}
              >
                <Input placeholder="Product Name" style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item
                name={"category_id"}
                label={
                  <div>
                    <div className="khmer-text">ប្រភេទ</div>
                    <div className="english-text">Category</div>
                  </div>
                }
                rules={[{ required: true, message: "Please select category" }]}
              >
                <Select placeholder="Select category" options={config?.category} />
              </Form.Item>
              <Form.Item
                name={"qty"}
                label={
                  <div>
                    <div className="khmer-text">បរិមាណ</div>
                    <div className="english-text">Quantity</div>
                  </div>
                }
                rules={[{ required: true, message: "Please enter quantity" }]}
              >
                <InputNumber placeholder="Quantity" style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item
                name={"barcode"}
                label={
                  <div>
                    <div className="khmer-text">បាកូដ</div>
                    <div className="english-text">Barcode</div>
                  </div>
                }
              >
                <Input disabled placeholder="Barcode" style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item
                name={"brand"}
                label={
                  <div>
                    <div className="khmer-text">ម៉ាក</div>
                    <div className="english-text">Brand</div>
                  </div>
                }
              >
                 <Select placeholder="Select category" options={config?.brand} />
              </Form.Item>
              <Form.Item
                name={"description"}
                label={
                  <div>
                    <div className="khmer-text">ការពិពណ៌នា</div>
                    <div className="english-text">Description</div>
                  </div>
                }
              >
                <Input.TextArea placeholder="Description" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name={"price"}
                label={
                  <div>
                    <div className="khmer-text">តម្លៃសរុប</div>
                    <div className="english-text">Total Price</div>
                  </div>
                }
              >
                <InputNumber
                  disabled
                  style={{ width: "100%" }}
                  formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                />
              </Form.Item>
              <Form.Item
                name={"discount"}
                label={
                  <div>
                    <div className="khmer-text">បញ្ចុះតម្លៃ (%)</div>
                    <div className="english-text">Discount (%)</div>
                  </div>
                }
              >
                <InputNumber placeholder="Discount" style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item
                name={"status"}
                label={
                  <div>
                    <div className="khmer-text">ស្ថានភាព</div>
                    <div className="english-text">Status</div>
                  </div>
                }
              >
                <Select
                  placeholder="Select status"
                  options={[
                    { label: "Active", value: 1 },
                    { label: "Inactive", value: 0 },
                  ]}
                />
              </Form.Item>
              <Form.Item
                name={"unit"}
                label={
                  <div>
                    <div className="khmer-text">ឯកតា</div>
                    <div className="english-text">Unit</div>
                  </div>
                }
              >
                <Select placeholder="Select Unit" options={config?.unit} style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item
                name={"unit_price"}
                label={
                  <div>
                    <div className="khmer-text">តម្លៃឯកតា</div>
                    <div className="english-text">Unit Price</div>
                  </div>
                }
              >
                <InputNumber
                  placeholder="Unit Price"
                  style={{ width: "100%" }}
                  formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                />
              </Form.Item>
            </Col>
          </Row>
          <div style={{ textAlign: "right" }}>
            <Space>
              <Button onClick={onCloseModal}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                {formRef.getFieldValue("id") ? "Update" : "Save"}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
      <Table
        rowKey="id"
        dataSource={list}
        columns={[
          {
            key: "no",
            title: (
              <div>
                <div className="khmer-text">ល.រ</div>
                <div className="english-text">No</div>
              </div>
            ),
            render: (_, __, index) => index + 1,
            width: 60,
          },
          {
            key: "product_name",
            title: (
              <div>
                <div className="khmer-text">ផលិតផល</div>
                <div className="english-text">Product Name</div>
              </div>
            ),
            dataIndex: "product_name",
          },
          {
            key: "category_id",
            title: (
              <div>
                <div className="khmer-text">ប្រភេទ</div>
                <div className="english-text">Category</div>
              </div>
            ),
            dataIndex: "category_name",
          },
          {
            key: "qty",
            title: (
              <div>
                <div className="khmer-text">បរិមាណ</div>
                <div className="english-text">Quantity</div>
              </div>
            ),
            dataIndex: "qty",
          },
          {
            key: "barcode",
            title: (
              <div>
                <div className="khmer-text">បាកូដ</div>
                <div className="english-text">Barcode</div>
              </div>
            ),
            dataIndex: "barcode",
          },
          {
            key: "brand",
            title: (
              <div>
                <div className="khmer-text">ម៉ាក</div>
                <div className="english-text">Brand</div>
              </div>
            ),
            dataIndex: "brand",
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
            ellipsis: true,
          },
          {
            key: "price",
            title: (
              <div>
                <div className="khmer-text">តម្លៃសរុប</div>
                <div className="english-text">Total Price</div>
              </div>
            ),
            dataIndex: "price",
          },
          {
            key: "discount",
            title: (
              <div>
                <div className="khmer-text">បញ្ចុះតម្លៃ (%)</div>
                <div className="english-text">Discount (%)</div>
              </div>
            ),
            dataIndex: "discount",
            render: (discount) => `${discount}%`,
          },
          {
            key: "status",
            title: (
              <div>
                <div className="khmer-text">ស្ថានភាព</div>
                <div className="english-text">Status</div>
              </div>
            ),
            dataIndex: "status",
            render: (status) => (
              <Tag color={status === 1 ? "green" : "red"}>
                {status === 1 ? "Active" : "Inactive"}
              </Tag>
            ),
            filters: [
              { text: "Active", value: 1 },
              { text: "Inactive", value: 0 },
            ],
            onFilter: (value, record) => record.status === value,
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
            width: 120,
            render: (_, record) => (
              <Space>
                <Button
                  type="primary"
                  icon={<MdEdit />}
                  onClick={() => onClickEdit(record)}
                  size="small"
                />
                <Button
                  type="primary"
                  danger
                  icon={<MdDelete />}
                  onClick={() => onClickDelete(record)}
                  size="small"
                />
              </Space>
            ),
          },
        ]}
      />
    </MainPage>
  );
}
export default Stock_UserPage;