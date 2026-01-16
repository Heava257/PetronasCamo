import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Row, Col, Timeline, message } from 'antd';
import { MdLocationOn, MdAccessTime, MdCheckCircle, MdLocalShipping } from 'react-icons/md';

const DeliveryTracking = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  const deliveryColumns = [
    {
      title: 'Order No',
      dataIndex: 'order_no',
      key: 'order_no',
      render: (text, record) => (
        <Button type="link" onClick={() => setSelectedDelivery(record)}>
          {text}
        </Button>
      )
    },
    {
      title: 'Customer',
      dataIndex: 'customer_name',
      key: 'customer'
    },
    {
      title: 'Location',
      dataIndex: 'delivery_address',
      key: 'location'
    },
    {
      title: 'Driver',
      dataIndex: 'driver_name',
      key: 'driver',
      render: (driver) => (
        <div>
          <div>{driver?.name}</div>
          <div className="text-xs text-gray-500">{driver?.phone}</div>
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'delivery_status',
      key: 'status',
      render: (status) => {
        const statusColors = {
          'pending': 'orange',
          'assigned': 'blue',
          'in_transit': 'purple',
          'delivered': 'green',
          'cancelled': 'red'
        };
        return <Tag color={statusColors[status] || 'default'}>{status}</Tag>;
      }
    },
    {
      title: 'Scheduled',
      dataIndex: 'scheduled_date',
      key: 'scheduled'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div className="flex gap-2">
          <Button 
            icon={<MdLocationOn />} 
            size="small"
            onClick={() => trackDelivery(record.id)}
          >
            Track
          </Button>
          <Button 
            icon={<MdAccessTime />} 
            size="small"
            onClick={() => viewHistory(record.id)}
          >
            History
          </Button>
        </div>
      )
    }
  ];

  // Timeline component for tracking
  const DeliveryTimeline = ({ deliveryId }) => {
    const [timeline, setTimeline] = useState([
      { time: '09:00', status: 'Order Confirmed', description: 'Order has been confirmed' },
      { time: '10:30', status: 'Packed', description: 'Items have been packed' },
      { time: '11:15', status: 'Assigned to Driver', description: 'Driver John Doe assigned' },
      { time: '11:45', status: 'Picked Up', description: 'Driver has picked up the delivery' },
      { time: '12:30', status: 'In Transit', description: 'On the way to destination' }
    ]);

    return (
      <Timeline mode="left">
        {timeline.map((item, index) => (
          <Timeline.Item 
            key={index}
            dot={index === timeline.length - 1 ? <MdLocalShipping /> : <MdCheckCircle />}
            color={index === timeline.length - 1 ? 'blue' : 'green'}
          >
            <div className="font-medium">{item.status}</div>
            <div className="text-sm text-gray-600">{item.time}</div>
            <div className="text-xs text-gray-500">{item.description}</div>
          </Timeline.Item>
        ))}
      </Timeline>
    );
  };

  return (
    <div className="delivery-tracking">
      <h1 className="text-2xl font-bold mb-6">Delivery Tracking</h1>
      
      <Row gutter={[16, 16]}>
        {/* Statistics Cards */}
        <Col xs={24} md={6}>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">2</div>
              <div className="text-gray-600">Total Deliveries</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">1</div>
              <div className="text-gray-600">Delivered</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">0</div>
              <div className="text-gray-600">In Transit</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">50%</div>
              <div className="text-gray-600">Completion Rate</div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Delivery List */}
      <Card title="Active Deliveries" className="mt-6">
        <Table 
          columns={deliveryColumns}
          dataSource={deliveries}
          rowKey="id"
          pagination={false}
        />
      </Card>

      {/* Tracking Details Modal */}
      {selectedDelivery && (
        <div className="mt-6">
          <Card title={`Tracking Order: ${selectedDelivery.order_no}`}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <h3 className="font-bold mb-4">Delivery Information</h3>
                <div className="space-y-2">
                  <div><strong>Customer:</strong> {selectedDelivery.customer_name}</div>
                  <div><strong>Address:</strong> {selectedDelivery.delivery_address}</div>
                  <div><strong>Driver:</strong> {selectedDelivery.driver_name}</div>
                  <div><strong>Phone:</strong> {selectedDelivery.driver_phone}</div>
                  <div><strong>Scheduled:</strong> {selectedDelivery.scheduled_date}</div>
                </div>
              </Col>
              <Col span={12}>
                <h3 className="font-bold mb-4">Tracking Timeline</h3>
                <DeliveryTimeline deliveryId={selectedDelivery.id} />
              </Col>
            </Row>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DeliveryTracking;