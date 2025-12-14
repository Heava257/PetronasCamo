// import React, { useEffect, useState } from "react";
// import {
//     Button,
//     Col,
//     Card,
//     Row,
//     Table,
//     Tag,
//     Typography,
//     Space,
//     Statistic,
//     Descriptions,
//     Modal,
//     message,
//     Spin,
//     Empty,
//     Avatar,
//     Timeline,
//     Divider
// } from "antd";
// import {
//     BsBoxSeam,
//     BsPersonFill,
//     BsCalendar3,
//     BsTelephoneFill,
//     BsGeoAltFill,
//     BsGraphUp,
//     BsEyeFill
// } from "react-icons/bs";
// import {
//     FaMoneyBillWave,
//     FaWarehouse,
//     FaOilCan,
//     FaChartLine,
//     FaIndustry
// } from "react-icons/fa";
// import { RiDashboardLine } from "react-icons/ri";
// import { MdCategory, MdDateRange } from "react-icons/md";
// import moment from 'moment';

// const { Title, Text } = Typography;

// function CustomerProductView({ customerId, visible, onClose }) {
//     const [loading, setLoading] = useState(false);
//     const [data, setData] = useState(null);
//     const [detailVisible, setDetailVisible] = useState(false);
//     const [selectedCategory, setSelectedCategory] = useState(null);

//     useEffect(() => {
//         if (visible && customerId) {
//             fetchCustomerProducts();
//         }
//     }, [visible, customerId]);

//     const fetchCustomerProducts = async () => {
//         setLoading(true);
//         try {
//             const { id } = getProfile(); // Optional: If you want user_id filtering
//             const apiUrl = `/api/customer-products/${customerId}${id ? `?user_id=${id}` : ''}`;

//             // ✅ Use request() helper if you prefer
//             const res = await request(`customer-products/${customerId}`, "get");
//             // Or use fetch directly with full path:
//             // const res = await fetch(apiUrl);
//             // const result = await res.json();

//             if (!res.error) {
//                 setData(res.data);
//             } else {
//                 message.error("Failed to fetch customer products");
//             }
//         } catch (error) {
//             console.error("Error:", error);
//             message.error("Network error occurred");
//         } finally {
//             setLoading(false);
//         }
//     };
//     const formatCurrency = (value) => {
//         return new Intl.NumberFormat('en-US', {
//             style: 'currency',
//             currency: 'USD',
//             minimumFractionDigits: 2,
//             maximumFractionDigits: 2
//         }).format(value || 0);
//     };

//     const formatQuantity = (value) => {
//         return `${(value || 0).toLocaleString()}L`;
//     };

//     const getCategoryIcon = (categoryName) => {
//         const icons = {
//             'ហ្កាស(LPG)': <FaWarehouse className="text-amber-500" />,
//             'ប្រេងសាំងធម្មតា(EA)': <FaOilCan className="text-cyan-500" />,
//             'ប្រេងម៉ាស៊ូត(Do)': <FaIndustry className="text-green-500" />,
//             'ប្រេងសាំងស៊ុបពែរ(Super)': <FaMoneyBillWave className="text-blue-500" />,
//         };
//         return icons[categoryName] || <BsBoxSeam className="text-gray-500" />;
//     };

//     const getCategoryColor = (categoryName) => {
//         const colors = {
//             'ហ្កាស(LPG)': 'orange',
//             'ប្រេងសាំងធម្មតា(EA)': 'cyan',
//             'ប្រេងម៉ាស៊ូត(Do)': 'green',
//             'ប្រេងសាំងស៊ុបពែរ(Super)': 'blue',
//         };
//         return colors[categoryName] || 'default';
//     };

