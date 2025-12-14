// import React, { useEffect, useState } from 'react';
// import {
//   Modal,
//   Card,
//   Row,
//   Col,
//   Statistic,
//   Table,
//   Tag,
//   Typography,
//   Divider,
//   Space,
//   Button,
//   message,
//   Spin,
//   Empty,
//   Descriptions,
//   Progress,
//   Avatar
// } from 'antd';
// import {
//   ShopOutlined,
//   ProductOutlined,
//   DollarOutlined,
//   CalendarOutlined,
//   PhoneOutlined,
//   EnvironmentOutlined,
//   MailOutlined,
//   BarChartOutlined,
//   TrophyOutlined,
//   FireOutlined
// } from '@ant-design/icons';
// import { BsBoxSeam, BsCalendar3, BsPerson, BsBuilding, BsFuelPump } from 'react-icons/bs';
// import { FaMoneyBillWave, FaWarehouse, FaGasPump, FaOilCan } from 'react-icons/fa';

// const { Title, Text } = Typography;

// const CustomerProductsModal = ({
//   visible,
//   customerId,
//   onClose,
//   request,
//   getProfile,
//   formatPrice,
//   formatCurrency
// }) => {
//   const [loading, setLoading] = useState(false);
//   const [customerData, setCustomerData] = useState(null);
//   const [error, setError] = useState(null);

//   // Process raw products data into structured format
//   const processProductsData = (products) => {
//     if (!Array.isArray(products) || products.length === 0) {
//       return null;
//     }

//     // Get customer info from first product (since all products belong to same customer)
//     const firstProduct = products[0];
//     const customer = {
//       id: customerId,
//       name: firstProduct.customer_name || 'Unknown Customer',
//       tel: firstProduct.customer_tel || 'N/A',
//       email: firstProduct.customer_email || 'N/A',
//       address: firstProduct.customer_address || 'N/A',
//       create_at: firstProduct.customer_created_at || null
//     };

//     // Group products by category
//     const categoryGroups = products.reduce((groups, product) => {
//       const categoryId = product.category_id;
//       const categoryName = product.category_name || 'Unknown Category';
      
//       if (!groups[categoryId]) {
//         groups[categoryId] = {
//           category_id: categoryId,
//           category_name: categoryName,
//           category_barcode: product.category_barcode || '',
//           products: [],
//           total_quantity: 0,
//           total_value: 0,
//           product_count: 0,
//           companies: new Set()
//         };
//       }
      
//       // Add product to category
//       groups[categoryId].products.push(product);
      
//       // Calculate totals
//       const qty = parseFloat(product.qty) || 0;
//       const totalPrice = parseFloat(product.total_price) || 0;
      
//       groups[categoryId].total_quantity += qty;
//       groups[categoryId].total_value += totalPrice;
//       groups[categoryId].product_count += 1;
      
//       if (product.company_name) {
//         groups[categoryId].companies.add(product.company_name);
//       }
      
//       return groups;
//     }, {});

//     // Convert to array and calculate averages
//     const categories = Object.values(categoryGroups).map(category => ({
//       ...category,
//       avg_unit_price: category.total_quantity > 0 ? category.total_value / category.total_quantity : 0,
//       companies: Array.from(category.companies).join(', ') || 'N/A'
//     }));

//     // Calculate summary statistics
//     const summary = {
//       total_categories: categories.length,
//       total_products: products.length,
//       total_quantity: categories.reduce((sum, cat) => sum + cat.total_quantity, 0),
//       total_value: categories.reduce((sum, cat) => sum + cat.total_value, 0),
//       avg_unit_price: 0
//     };
    
//     if (summary.total_quantity > 0) {
//       summary.avg_unit_price = summary.total_value / summary.total_quantity;
//     }

//     return {
//       customer,
//       summary,
//       categories,
//       products
//     };
//   };

//   // Fetch customer products data
//   const fetchCustomerProducts = async () => {
//     if (!customerId) {
//       setError('Customer ID is required');
//       return;
//     }

//     setLoading(true);
//     setError(null);
    
//     try {
//       const { id } = getProfile();
//       const queryParam = id ? `?user_id=${id}` : '';
//       const res = await request(`customer-products/${customerId}${queryParam}`, 'get');

//       console.log('API Response:', res); // Debug log

