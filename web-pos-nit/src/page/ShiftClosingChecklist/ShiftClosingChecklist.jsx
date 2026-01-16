// ✅ ShiftClosingChecklist.jsx - Step-by-step Checklist for Staff

import React, { useState } from "react";
import {
  Card,
  Checkbox,
  Steps,
  Button,
  Space,
  Alert,
  Typography,
  Divider,
  List,
  Input,
  Modal,
  Progress,
  Tag
} from "antd";
import {
  CheckCircleOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  SafetyOutlined,
  FileTextOutlined
} from "@ant-design/icons";
import "./shiftclosingChecklist.css"
const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { TextArea } = Input;

function ShiftClosingChecklist({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [checklist, setChecklist] = useState({
    // Step 1: Equipment Check
    equipment: {
      pump_check: { checked: false, notes: '' },
      tank_check: { checked: false, notes: '' },
      meter_check: { checked: false, notes: '' },
      pos_system: { checked: false, notes: '' }
    },
    // Step 2: Cash Count
    cash: {
      count_drawer: { checked: false, notes: '', amount: 0 },
      verify_receipts: { checked: false, notes: '' },
      check_credit: { checked: false, notes: '' }
    },
    // Step 3: Stock Count
    stock: {
      diesel_count: { checked: false, notes: '', quantity: 0 },
      gasoline_count: { checked: false, notes: '', quantity: 0 },
      lpg_count: { checked: false, notes: '', quantity: 0 }
    },
    // Step 4: Final Checks
    final: {
      close_sales: { checked: false, notes: '' },
      report_issues: { checked: false, notes: '' },
      secure_cash: { checked: false, notes: '' },
      clean_area: { checked: false, notes: '' }
    }
  });

  const [notesModal, setNotesModal] = useState({ visible: false, item: null });

  // ========================================
  // CHECKLIST ITEMS DEFINITION
  // ========================================

  const checklistSteps = [
    {
      title: "ពិនិត្យឧបករណ៍",
      icon: <CheckCircleOutlined />,
      items: [
        {
          key: 'pump_check',
          label: 'ពិនិត្យក្បាលបូមទាំងអស់',
          description: 'ត្រូវប្រាកដថាក្បាលបូមដំណើរការល្អ និងគ្មានការរឹត',
          required: true
        },
        {
          key: 'tank_check',
          label: 'ពិនិត្យស៊ីទែនប្រេង',
          description: 'ពិនិត្យកម្រិតប្រេងក្នុងស៊ីទែន និងមើលសញ្ញារឹត',
          required: true
        },
        {
          key: 'meter_check',
          label: 'ពិនិត្យ Meter ទាំងអស់',
          description: 'ត្រូវប្រាកដថា Meter បង្ហាញលេខត្រឹមត្រូវ',
          required: true
        },
        {
          key: 'pos_system',
          label: 'ពិនិត្យ POS System',
          description: 'ត្រូវប្រាកដថាប្រព័ន្ធដំណើរការល្អ និងទិន្នន័យត្រឹមត្រូវ',
          required: true
        }
      ]
    },
    {
      title: "រាប់សាច់ប្រាក់",
      icon: <SafetyOutlined />,
      items: [
        {
          key: 'count_drawer',
          label: 'រាប់សាច់ប្រាក់ក្នុងបន្ទប់កាន់លុយ',
          description: 'រាប់ប្រាក់ផ្ទាល់ដៃ ២ ដង ដើម្បីធានាភាពត្រឹមត្រូវ',
          required: true,
          hasAmount: true
        },
        {
          key: 'verify_receipts',
          label: 'ផ្ទៀងផ្ទាត់បង្កាន់ដៃទាំងអស់',
          description: 'ពិនិត្យថាបង្កាន់ដៃត្រូវគ្នានឹងការលក់',
          required: true
        },
        {
          key: 'check_credit',
          label: 'ពិនិត្យការលក់ជំពាក់',
          description: 'ត្រូវប្រាកដថាការលក់ជំពាក់ត្រូវបានកត់ត្រាត្រឹមត្រូវ',
          required: true
        }
      ]
    },
    {
      title: "រាប់ស្តុកប្រេង",
      icon: <FileTextOutlined />,
      items: [
        {
          key: 'diesel_count',
          label: 'រាប់ម៉ាស៊ូត/Diesel',
          description: 'វាស់កម្រិតប្រេងក្នុងស៊ីទែន ហើយកត់ត្រាចំនួនលីត្រ',
          required: true,
          hasQuantity: true
        },
        {
          key: 'gasoline_count',
          label: 'រាប់សាំង/Gasoline',
          description: 'វាស់កម្រិតប្រេងក្នុងស៊ីទែន ហើយកត់ត្រាចំនួនលីត្រ',
          required: true,
          hasQuantity: true
        },
        {
          key: 'lpg_count',
          label: 'រាប់ឧស្ម័ន/LPG (ប្រសិនបើមាន)',
          description: 'រាប់ចំនួនធុងឧស្ម័នដែលនៅសល់',
          required: false,
          hasQuantity: true
        }
      ]
    },
    {
      title: "ការពិនិត្យចុងក្រោយ",
      icon: <ClockCircleOutlined />,
      items: [
        {
          key: 'close_sales',
          label: 'បិទគណនីលក់ទាំងអស់',
          description: 'ត្រូវប្រាកដថាគ្មានការលក់ដែលមិនទាន់បានកត់ត្រា',
          required: true
        },
        {
          key: 'report_issues',
          label: 'ធ្វើរបាយការណ៍បញ្ហាដែលជួបប្រទះ',
          description: 'បញ្ចូលបញ្ហាណាមួយដែលបានជួបក្នុងអំឡុងវេន',
          required: false
        },
        {
          key: 'secure_cash',
          label: 'ដាក់ប្រាក់ចូល Safe',
          description: 'ដាក់សាច់ប្រាក់ចូលក្នុង Safe និងចាក់សោ',
          required: true
        },
        {
          key: 'clean_area',
          label: 'សម្អាតកន្លែងធ្វើការ',
          description: 'សម្អាតតុកៗ និងរៀបចំដើម្បីវេនបន្ទាប់',
          required: true
        }
      ]
    }
  ];

  // ========================================
  // HANDLERS
  // ========================================

  const handleCheckItem = (stepKey, itemKey, checked) => {
    setChecklist(prev => ({
      ...prev,
      [stepKey]: {
        ...prev[stepKey],
        [itemKey]: {
          ...prev[stepKey][itemKey],
          checked
        }
      }
    }));
  };

  const handleUpdateNotes = (stepKey, itemKey, notes) => {
    setChecklist(prev => ({
      ...prev,
      [stepKey]: {
        ...prev[stepKey],
        [itemKey]: {
          ...prev[stepKey][itemKey],
          notes
        }
      }
    }));
  };

  const handleUpdateValue = (stepKey, itemKey, field, value) => {
    setChecklist(prev => ({
      ...prev,
      [stepKey]: {
        ...prev[stepKey],
        [itemKey]: {
          ...prev[stepKey][itemKey],
          [field]: value
        }
      }
    }));
  };

  const getStepCompletion = (stepIndex) => {
    const step = checklistSteps[stepIndex];
    const stepKey = ['equipment', 'cash', 'stock', 'final'][stepIndex];
    const items = step.items;
    const requiredItems = items.filter(item => item.required);
    const completedItems = requiredItems.filter(item => 
      checklist[stepKey][item.key]?.checked
    );
    
    return {
      completed: completedItems.length,
      total: requiredItems.length,
      percentage: Math.round((completedItems.length / requiredItems.length) * 100)
    };
  };

  const isStepComplete = (stepIndex) => {
    const completion = getStepCompletion(stepIndex);
    return completion.percentage === 100;
  };

  const canProceed = () => {
    return isStepComplete(currentStep);
  };

  const handleNext = () => {
    if (currentStep < checklistSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    const allComplete = checklistSteps.every((_, index) => isStepComplete(index));
    
    if (!allComplete) {
      Modal.warning({
        title: "បញ្ជីពិនិត្យមិនទាន់រួចរាល់",
        content: "សូមបញ្ចប់ការពិនិត្យទាំងអស់មុននឹងបិទវេន"
      });
      return;
    }

    Modal.confirm({
      title: "បញ្ជីពិនិត្យរួចរាល់",
      content: "តើអ្នកប្រាកដថាបានពិនិត្យគ្រប់ចំណុចមែនទេ?",
      okText: "បន្តបិទវេន",
      cancelText: "ពិនិត្យឡើងវិញ",
      onOk: () => {
        if (onComplete) {
          onComplete(checklist);
        }
      }
    });
  };

  // ========================================
  // RENDER STEP CONTENT
  // ========================================

  const renderStepContent = () => {
    const step = checklistSteps[currentStep];
    const stepKey = ['equipment', 'cash', 'stock', 'final'][currentStep];
    const completion = getStepCompletion(currentStep);

    return (
      <div>
        <Card
          title={
            <Space>
              {step.icon}
              <span>{step.title}</span>
              <Tag color={completion.percentage === 100 ? "success" : "warning"}>
                {completion.completed}/{completion.total}
              </Tag>
            </Space>
          }
          extra={
            <Progress
              type="circle"
              percent={completion.percentage}
              width={50}
              status={completion.percentage === 100 ? "success" : "normal"}
            />
          }
        >
          <List
            dataSource={step.items}
            renderItem={(item) => {
              const itemData = checklist[stepKey][item.key];
              
              return (
                <List.Item
                  style={{
                    backgroundColor: itemData.checked ? '#f6ffed' : '#fff',
                    padding: '16px',
                    borderLeft: itemData.checked ? '4px solid #52c41a' : '4px solid #d9d9d9'
                  }}
                >
                  <List.Item.Meta
                    avatar={
                      <Checkbox
                        checked={itemData.checked}
                        onChange={(e) => handleCheckItem(stepKey, item.key, e.target.checked)}
                      />
                    }
                    title={
                      <Space>
                        <Text strong>{item.label}</Text>
                        {item.required && <Tag color="red" style={{ fontSize: 10 }}>បាំបង្គាប់</Tag>}
                      </Space>
                    }
                    description={
                      <div>
                        <Paragraph style={{ margin: 0, marginBottom: 8 }}>
                          {item.description}
                        </Paragraph>
                        
                        {/* Amount input */}
                        {item.hasAmount && (
                          <Input
                            prefix="$"
                            placeholder="ចំនួនទឹកប្រាក់"
                            style={{ width: 200, marginBottom: 8 }}
                            value={itemData.amount}
                            onChange={(e) => handleUpdateValue(stepKey, item.key, 'amount', e.target.value)}
                          />
                        )}

                        {/* Quantity input */}
                        {item.hasQuantity && (
                          <Input
                            suffix="L"
                            placeholder="ចំនួនលីត្រ"
                            style={{ width: 200, marginBottom: 8 }}
                            value={itemData.quantity}
                            onChange={(e) => handleUpdateValue(stepKey, item.key, 'quantity', e.target.value)}
                          />
                        )}

                        {/* Notes */}
                        {itemData.checked && (
                          <TextArea
                            rows={2}
                            placeholder="កំណត់សម្គាល់ (ប្រសិនបើមាន)"
                            value={itemData.notes}
                            onChange={(e) => handleUpdateNotes(stepKey, item.key, e.target.value)}
                          />
                        )}
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />
        </Card>
      </div>
    );
  };

  // ========================================
  // RENDER MAIN
  // ========================================

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <Card>
        <Title level={3}>
          <CheckCircleOutlined /> បញ្ជីពិនិត្យបិទវេន
        </Title>

        <Alert
          message="សូមធ្វើតាមជំហានម្តងមួយៗដើម្បីធានាការបិទវេនត្រឹមត្រូវ"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Steps current={currentStep} style={{ marginBottom: 32 }}>
          {checklistSteps.map((step, index) => {
            const completion = getStepCompletion(index);
            return (
              <Step
                key={index}
                title={step.title}
                icon={step.icon}
                description={`${completion.completed}/${completion.total}`}
                status={
                  completion.percentage === 100 ? 'finish' :
                  index === currentStep ? 'process' :
                  'wait'
                }
              />
            );
          })}
        </Steps>

        {renderStepContent()}

        <Divider />

        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Button
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            ថយក្រោយ
          </Button>

          <Space>
            {currentStep < checklistSteps.length - 1 ? (
              <Button
                type="primary"
                onClick={handleNext}
                disabled={!canProceed()}
              >
                បន្ទាប់
              </Button>
            ) : (
              <Button
                type="primary"
                danger
                onClick={handleComplete}
                disabled={!canProceed()}
                icon={<CheckCircleOutlined />}
              >
                បញ្ចប់ និងបិទវេន
              </Button>
            )}
          </Space>
        </Space>
      </Card>
    </div>
  );
}

export default ShiftClosingChecklist;