//     const categoryColumns = [
//         {
//             title: (
//                 <div className="text-center">
//                     <div className="text-gray-600 font-semibold">ប្រភេទ</div>
//                     <div className="text-gray-500 text-xs">Category</div>
//                 </div>
//             ),
//             dataIndex: 'category_name',
//             key: 'category_name',
//             render: (text, record) => (
//                 <div className="flex items-center space-x-3">
//                     <Avatar size="large" icon={getCategoryIcon(text)} className="bg-gray-100" />
//                     <div>
//                         <div className="font-semibold text-gray-800">{text}</div>
//                         <Tag color={getCategoryColor(text)} size="small">
//                             {record.category_barcode}
//                         </Tag>
//                     </div>
//                 </div>
//             ),
//         },
//         {
//             title: (
//                 <div className="text-center">
//                     <div className="text-gray-600 font-semibold">បរិមាណសរុប</div>
//                     <div className="text-gray-500 text-xs">Total Quantity</div>
//                 </div>
//             ),
//             dataIndex: 'total_quantity',
//             key: 'total_quantity',
//             render: (value) => (
//                 <div className="text-center">
//                     <div className="text-lg font-bold text-blue-600">{formatQuantity(value)}</div>
//                     <div className="text-xs text-gray-500">Liters</div>
//                 </div>
//             ),
//         },
//         {
//             title: (
//                 <div className="text-center">
//                     <div className="text-gray-600 font-semibold">តម្លៃសរុប</div>
//                     <div className="text-gray-500 text-xs">Total Value</div>
//                 </div>
//             ),
//             dataIndex: 'total_value',
//             key: 'total_value',
//             render: (value) => (
//                 <div className="text-center">
//                     <div className="text-lg font-bold text-green-600">{formatCurrency(value)}</div>
//                     <div className="text-xs text-gray-500">USD</div>
//                 </div>
//             ),
//         },
//         {
//             title: (
//                 <div className="text-center">
//                     <div className="text-gray-600 font-semibold">ចំនួនផលិតផល</div>
//                     <div className="text-gray-500 text-xs">Products</div>
//                 </div>
//             ),
//             dataIndex: 'product_count',
//             key: 'product_count',
//             render: (value) => (
//                 <div className="text-center">
//                     <Tag color="purple" className="px-3 py-1 text-sm font-semibold">
//                         {value} items
//                     </Tag>
//                 </div>
//             ),
//         },
//         {
//             title: (
//                 <div className="text-center">
//                     <div className="text-gray-600 font-semibold">សកម្មភាព</div>
//                     <div className="text-gray-500 text-xs">Action</div>
//                 </div>
//             ),
//             key: 'action',
//             render: (_, record) => (
//                 <div className="text-center">
//                     <Button
//                         type="primary"
//                         size="small"
//                         icon={<BsEyeFill />}
//                         onClick={() => {
//                             setSelectedCategory(record);
//                             setDetailVisible(true);
//                         }}
//                         className="bg-blue-500 hover:bg-blue-600"
//                     >
//                         View Details
//                     </Button>
//                 </div>
//             ),
//         },
//     ];

//     const productColumns = [
//         {
//             title: 'Product Name',
//             dataIndex: 'name',
//             key: 'name',
//         },
//         {
//             title: 'Quantity',
//             dataIndex: 'qty',
//             key: 'qty',
//             render: (value) => formatQuantity(value),
//         },
//         {
//             title: 'Unit Price',
//             dataIndex: 'unit_price',
//             key: 'unit_price',
//             render: (value) => formatCurrency(value),
//         },
//         {
//             title: 'Total Price',
//             dataIndex: 'total_price',
//             key: 'total_price',
//             render: (value) => formatCurrency(value),
//         },
//         {
//             title: 'Purchase Date',
//             dataIndex: 'create_at',
//             key: 'create_at',
//             render: (value) => moment(value).format('DD-MM-YYYY'),
//         },
//     ];

//     const getCategoryProducts = (categoryId) => {
//         if (!data?.products) return [];
//         return data.products.filter(product => product.category_id === categoryId);
//     };