//       if (res && !res.error) {
//         // Handle different response structures
//         let productsArray = null;
        
//         if (Array.isArray(res)) {
//           // Direct array response
//           productsArray = res;
//         } else if (res.data && Array.isArray(res.data)) {
//           // Wrapped in data property
//           productsArray = res.data;
//         } else if (res.products && Array.isArray(res.products)) {
//           // Products in products property
//           productsArray = res.products;
//         }

//         if (productsArray && productsArray.length > 0) {
//           const processedData = processProductsData(productsArray);
//           if (processedData) {
//             setCustomerData(processedData);
//             console.log('Processed Data:', processedData); // Debug log
//           } else {
//             setError('Failed to process product data');
//           }
//         } else {
//           setError('No products found for this customer');
//         }
//       } else {
//         const errorMsg = res?.message || res?.error || 'Failed to fetch customer products';
//         setError(errorMsg);
//         message.error(errorMsg);
//       }
//     } catch (error) {
//       console.error('Error fetching customer products:', error);
//       const errorMsg = 'Network error or server unavailable';
//       setError(errorMsg);
//       message.error(errorMsg);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Reset state when modal closes or customer changes
//   useEffect(() => {
//     if (visible && customerId) {
//       fetchCustomerProducts();
//     } else {
//       setCustomerData(null);
//       setError(null);
//     }
//   }, [visible, customerId]);

//   // Enhanced format currency function
//   const formatCurrencyValue = (value) => {
//     const numValue = parseFloat(value) || 0;
    
//     if (formatCurrency) {
//       return formatCurrency(numValue);
//     }
    
//     return new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: 'USD',
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2
//     }).format(numValue);
//   };

//   // Format number with proper localization
//   const formatNumber = (value, decimals = 0) => {
//     const numValue = parseFloat(value) || 0;
//     return numValue.toLocaleString('en-US', {
//       minimumFractionDigits: decimals,
//       maximumFractionDigits: decimals
//     });
//   };

//   // Get category icon and color based on name
//   const getCategoryIcon = (categoryName) => {
//     const name = (categoryName || '').toLowerCase();
//     if (name.includes('lpg') || name.includes('ហ្កាស') || name.includes('gas')) {
//       return { icon: <FaGasPump />, color: '#faad14' };
//     } else if (name.includes('super') || name.includes('ស៊ុបពែរ')) {
//       return { icon: <TrophyOutlined />, color: '#1890ff' };
//     } else if (name.includes('diesel') || name.includes('ម៉ាស៊ូត')) {
//       return { icon: <FaOilCan />, color: '#52c41a' };
//     } else if (name.includes('ea') || name.includes('ធម្មតា') || name.includes('oil')) {
//       return { icon: <BsFuelPump />, color: '#13c2c2' };
//     }
//     return { icon: <BsBoxSeam />, color: '#722ed1' };
//   };

//   // Enhanced category columns
//   const categoryColumns = [
//     {
//       title: (
//         <div style={{ textAlign: 'center', fontWeight: 'bold' }}>
//           <div style={{ fontSize: '14px', color: '#1890ff' }}>ប្រភេទ</div>
//           <div style={{ fontSize: '12px', color: '#666' }}>Category</div>
//         </div>
//       ),
//       dataIndex: 'category_name',
//       key: 'category_name',
//       width: 200,
//       render: (text, record) => {
//         const { icon, color } = getCategoryIcon(text);
//         return (
//           <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
//             <Avatar
//               style={{ backgroundColor: color, color: 'white' }}
//               size={40}
//               icon={icon}
//             />
//             <div>
//               <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
//                 {text || 'Unknown Category'}
//               </div>
//               <Text type="secondary" style={{ fontSize: '11px' }}>
//                 Code: {record.category_barcode || 'N/A'}
//               </Text>
//             </div>
//           </div>
//         );
//       },
//     },
//     {
//       title: (
//         <div style={{ textAlign: 'center', fontWeight: 'bold' }}>
//           <div style={{ fontSize: '14px', color: '#52c41a' }}>បរិមាណ</div>
//           <div style={{ fontSize: '12px', color: '#666' }}>Quantity</div>
//         </div>
//       ),
//       dataIndex: 'total_quantity',
//       key: 'total_quantity',
//       width: 120,
//       render: (qty, record) => {
//         const quantity = parseFloat(qty) || 0;
//         const maxQty = Math.max(...(customerData?.categories || []).map(c => parseFloat(c.total_quantity) || 0));
//         const percentage = maxQty > 0 ? (quantity / maxQty) * 100 : 0;

