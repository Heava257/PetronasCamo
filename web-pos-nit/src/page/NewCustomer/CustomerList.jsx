import React, { useState, useEffect } from 'react';
import { Avatar, Badge, Button, Card, Typography, Tag, Input, Select, Row, Col, Spin, message, Switch } from 'antd';
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
  ReloadOutlined,
  BulbOutlined,
  BulbFilled
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
  const [hoveredCard, setHoveredCard] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Fetch customers from API
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...(genderFilter !== 'all' && { gender: genderFilter }),
        ...(typeFilter !== 'all' && { customer_type: typeFilter }),
        limit: 100
      });

      const res = await request(`customer-report${params.toString() ? `?${params}` : ''}`, "get");
      
      if (res && res.customers) {
        const transformedCustomers = res.customers.map(customer => ({
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.tel,
          gender: customer.gender,
          type: customer.type,
          status: customer.status,
          orders: customer.total_orders || 0,
          totalSpent: parseFloat(customer.total_spent || 0),
          joinDate: customer.registration_date,
          address: customer.address,
          id_card_number: customer.id_card_number,
          spouse_name: customer.spouse_name,
          guarantor_name: customer.guarantor_name,
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
  }, [genderFilter, typeFilter]);

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

  const getInitials = (name) => {
    if (!name) return 'NA';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const getTypeConfig = (type) => {
    const configs = {
      'VIP': { color: '#7c3aed', icon: <CrownOutlined />, bg: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)' },
      'Premium': { color: '#f59e0b', icon: <StarOutlined />, bg: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)' },
      'Special': { color: '#ec4899', icon: <HeartOutlined />, bg: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)' },
      'Regular': { color: '#10b981', icon: <UserOutlined />, bg: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' }
    };
    return configs[type] || configs['Regular'];
  };

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

  // Dark mode theme colors
  const theme = {
    background: isDarkMode ? '#1a1d29' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    headerBg: isDarkMode ? '#252836' : 'rgba(255, 255, 255, 0.95)',
    cardBg: isDarkMode ? '#1f2937' : 'rgba(255, 255, 255, 0.98)',
    textPrimary: isDarkMode ? '#e5e7eb' : '#1e293b',
    textSecondary: isDarkMode ? '#9ca3af' : '#64748b',
    borderColor: isDarkMode ? '#374151' : '#e2e8f0',
    hoverBg: isDarkMode ? 'linear-gradient(135deg, #374151 0%, #4b5563 100%)' : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    inputBg: isDarkMode ? '#374151' : '#ffffff',
    inputBorder: isDarkMode ? '#4b5563' : '#e2e8f0',
    shadowColor: isDarkMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(102, 126, 234, 0.4)'
  };

  return (
    <Card
      className="rounded-2xl border-none shadow-2xl overflow-hidden transition-all duration-500"
      style={{
        background: theme.background,
        boxShadow: `0 25px 50px ${theme.shadowColor}`
      }}
      bodyStyle={{ padding: 0 }}
    >
      {/* Header Section - Responsive with Hover Effects */}
      <div 
        className="backdrop-blur-xl rounded-t-2xl p-4 md:p-6 transition-all duration-300"
        style={{ background: theme.headerBg }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div className="flex-1">
            <Title 
              level={3} 
              className="!m-0 !font-bold bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent transition-all duration-300 hover:scale-105"
              style={{ fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif" }}
            >
              {t('Customer Directory')}
            </Title>
            <Text 
              className="text-sm md:text-base font-medium"
              style={{ 
                fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif",
                color: theme.textSecondary
              }}
            >
              {t('Manage and view customer information')}
            </Text>
          </div>
          <div className="flex items-center gap-3">
            {/* Dark Mode Toggle */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-300" style={{ background: isDarkMode ? '#374151' : '#f1f5f9' }}>
              {isDarkMode ? (
                <BulbFilled className="text-yellow-400 text-base" />
              ) : (
                <BulbOutlined className="text-gray-600 text-base" />
              )}
              <Switch
                checked={isDarkMode}
                onChange={setIsDarkMode}
                size="small"
                style={{
                  background: isDarkMode ? '#667eea' : '#cbd5e1'
                }}
              />
            </div>
            <Badge
              count={filteredCustomers.length}
              className="shadow-md transition-all duration-300 hover:scale-110"
              style={{ 
                backgroundColor: '#667eea',
                fontSize: 12,
                fontWeight: 600,
              }}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchCustomers}
              loading={loading}
              className="rounded-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg"
              style={{
                borderColor: isDarkMode ? '#4b5563' : 'rgba(102, 126, 234, 0.2)',
                color: isDarkMode ? '#e5e7eb' : '#667eea',
                background: isDarkMode ? '#374151' : 'transparent'
              }}
            />
          </div>
        </div>

        {/* Search and Filter Section - Responsive Grid with Hover */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 md:gap-4">
          <div className="lg:col-span-6">
            <Input
              placeholder={t('Search by name, email, phone, or ID...')}
              prefix={<SearchOutlined className="transition-colors duration-300" style={{ color: theme.textSecondary }} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-xl border-2 py-2 px-3 transition-all duration-300"
              style={{ 
                fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif",
                background: theme.inputBg,
                borderColor: theme.inputBorder,
                color: theme.textPrimary
              }}
            />
          </div>
          <div className="lg:col-span-3">
            <Select
              value={genderFilter}
              onChange={setGenderFilter}
              className="w-full transition-all duration-300 hover:scale-[1.02]"
              placeholder={t('Filter by gender')}
              suffixIcon={<FilterOutlined />}
              style={{
                background: theme.inputBg
              }}
              dropdownStyle={{
                background: isDarkMode ? '#374151' : '#ffffff',
                color: theme.textPrimary
              }}
            >
              <Option value="all">{t('All Genders')}</Option>
              <Option value="Male">{t('Male')}</Option>
              <Option value="Female">{t('Female')}</Option>
            </Select>
          </div>
          <div className="lg:col-span-3">
            <Select
              value={typeFilter}
              onChange={setTypeFilter}
              className="w-full transition-all duration-300 hover:scale-[1.02]"
              placeholder={t('Filter by type')}
              suffixIcon={<FilterOutlined />}
              style={{
                background: theme.inputBg
              }}
              dropdownStyle={{
                background: isDarkMode ? '#374151' : '#ffffff',
                color: theme.textPrimary
              }}
            >
              <Option value="all">{t('All Types')}</Option>
              <Option value="VIP">{t('VIP')}</Option>
              <Option value="Premium">{t('Premium')}</Option>
              <Option value="Special">{t('Special')}</Option>
              <Option value="Regular">{t('Regular')}</Option>
            </Select>
          </div>
        </div>
      </div>

      {/* Customer List - Responsive Cards with Enhanced Hover */}
      <div 
        className="max-h-[600px] overflow-y-auto mx-4 md:mx-6 mb-4 md:mb-6 rounded-2xl py-4"
        style={{ background: theme.cardBg }}
      >
        {loading ? (
          <div className="text-center py-10">
            <Spin size="large" />
            <div 
              className="mt-4 animate-pulse"
              style={{ 
                fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif",
                color: theme.textSecondary
              }}
            >
              {t('Loading customers...')}
            </div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-10" style={{ color: theme.textSecondary }}>
            <UserOutlined className="text-5xl mb-4 opacity-30 transition-all duration-500 hover:opacity-60 hover:scale-110" />
            <div style={{ fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif" }}>
              {t('No customers found')}
            </div>
          </div>
        ) : (
          filteredCustomers.map((customer, index) => {
            const typeConfig = getTypeConfig(customer.type);
            const isHovered = hoveredCard === customer.id;
            
            return (
              <div
                key={customer.id}
                onMouseEnter={() => setHoveredCard(customer.id)}
                onMouseLeave={() => setHoveredCard(null)}
                className="flex flex-col sm:flex-row sm:items-center p-4 mx-3 md:mx-4 my-2 rounded-2xl transition-all duration-300 border cursor-pointer"
                style={{
                  background: isHovered ? theme.hoverBg : 'transparent',
                  borderColor: isHovered ? '#667eea' : 'transparent',
                  transform: isHovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
                  boxShadow: isHovered ? `0 12px 24px ${isDarkMode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(102, 126, 234, 0.15)'}` : 'none'
                }}
              >
                {/* Avatar Section with Enhanced Hover */}
                <div className="relative mb-3 sm:mb-0 sm:mr-4 flex justify-center sm:justify-start">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg transition-all duration-300"
                    style={{ 
                      background: getAvatarColor(customer.name),
                      transform: isHovered ? 'scale(1.1) rotate(3deg)' : 'scale(1) rotate(0deg)'
                    }}
                  >
                    {getInitials(customer.name)}
                  </div>
                  
                  {/* Status Indicator with Pulse on Hover */}
                  <div
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full border-3 border-white shadow-md transition-all duration-300"
                    style={{
                      backgroundColor: (customer.status === 1 || customer.status === 'Active') ? '#10b981' : '#ef4444',
                      animation: isHovered && (customer.status === 1 || customer.status === 'Active') ? 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite' : 'none'
                    }}
                  />

                  {/* Gender Icon with Rotation on Hover */}
                  <div
                    className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-lg flex items-center justify-center border-2 border-white shadow-md transition-all duration-300"
                    style={{
                      background: customer.gender?.toLowerCase() === 'male' ? 
                        'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : 
                        'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
                      transform: isHovered ? 'rotate(12deg) scale(1.1)' : 'rotate(0deg) scale(1)'
                    }}
                  >
                    {customer.gender?.toLowerCase() === 'male' ? 
                      <ManOutlined className="text-[10px] text-white" /> :
                      <WomanOutlined className="text-[10px] text-white" />
                    }
                  </div>
                </div>

                {/* Customer Info - Responsive Layout with Hover Effects */}
                <div className="flex-1 text-center sm:text-left">
                  {/* Name and Type Row */}
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                    <Text 
                      strong 
                      className="text-base md:text-lg font-semibold transition-all duration-300"
                      style={{ 
                        fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif",
                        color: isHovered ? '#667eea' : theme.textPrimary,
                        transform: isHovered ? 'scale(1.05)' : 'scale(1)'
                      }}
                    >
                      {customer.name}
                    </Text>
                    
                    {/* Customer Type Badge with Hover Animation */}
                    <div
                      className="px-2 py-0.5 rounded-lg text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition-all duration-300"
                      style={{ 
                        background: typeConfig.bg, 
                        fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif",
                        transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                        boxShadow: isHovered ? '0 4px 12px rgba(0, 0, 0, 0.2)' : '0 2px 4px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      <span style={{ transform: isHovered ? 'rotate(12deg)' : 'rotate(0deg)', display: 'inline-block', transition: 'transform 0.3s' }}>
                        {typeConfig.icon}
                      </span>
                      {t(customer.type)}
                    </div>

                    <Text 
                      className="text-xs font-medium transition-colors duration-300"
                      style={{ 
                        fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif",
                        color: isHovered ? '#667eea' : theme.textSecondary
                      }}
                    >
                      {t('ID')}: {customer.id}
                    </Text>
                  </div>

                  {/* Contact Info - Responsive with Hover */}
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 md:gap-4 mb-2 text-xs md:text-sm">
                    <div className="flex items-center gap-1 transition-all duration-300" style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}>
                      <MailOutlined style={{ color: isHovered ? '#667eea' : theme.textSecondary, transition: 'color 0.3s' }} />
                      <Text style={{ color: theme.textPrimary }}>{customer.email}</Text>
                    </div>
                    <div className="flex items-center gap-1 transition-all duration-300" style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}>
                      <PhoneOutlined style={{ color: isHovered ? '#667eea' : theme.textSecondary, transition: 'color 0.3s' }} />
                      <Text style={{ color: theme.textPrimary }}>{customer.phone}</Text>
                    </div>
                    {customer.id_card_number && (
                      <div className="flex items-center gap-1 transition-all duration-300" style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}>
                        <UserOutlined style={{ color: isHovered ? '#667eea' : theme.textSecondary, transition: 'color 0.3s' }} />
                        <Text style={{ color: theme.textPrimary }}>{customer.id_card_number}</Text>
                      </div>
                    )}
                  </div>

                  {/* Statistics - Responsive with Hover Highlights */}
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 md:gap-4 text-xs">
                    <Text 
                      className="transition-all duration-300"
                      style={{ 
                        fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif",
                        color: theme.textSecondary,
                        fontWeight: isHovered ? 600 : 400,
                        transform: isHovered ? 'scale(1.05)' : 'scale(1)'
                      }}
                    >
                      {t('Orders')}: <span style={{ color: isHovered ? '#667eea' : theme.textPrimary, fontWeight: 600 }}>{customer.orders}</span>
                    </Text>
                    <Text 
                      className="transition-all duration-300"
                      style={{ 
                        fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif",
                        color: theme.textSecondary,
                        fontWeight: isHovered ? 600 : 400,
                        transform: isHovered ? 'scale(1.05)' : 'scale(1)'
                      }}
                    >
                      {t('Total')}: <span style={{ 
                        color: isHovered ? '#10b981' : '#059669', 
                        fontWeight: 600,
                        transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                        display: 'inline-block',
                        transition: 'all 0.3s'
                      }}>${customer.totalSpent.toLocaleString()}</span>
                    </Text>
                    <Text 
                      className="transition-all duration-300"
                      style={{ 
                        fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif",
                        color: theme.textSecondary,
                        transform: isHovered ? 'scale(1.05)' : 'scale(1)'
                      }}
                    >
                      {t('Joined')}: <span style={{ color: theme.textPrimary, fontWeight: 500 }}>
                        {customer.joinDate ? new Date(customer.joinDate).toLocaleDateString() : t('N/A')}
                      </span>
                    </Text>
                    {customer.spouse_name && (
                      <Text 
                        className="transition-all duration-300"
                        style={{ 
                          fontFamily: "'Khmer OS', 'Khmer OS System', 'Khmer OS Battambang', sans-serif",
                          color: theme.textSecondary,
                          transform: isHovered ? 'scale(1.05)' : 'scale(1)'
                        }}
                      >
                        {t('Spouse')}: <span style={{ color: theme.textPrimary, fontWeight: 500 }}>{customer.spouse_name}</span>
                      </Text>
                    )}
                  </div>
                </div>

                {/* Hover Indicator - Arrow */}
                <div 
                  className="hidden sm:flex items-center justify-center ml-4 transition-all duration-300"
                  style={{
                    opacity: isHovered ? 1 : 0,
                    transform: isHovered ? 'translateX(0)' : 'translateX(-16px)'
                  }}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#667eea] to-[#764ba2] flex items-center justify-center shadow-lg">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
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