//     if (loading) {
//         return (
//             <Modal
//                 title="Loading Customer Products"
//                 open={visible}
//                 onCancel={onClose}
//                 footer={null}
//                 width={1200}
//             >
//                 <div className="flex justify-center items-center py-20">
//                     <Spin size="large" />
//                 </div>
//             </Modal>
//         );
//     }

//     return (
//         <>
//             {/* Main Modal */}
//             <Modal
//                 title={
//                     <div className="flex items-center space-x-3 pb-4 border-b">
//                         <Avatar size="large" icon={<BsPersonFill />} className="bg-blue-500" />
//                         <div>
//                             <div className="text-xl font-bold text-gray-800">Customer Product Analysis</div>
//                             <div className="text-sm text-gray-500">ការវិភាគផលិតផលអតិថិជន</div>
//                         </div>
//                     </div>
//                 }
//                 open={visible}
//                 onCancel={onClose}
//                 footer={null}
//                 width={1400}
//                 bodyStyle={{ maxHeight: '80vh', overflow: 'auto' }}
//             >
//                 {data ? (
//                     <div className="space-y-6">
//                         {/* Customer Info */}
//                         {data.customer && (
//                             <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
//                                 <div className="flex items-center justify-between">
//                                     <div className="flex items-center space-x-4">
//                                         <Avatar size={64} icon={<BsPersonFill />} className="bg-blue-500" />
//                                         <div>
//                                             <Title level={3} className="mb-1 text-blue-800">
//                                                 {data.customer.name}
//                                             </Title>
//                                             <div className="flex items-center space-x-4 text-gray-600">
//                                                 <div className="flex items-center space-x-1">
//                                                     <BsTelephoneFill />
//                                                     <span>{data.customer.tel}</span>
//                                                 </div>
//                                                 <div className="flex items-center space-x-1">
//                                                     <BsGeoAltFill />
//                                                     <span>{data.customer.address}</span>
//                                                 </div>
//                                                 <div className="flex items-center space-x-1">
//                                                     <BsCalendar3 />
//                                                     <span>Since {moment(data.customer.create_at).format('MMM YYYY')}</span>
//                                                 </div>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </Card>
//                         )}

//                         {/* Summary Statistics */}
//                         <Row gutter={[16, 16]}>
//                             <Col xs={24} sm={12} md={6}>
//                                 <Card className="text-center bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
//                                     <Statistic
//                                         title={
//                                             <div>
//                                                 <div className="text-blue-600">ប្រភេទសរុប</div>
//                                                 <div className="text-xs text-gray-500">Total Categories</div>
//                                             </div>
//                                         }
//                                         value={data.summary.total_categories}
//                                         prefix={<MdCategory className="text-blue-500" />}
//                                         valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
//                                     />
//                                 </Card>
//                             </Col>
//                             <Col xs={24} sm={12} md={6}>
//                                 <Card className="text-center bg-gradient-to-br from-green-50 to-green-100 border-green-200">
//                                     <Statistic
//                                         title={
//                                             <div>
//                                                 <div className="text-green-600">បរិមាណសរុប</div>
//                                                 <div className="text-xs text-gray-500">Total Quantity</div>
//                                             </div>
//                                         }
//                                         value={data.summary.total_quantity}
//                                         suffix="L"
//                                         prefix={<BsBoxSeam className="text-green-500" />}
//                                         valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
//                                     />
//                                 </Card>
//                             </Col>
//                             <Col xs={24} sm={12} md={6}>
//                                 <Card className="text-center bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
//                                     <Statistic
//                                         title={
//                                             <div>
//                                                 <div className="text-purple-600">តម្លៃសរុប</div>
//                                                 <div className="text-xs text-gray-500">Total Value</div>
//                                             </div>
//                                         }
//                                         value={data.summary.total_value}
//                                         prefix={<FaMoneyBillWave className="text-purple-500" />}
//                                         precision={2}
//                                         formatter={(value) => `$${value}`}
//                                         valueStyle={{ color: '#722ed1', fontWeight: 'bold' }}
//                                     />
//                                 </Card>
//                             </Col>
//                             <Col xs={24} sm={12} md={6}>
//                                 <Card className="text-center bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
//                                     <Statistic
//                                         title={
//                                             <div>
//                                                 <div className="text-orange-600">ផលិតផលសរុប</div>
//                                                 <div className="text-xs text-gray-500">Total Products</div>
//                                             </div>
//                                         }
//                                         value={data.summary.total_products}
//                                         prefix={<RiDashboardLine className="text-orange-500" />}
//                                         valueStyle={{ color: '#fa8c16', fontWeight: 'bold' }}
//                                     />
//                                 </Card>
//                             </Col>
//                         </Row>