//         return (
//           <div style={{ textAlign: 'center' }}>
//             <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#52c41a' }}>
//               {formatNumber(quantity, 2)}L
//             </div>
//             <Progress
//               percent={Math.round(percentage)}
//               size="small"
//               showInfo={false}
//               strokeColor="#52c41a"
//             />
//           </div>
//         );
//       },
//     },
//     {
//       title: (
//         <div style={{ textAlign: 'center', fontWeight: 'bold' }}>
//           <div style={{ fontSize: '14px', color: '#fa8c16' }}>តម្លៃម្ម</div>
//           <div style={{ fontSize: '12px', color: '#666' }}>Avg. Price</div>
//         </div>
//       ),
//       dataIndex: 'avg_unit_price',
//       key: 'avg_unit_price',
//       width: 120,
//       render: (price) => (
//         <div style={{ textAlign: 'center' }}>
//           <Tag color="orange" style={{ fontSize: '12px', fontWeight: 'bold' }}>
//             {formatCurrencyValue(price)}
//           </Tag>
//         </div>
//       ),
//     },
//     {
//       title: (
//         <div style={{ textAlign: 'center', fontWeight: 'bold' }}>
//           <div style={{ fontSize: '14px', color: '#eb2f96' }}>តម្លៃសរុប</div>
//           <div style={{ fontSize: '12px', color: '#666' }}>Total Value</div>
//         </div>
//       ),
//       dataIndex: 'total_value',
//       key: 'total_value',
//       width: 140,
//       render: (value, record) => {
//         const totalValue = parseFloat(value) || 0;
//         const maxValue = Math.max(...(customerData?.categories || []).map(c => parseFloat(c.total_value) || 0));
//         const percentage = maxValue > 0 ? (totalValue / maxValue) * 100 : 0;

//         return (
//           <div style={{ textAlign: 'center' }}>
//             <div style={{
//               fontSize: '14px',
//               fontWeight: 'bold',
//               color: '#eb2f96',
//               marginBottom: '4px'
//             }}>
//               {formatCurrencyValue(totalValue)}
//             </div>
//             <Progress
//               percent={Math.round(percentage)}
//               size="small"
//               showInfo={false}
//               strokeColor="#eb2f96"
//             />
//           </div>
//         );
//       },
//     },
//     {
//       title: (
//         <div style={{ textAlign: 'center', fontWeight: 'bold' }}>
//           <div style={{ fontSize: '14px', color: '#722ed1' }}>ផលិតផល</div>
//           <div style={{ fontSize: '12px', color: '#666' }}>Products</div>
//         </div>
//       ),
//       dataIndex: 'product_count',
//       key: 'product_count',
//       width: 100,
//       render: (count) => (
//         <div style={{ textAlign: 'center' }}>
//           <Tag color="purple" style={{ fontSize: '12px', fontWeight: 'bold' }}>
//             {parseInt(count) || 0} items
//           </Tag>
//         </div>
//       ),
//     },
//     {
//       title: (
//         <div style={{ textAlign: 'center', fontWeight: 'bold' }}>
//           <div style={{ fontSize: '14px', color: '#1890ff' }}>ក្រុមហ៊ុន</div>
//           <div style={{ fontSize: '12px', color: '#666' }}>Companies</div>
//         </div>
//       ),
//       dataIndex: 'companies',
//       key: 'companies',
//       render: (companies) => {
//         if (!companies || companies === 'N/A') {
//           return <span style={{ color: '#999' }}>N/A</span>;
//         }
        
//         const companyList = companies.split(',').map(c => c.trim()).filter(c => c);
//         const displayCompanies = companyList.slice(0, 2).join(', ');
//         const hasMore = companyList.length > 2;
        
//         return (
//           <div style={{ fontSize: '11px', color: '#666' }}>
//             {displayCompanies}
//             {hasMore && ` (+${companyList.length - 2} more)`}
//           </div>
//         );
//       },
//     },
//   ];

