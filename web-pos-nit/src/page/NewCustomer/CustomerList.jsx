import React, { useState, useEffect } from 'react';
import { Avatar, Badge, Button, Card, Typography, Tag, Input, Select, Row, Col, Spin, message } from 'antd';
import { 
  UserOutlined, 
  ManOutlined, 
  WomanOutlined, 
  SearchOutlined,
  FilterOutlined,
  MailOutlined,
  PhoneOutlined,
  CrownOutlined,
  StarOutlined,
  HeartOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { getProfile } from '../../store/profile.store';
import { request } from '../../util/helper';
import { useTranslation } from '../../locales/TranslationContext';

const { Text, Title } = Typography;
const { Option } = Select;

function CustomerList() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch customers from API
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      // Build query parameters for filtering
      const params = new URLSearchParams({
        ...(genderFilter !== 'all' && { gender: genderFilter }),
        ...(typeFilter !== 'all' && { customer_type: typeFilter }),
        limit: 100
      });

      const res = await request(`customer-report${params.toString() ? `?${params}` : ''}`, "get");
      
      if (res && res.customers) {
        // Transform API response to match component structure
        const transformedCustomers = res.customers.map(customer => ({
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.tel, // API uses 'tel' field
          gender: customer.gender,
          type: customer.type,
          status: customer.status,
          orders: customer.total_orders || 0, // API provides total_orders
          totalSpent: parseFloat(customer.total_spent || 0), // API provides total_spent
          joinDate: customer.registration_date, // API provides registration_date
          address: customer.address,
          id_card_number: customer.id_card_number,
          spouse_name: customer.spouse_name,
          guarantor_name: customer.guarantor_name,
          // Additional fields from API
          avg_order_value: customer.avg_order_value,
          last_order_date: customer.last_order_date,
          first_order_date: customer.first_order_date,
          days_since_registration: customer.days_since_registration,
          id_card_expiry: customer.id_card_expiry,
          last_updated: customer.last_updated
        }));
        
        setCustomers(transformedCustomers);
      } else {
        setCustomers([]);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      message.error(t('Failed to load customers. Please try again.'));
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [genderFilter, typeFilter]); // Re-fetch when filters change

  // Generate avatar background colors
  const getAvatarColor = (name) => {
    if (!name) return '#6b7280';
    const colors = [
      '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', 
      '#f59e0b', '#10b981', '#06b6d4', '#84cc16',
      '#f97316', '#6b7280'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return 'NA';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  // Get customer type styling  
  const getTypeConfig = (type) => {
    const configs = {
      'VIP': { color: '#7c3aed', icon: <CrownOutlined />, bg: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)' },
      'Premium': { color: '#f59e0b', icon: <StarOutlined />, bg: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)' },
      'Special': { color: '#ec4899', icon: <HeartOutlined />, bg: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)' },
      'Regular': { color: '#10b981', icon: <UserOutlined />, bg: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' }
    };
    return configs[type] || configs['Regular'];
  };

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      customer.name?.toLowerCase().includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.phone?.includes(searchTerm) ||
      customer.id_card_number?.includes(searchTerm) ||
      customer.id?.toString().includes(searchTerm)
    );
  });

  return (
    <Card
      style={{
        borderRadius: 20,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        border: 'none',
        boxShadow: '0 20px 40px rgba(102, 126, 234, 0.3)'
      }}
      bodyStyle={{ padding: 0 }}
    >
      {/* Header Section */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px 20px 0 0',
        padding: 24
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <Title level={3} style={{ 
              margin: 0, 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 700,
              fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif"
            }}>
              {t('Customer Directory')}
            </Title>
            <Text style={{ 
              color: '#64748b', 
              fontSize: 15, 
              fontWeight: 500,
              fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif"
            }}>
              {t('Manage and view customer information')}
            </Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Badge
              count={filteredCustomers.length}
              style={{ 
                backgroundColor: '#667eea',
                fontSize: 12,
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
              }}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchCustomers}
              loading={loading}
              style={{
                borderRadius: 10,
                border: '1px solid #667eea20',
                color: '#667eea',
                fontWeight: 500
              }}
            />
          </div>
        </div>

        {/* Search and Filter Section */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={10}>
            <Input
              placeholder={t('Search by name, email, phone, or ID...')}
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                borderRadius: 12,
                border: '2px solid #e2e8f0',
                padding: '8px 12px',
                fontSize: 14,
                transition: 'all 0.3s ease',
                fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.boxShadow = 'none';
              }}
            />
          </Col>
          <Col xs={12} sm={6} md={7}>
            <Select
              value={genderFilter}
              onChange={setGenderFilter}
              style={{ 
                width: '100%',
                fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif"
              }}
              placeholder={t('Filter by gender')}
              suffixIcon={<FilterOutlined />}
            >
              <Option value="all">{t('All Genders')}</Option>
              <Option value="Male">{t('Male')}</Option>
              <Option value="Female">{t('Female')}</Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={7}>
            <Select
              value={typeFilter}
              onChange={setTypeFilter}
              style={{ 
                width: '100%',
                fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif"
              }}
              placeholder={t('Filter by type')}
              suffixIcon={<FilterOutlined />}
            >
              <Option value="all">{t('All Types')}</Option>
              <Option value="VIP">{t('VIP')}</Option>
              <Option value="Premium">{t('Premium')}</Option>
              <Option value="Special">{t('Special')}</Option>
              <Option value="Regular">{t('Regular')}</Option>
            </Select>
          </Col>
        </Row>
      </div>

      {/* Customer List */}
      <div style={{ 
        maxHeight: '600px', 
        overflowY: 'auto',
        background: 'rgba(255, 255, 255, 0.98)',
        margin: '0 24px 24px 24px',
        borderRadius: 16,
        padding: '16px 0'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
            <div style={{ 
              marginTop: 16, 
              color: '#64748b',
              fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif"
            }}>
              {t('Loading customers...')}
            </div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
            <UserOutlined style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }} />
            <div style={{
              fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif"
            }}>
              {t('No customers found')}
            </div>
          </div>
        ) : (
          filteredCustomers.map((customer, index) => {
            const typeConfig = getTypeConfig(customer.type);
            
            return (
              <div
                key={customer.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px 20px',
                  margin: '8px 16px',
                  borderRadius: 16,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  border: '1px solid transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Avatar Section */}
                <div style={{ position: 'relative', marginRight: 16 }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 16,
                      background: getAvatarColor(customer.name),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: 16,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }}
                  >
                    {getInitials(customer.name)}
                  </div>
                  
                  {/* Status Indicator */}
                  <div
                    style={{
                      position: 'absolute',
                      top: -2,
                      right: -2,
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      backgroundColor: (customer.status === 1 || customer.status === 'Active') ? '#10b981' : '#ef4444',
                      border: '3px solid white',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                    }}
                  />

                  {/* Gender Icon */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: -2,
                      right: -2,
                      width: 20,
                      height: 20,
                      borderRadius: 8,
                      background: customer.gender?.toLowerCase() === 'male' ? 
                        'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : 
                        'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid white',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    {customer.gender?.toLowerCase() === 'male' ? 
                      <ManOutlined style={{ fontSize: 10, color: 'white' }} /> :
                      <WomanOutlined style={{ fontSize: 10, color: 'white' }} />
                    }
                  </div>
                </div>

                {/* Customer Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Text strong style={{ 
                      fontSize: 16, 
                      color: '#1e293b', 
                      fontWeight: 600,
                      fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif"
                    }}>
                      {customer.name}
                    </Text>
                    
                    {/* Customer Type Badge */}
                    <div
                      style={{
                        background: typeConfig.bg,
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: 8,
                        fontSize: 11,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                        fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif"
                      }}
                    >
                      {typeConfig.icon}
                      {t(customer.type)}
                    </div>

                    <Text style={{ 
                      fontSize: 12, 
                      color: '#64748b', 
                      fontWeight: 500,
                      fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif"
                    }}>
                      {t('ID')}: {customer.id}
                    </Text>
                  </div>

                  {/* Contact Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 6, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MailOutlined style={{ fontSize: 12, color: '#64748b' }} />
                      <Text style={{ fontSize: 13, color: '#475569' }}>
                        {customer.email}
                      </Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <PhoneOutlined style={{ fontSize: 12, color: '#64748b' }} />
                      <Text style={{ fontSize: 13, color: '#475569' }}>
                        {customer.phone}
                      </Text>
                    </div>
                    {customer.id_card_number && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <UserOutlined style={{ fontSize: 12, color: '#64748b' }} />
                        <Text style={{ fontSize: 13, color: '#475569' }}>
                          {customer.id_card_number}
                        </Text>
                      </div>
                    )}
                  </div>

                  {/* Statistics */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <Text style={{ 
                      fontSize: 12, 
                      color: '#64748b',
                      fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif"
                    }}>
                      {t('Orders')}: <span style={{ color: '#1e293b', fontWeight: 600 }}>{customer.orders}</span>
                    </Text>
                    <Text style={{ 
                      fontSize: 12, 
                      color: '#64748b',
                      fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif"
                    }}>
                      {t('Total')}: <span style={{ color: '#059669', fontWeight: 600 }}>${customer.totalSpent.toLocaleString()}</span>
                    </Text>
                    <Text style={{ 
                      fontSize: 12, 
                      color: '#64748b',
                      fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif"
                    }}>
                      {t('Joined')}: <span style={{ color: '#1e293b', fontWeight: 500 }}>
                        {customer.joinDate ? new Date(customer.joinDate).toLocaleDateString() : t('N/A')}
                      </span>
                    </Text>
                    {customer.spouse_name && (
                      <Text style={{ 
                        fontSize: 12, 
                        color: '#64748b',
                        fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif"
                      }}>
                        {t('Spouse')}: <span style={{ color: '#1e293b', fontWeight: 500 }}>{customer.spouse_name}</span>
                      </Text>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}

export default CustomerList;