//                         {/* Category Products Table */}
//                         <Card
//                             title={
//                                 <div className="flex items-center space-x-2">
//                                     <FaChartLine className="text-blue-500" />
//                                     <div>
//                                         <div className="text-gray-800 font-semibold">Product Categories Summary</div>
//                                         <div className="text-sm text-gray-500">សេចក្តីសង្ខេបប្រភេទផលិតផល</div>
//                                     </div>
//                                 </div>
//                             }
//                             className="shadow-lg"
//                         >
//                             <Table
//                                 dataSource={data.categories}
//                                 columns={categoryColumns}
//                                 pagination={false}
//                                 rowKey="category_id"
//                                 className="rounded-lg overflow-hidden"
//                                 rowClassName="hover:bg-blue-50 transition-colors duration-200"
//                             />
//                         </Card>
//                     </div>
//                 ) : (
//                     <Empty description="No data available" />
//                 )}
//             </Modal>

//             {/* Detail Modal for specific category */}
//             <Modal
//                 title={
//                     selectedCategory && (
//                         <div className="flex items-center space-x-3">
//                             {getCategoryIcon(selectedCategory.category_name)}
//                             <div>
//                                 <div className="text-lg font-semibold">{selectedCategory.category_name}</div>
//                                 <div className="text-sm text-gray-500">Detailed Product List</div>
//                             </div>
//                         </div>
//                     )
//                 }
//                 open={detailVisible}
//                 onCancel={() => setDetailVisible(false)}
//                 footer={null}
//                 width={1000}
//             >
//                 {selectedCategory && (
//                     <div className="space-y-4">
//                         {/* Category Stats */}
//                         <Row gutter={16}>
//                             <Col span={8}>
//                                 <Card size="small" className="text-center bg-blue-50">
//                                     <Statistic
//                                         title="Total Quantity"
//                                         value={selectedCategory.total_quantity}
//                                         suffix="L"
//                                         valueStyle={{ color: '#1890ff', fontSize: '18px' }}
//                                     />
//                                 </Card>
//                             </Col>
//                             <Col span={8}>
//                                 <Card size="small" className="text-center bg-green-50">
//                                     <Statistic
//                                         title="Total Value"
//                                         value={selectedCategory.total_value}
//                                         prefix="$"
//                                         precision={2}
//                                         valueStyle={{ color: '#52c41a', fontSize: '18px' }}
//                                     />
//                                 </Card>
//                             </Col>
//                             <Col span={8}>
//                                 <Card size="small" className="text-center bg-purple-50">
//                                     <Statistic
//                                         title="Products"
//                                         value={selectedCategory.product_count}
//                                         suffix="items"
//                                         valueStyle={{ color: '#722ed1', fontSize: '18px' }}
//                                     />
//                                 </Card>
//                             </Col>
//                         </Row>

//                         {/* Products Table */}
//                         <Table
//                             dataSource={getCategoryProducts(selectedCategory.category_id)}
//                             columns={productColumns}
//                             pagination={{ pageSize: 10 }}
//                             rowKey="id"
//                             size="small"
//                         />
//                     </div>
//                 )}
//             </Modal>
//         </>
//     );
// }

// export default CustomerProductView;