//   return (
//     <Modal
//       title={
//         <div style={{
//           display: 'flex',
//           alignItems: 'center',
//           gap: '12px',
//           padding: '8px 0'
//         }}>
//           <Avatar
//             size={40}
//             style={{ backgroundColor: '#1890ff' }}
//             icon={<BsPerson />}
//           />
//           <div>
//             <div style={{
//               fontSize: '18px',
//               fontWeight: 'bold',
//               background: 'linear-gradient(45deg, #1890ff, #722ed1)',
//               WebkitBackgroundClip: 'text',
//               WebkitTextFillColor: 'transparent'
//             }}>
//               ព័ត៌មានលម្អិតអតិថិជន
//             </div>
//             <div style={{ fontSize: '13px', color: '#666' }}>
//               Customer Products Overview
//             </div>
//           </div>
//         </div>
//       }
//       open={visible}
//       onCancel={onClose}
//       width={1200}
//       footer={[
//         <Button key="close" type="primary" onClick={onClose}>
//           បិទ / Close
//         </Button>
//       ]}
//       bodyStyle={{
//         maxHeight: '80vh',
//         overflow: 'auto',
//         background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
//         padding: '24px'
//       }}
//     >
//       <Spin spinning={loading}>
//         {error ? (
//           <div style={{ textAlign: 'center', padding: '50px' }}>
//             <Empty
//               description={
//                 <div>
//                   <div style={{ color: '#ff4d4f', marginBottom: '8px', fontSize: '16px' }}>
//                     {error}
//                   </div>
//                   <Button type="primary" onClick={fetchCustomerProducts}>
//                     ព្យាយាមម្ដងទៀត / Try Again
//                   </Button>
//                 </div>
//               }
//             />
//           </div>
//         ) : customerData ? (
//           <div>
//             {/* Customer Information Card */}
//             {customerData.customer && (
//               <Card
//                 style={{
//                   marginBottom: 20,
//                   borderRadius: '12px',
//                   boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
//                   background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
//                   color: 'white'
//                 }}
//                 bodyStyle={{ padding: '20px' }}
//               >
//                 <Row align="middle" gutter={24}>
//                   <Col span={4}>
//                     <Avatar
//                       size={80}
//                       style={{
//                         backgroundColor: 'rgba(255,255,255,0.2)',
//                         border: '3px solid rgba(255,255,255,0.3)'
//                       }}
//                       icon={<BsPerson size={40} />}
//                     />
//                   </Col>
//                   <Col span={20}>
//                     <Row gutter={[16, 8]}>
//                       <Col span={8}>
//                         <div style={{ fontSize: '12px', opacity: 0.8 }}>ឈ្មោះ / Name</div>
//                         <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
//                           {customerData.customer.name || 'N/A'}
//                         </div>
//                       </Col>
//                       <Col span={8}>
//                         <div style={{ fontSize: '12px', opacity: 0.8 }}>លេខទូរស័ព្ទ / Phone</div>
//                         <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
//                           {customerData.customer.tel || 'N/A'}
//                         </div>
//                       </Col>
//                       <Col span={8}>
//                         <div style={{ fontSize: '12px', opacity: 0.8 }}>អុីមែល / Email</div>
//                         <div style={{ fontSize: '16px' }}>
//                           {customerData.customer.email || 'N/A'}
//                         </div>
//                       </Col>
//                       <Col span={16}>
//                         <div style={{ fontSize: '12px', opacity: 0.8 }}>អាសយដ្ឋាន / Address</div>
//                         <div style={{ fontSize: '14px' }}>
//                           {customerData.customer.address || 'N/A'}
//                         </div>
//                       </Col>
//                       <Col span={8}>
//                         <div style={{ fontSize: '12px', opacity: 0.8 }}>ចាប់ពី / Since</div>
//                         <div style={{ fontSize: '14px' }}>
//                           {customerData.customer.create_at
//                             ? new Date(customerData.customer.create_at).toLocaleDateString()
//                             : 'N/A'
//                           }
//                         </div>
//                       </Col>
//                     </Row>
//                   </Col>
//                 </Row>
//               </Card>
//             )}

//             {/* Summary Statistics */}
//             <Row gutter={16} style={{ marginBottom: 20 }}>
//               <Col span={6}>
//                 <Card
//                   style={{
//                     borderRadius: '12px',
//                     background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
//                     border: 'none'
//                   }}
//                   bodyStyle={{ padding: '20px' }}
//                 >
//                   <Statistic
//                     title={
//                       <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
//                         ប្រភេទសរុប / Total Categories
//                       </div>
//                     }
//                     value={customerData.summary?.total_categories || 0}
//                     valueStyle={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}
//                     prefix={<BarChartOutlined style={{ color: 'white' }} />}
//                   />
//                 </Card>
//               </Col>
//               <Col span={6}>
//                 <Card
//                   style={{
//                     borderRadius: '12px',
//                     background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
//                     border: 'none'
//                   }}
//                   bodyStyle={{ padding: '20px' }}
//                 >
//                   <Statistic
//                     title={
//                       <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
//                         ផលិតផលសរុប / Total Products
//                       </div>
//                     }
//                     value={customerData.summary?.total_products || 0}
//                     valueStyle={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}
//                     prefix={<ProductOutlined style={{ color: 'white' }} />}
//                   />
//                 </Card>
//               </Col>
//               <Col span={6}>
//                 <Card
//                   style={{
//                     borderRadius: '12px',
//                     background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
//                     border: 'none'
//                   }}
//                   bodyStyle={{ padding: '20px' }}
//                 >
//                   <Statistic
//                     title={
//                       <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
//                         បរិមាណសរុប / Total Quantity
//                       </div>
//                     }
//                     value={formatNumber(customerData.summary?.total_quantity || 0, 2)}
//                     suffix="L"
//                     valueStyle={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}
//                     prefix={<FaWarehouse style={{ color: 'white' }} />}
//                   />
//                 </Card>
//               </Col>
//               <Col span={6}>
//                 <Card
//                   style={{
//                     borderRadius: '12px',
//                     background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
//                     border: 'none'
//                   }}
//                   bodyStyle={{ padding: '20px' }}
//                 >
//                   <Statistic
//                     title={
//                       <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
//                         តម្លៃសរុប / Total Value
//                       </div>
//                     }
//                     value={formatCurrencyValue(customerData.summary?.total_value || 0)}
//                     valueStyle={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}
//                     prefix={<FaMoneyBillWave style={{ color: 'white' }} />}
//                   />
//                 </Card>
//               </Col>
//             </Row>

//             {/* Main Products Table by Category */}
//             <Card
//               title={
//                 <div style={{
//                   display: 'flex',
//                   alignItems: 'center',
//                   gap: '12px',
//                   fontSize: '16px',
//                   fontWeight: 'bold'
//                 }}>
//                   <Avatar
//                     style={{ backgroundColor: '#1890ff' }}
//                     icon={<BsBoxSeam />}
//                   />
//                   <div>
//                     <div style={{ color: '#1890ff' }}>
//                       ផលិតផលតាមប្រភេទ / Products by Category
//                     </div>
//                     <div style={{ fontSize: '12px', color: '#666', fontWeight: 'normal' }}>
//                       ({customerData.categories?.length || 0} categories found)
//                     </div>
//                   </div>
//                 </div>
//               }
//               style={{
//                 borderRadius: '12px',
//                 boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
//               }}
//               bodyStyle={{ padding: '20px' }}
//             >
//               {customerData.categories && customerData.categories.length > 0 ? (
//                 <Table
//                   dataSource={customerData.categories}
//                   columns={categoryColumns}
//                   pagination={false}
//                   size="middle"
//                   rowKey="category_id"
//                   style={{
//                     background: 'white',
//                     borderRadius: '8px'
//                   }}
//                   rowClassName={() => 'custom-table-row'}
//                 />
//               ) : (
//                 <Empty
//                   description="មិនមានប្រភេទផលិតផល / No categories found"
//                   style={{ margin: '40px 0' }}
//                 />
//               )}
//             </Card>
//           </div>
//         ) : (
//           !loading && (
//             <Empty
//               description="មិនមានទិន្នន័យអតិថិជន / No customer data available"
//               style={{ margin: '50px 0' }}
//             />
//           )
//         )}
//       </Spin>

//       <style jsx>{`
//         .custom-table-row:hover {
//           background-color: #f0f9ff !important;
//           transform: translateY(-1px);
//           transition: all 0.2s ease;
//           box-shadow: 0 2px 8px rgba(0,0,0,0.1);
//         }
//       `}</style>
//     </Modal>
//   );
// };

// export default CustomerProductsModal;