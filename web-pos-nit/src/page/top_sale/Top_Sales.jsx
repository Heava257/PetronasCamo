import React, { useEffect, useState, useRef } from "react";
import { useTranslation } from 'react-i18next';
import { Button, Image, Space, Table, Tag, Typography, Card, Row, Col, Statistic, message } from "antd";
import Swal from "sweetalert2";
import { request } from "../../util/helper";
import { MdRefresh, MdFileDownload, MdPrint, MdTrendingUp } from "react-icons/md";
import { TrophyOutlined, DollarOutlined, ShoppingOutlined } from '@ant-design/icons';
import MainPage from "../../component/layout/MainPage";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const { Title, Text } = Typography;

function Top_Sales() {
  const { t } = useTranslation();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const printRef = useRef(null);

  useEffect(() => {
    getList();
  }, []);

  const getList = async () => {
    setLoading(true);
    const res = await request("top_sales", "get");
    setLoading(false);
    if (res) {
      setList(res.list);
    }
  };

  const refreshList = () => {
    getList();
  };

  // Calculate statistics
  const totalSales = list.reduce((sum, item) => sum + Number(item.total_sale_amount), 0);
  const topProduct = list.length > 0 ? list[0] : null;

  // Enhanced PDF generation
  const handleDownloadPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Header background
    doc.setFillColor(24, 144, 255);
    doc.rect(0, 0, pageWidth, 45, 'F');

    // Title
    doc.setFontSize(28);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.text(t('report.top_sales_pdf_title'), pageWidth / 2, 22, { align: 'center' });

    // Date
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text(`${t('report.generated')}: ${new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`, pageWidth / 2, 35, { align: 'center' });

    // Statistics Section
    let yPos = 55;
    doc.setFillColor(240, 242, 245);
    doc.roundedRect(15, yPos, pageWidth - 30, 32, 3, 3, 'F');

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.setFont(undefined, 'bold');

    // Stats positioning
    const col1X = 25;
    const col2X = pageWidth / 2;
    const col3X = pageWidth - 55;


    // Total Sales
    doc.text(t('report.total_amount'), col1X, yPos + 10);
    doc.setFontSize(14);
    doc.setTextColor(24, 144, 255);
    doc.text(`$${totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, col1X, yPos + 22);

    // Top Product
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(t('report.top_product'), col2X, yPos + 10);
    doc.setFontSize(12);
    const topProdName = topProduct ? topProduct.product_name.substring(0, 20) : 'N/A';
    doc.text(topProdName, col2X, yPos + 22);

    // Total Products
    doc.setFontSize(10);
    doc.text(t('report.total_products'), col3X, yPos + 10);
    doc.setFontSize(14);
    doc.setTextColor(24, 144, 255);
    doc.text(list.length.toString(), col3X, yPos + 22);

    // Table
    yPos = 97;
    const margin = 15;
    const tableWidth = pageWidth - (margin * 2);
    const colWidths = [18, 60, 50, 42];
    const rowHeight = 14;

    // Table header
    doc.setFillColor(52, 152, 219);
    doc.roundedRect(margin, yPos, tableWidth, rowHeight, 2, 2, 'F');

    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');

    const headers = [t('report.rank'), t('report.product_name'), t('report.category'), t('report.sales_amount')];
    let xPos = margin + 5;

    headers.forEach((header, i) => {
      doc.text(header, xPos, yPos + 9);
      xPos += colWidths[i];
    });

    yPos += rowHeight;

    // Table rows
    doc.setFont(undefined, 'normal');
    list.forEach((item, index) => {
      if (yPos > pageHeight - 35) {
        doc.addPage();
        yPos = 20;
      }

      // Row background
      if (index % 2 === 0) {
        doc.setFillColor(249, 250, 251);
        doc.rect(margin, yPos, tableWidth, rowHeight, 'F');
      }

      doc.setTextColor(30, 30, 30);
      doc.setFontSize(9);

      xPos = margin + 5;

      // Rank with trophy for top 3
      doc.setFont(undefined, 'bold');
      if (index < 3) {
        const trophies = ['🥇', '🥈', '🥉'];
        doc.text(trophies[index], xPos, yPos + 10);
      } else {
        doc.text((index + 1).toString(), xPos, yPos + 10);
      }
      doc.setFont(undefined, 'normal');
      xPos += colWidths[0];

      // Product name
      const productName = item.product_name.length > 30
        ? item.product_name.substring(0, 30) + '...'
        : item.product_name;
      doc.text(productName, xPos, yPos + 10);
      xPos += colWidths[1];

      // Category - clean display
      const categoryName = item.category_name || 'N/A';
      const cleanCategory = categoryName.replace(/[^\w\s]/gi, '').trim();
      doc.text(cleanCategory.substring(0, 20), xPos, yPos + 10);
      xPos += colWidths[2];

      // Amount
      const amount = `$${Number(item.total_sale_amount).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;
      doc.setFont(undefined, 'bold');
      doc.setTextColor(34, 139, 34);
      doc.text(amount, xPos, yPos + 10);
      doc.setTextColor(30, 30, 30);
      doc.setFont(undefined, 'normal');

      yPos += rowHeight;

      // Separator
      doc.setDrawColor(230, 230, 230);
      doc.line(margin, yPos, pageWidth - margin, yPos);
    });

    // Footer
    const footerY = pageHeight - 12;
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text('© Top Sales System - Confidential Report', pageWidth / 2, footerY, { align: 'center' });

    doc.save(`Top_Sales_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    Swal.fire({
      icon: 'success',
      title: 'Success',
      text: 'PDF downloaded successfully!',
      showConfirmButton: false,
      timer: 1500
    });
  };

  // Print handler using html2canvas
  const handlePrint = async () => {
    try {
      setLoading(true);
      // message.info('Preparing document for printing...'); // Skip this one for cleaner UX or replace with toast if needed

      const printContent = printRef.current;
      if (!printContent) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Print content not found',
        });
        setLoading(false);
        return;
      }

      // Create a temporary container for print
      const printWindow = window.open('', '', 'width=800,height=600');
      printWindow.document.write(`
        <html>
          <head>
            <title>${t('report.top_sales_pdf_title')} - ${new Date().toLocaleDateString()}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                background: white;
              }
              .print-header {
                text-align: center;
                margin-bottom: 30px;
                padding: 30px;
                background: linear-gradient(135deg, #1890ff 0%, #0050b3 100%);
                color: white;
                border-radius: 10px;
              }
              .print-header h1 {
                margin: 0;
                font-size: 32px;
              }
              .print-header p {
                margin: 10px 0 0 0;
                font-size: 14px;
                opacity: 0.9;
              }
              .stats-container {
                display: flex;
                justify-content: space-around;
                margin-bottom: 30px;
                padding: 20px;
                background: #f5f7fa;
                border-radius: 10px;
              }
              .stat-item {
                text-align: center;
              }
              .stat-label {
                font-size: 12px;
                color: #666;
                margin-bottom: 5px;
              }
              .stat-value {
                font-size: 20px;
                font-weight: bold;
                color: #1890ff;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
              }
              th {
                background: #1890ff;
                color: white;
                padding: 12px;
                text-align: left;
                font-weight: bold;
                border: 1px solid #0050b3;
              }
              td {
                padding: 12px;
                border: 1px solid #e8e8e8;
              }
              tr:nth-child(even) {
                background-color: #f9f9f9;
              }
              .rank-cell {
                text-align: center;
                font-weight: bold;
                font-size: 16px;
              }
              .amount-cell {
                text-align: right;
                color: #52c41a;
                font-weight: bold;
              }
              .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 2px solid #e8e8e8;
                text-align: center;
                color: #999;
                font-size: 12px;
              }
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="print-header">
              <h1>🏆 ${t('report.top_sales_pdf_title')}</h1>
              <p>${t('report.generated')}: ${new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}</p>
            </div>

            <div class="stats-container">
              <div class="stat-item">
                <div class="stat-label">${t('report.total_amount')}</div>
                <div class="stat-value">$${totalSales.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">${t('report.top_product')}</div>
                <div class="stat-value">${topProduct ? topProduct.product_name : 'N/A'}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">${t('report.total_products')}</div>
                <div class="stat-value">${list.length}</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 60px;">${t('report.rank')}</th>
                  <th>${t('report.product_name')}</th>
                  <th style="width: 180px;">${t('report.category')}</th>
                  <th style="width: 150px;">${t('report.sales_amount')}</th>
                </tr>
              </thead>
              <tbody>
                ${list.map((item, index) => {
        const trophies = ['🥇', '🥈', '🥉'];
        const rankDisplay = index < 3 ? trophies[index] : (index + 1);
        const cleanCategory = (item.category_name || 'N/A').replace(/[^\w\s]/gi, '').trim();
        return `
                    <tr>
                      <td class="rank-cell">${rankDisplay}</td>
                      <td><strong>${item.product_name}</strong></td>
                      <td>${cleanCategory}</td>
                      <td class="amount-cell">$${Number(item.total_sale_amount).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}</td>
                    </tr>
                  `;
      }).join('')}
              </tbody>
            </table>

            <div class="footer">
              <p>© Top Sales System - Confidential Report</p>
            </div>
          </body>
        </html>
      `);

      printWindow.document.close();

      // Wait for content to load
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
        setLoading(false);
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Print dialog opened!',
          showConfirmButton: false,
          timer: 1500
        });
      }, 500);

    } catch (error) {
      console.error('Print error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to print. Please try again.',
      });
      setLoading(false);
    }
  };

  const columns = [
    {
      key: "rank",
      title: t('report.rank'),
      render: (item, data, index) => (
        <div style={{ textAlign: 'center' }}>
          {index < 3 ? (
            <TrophyOutlined
              style={{
                fontSize: '24px',
                color: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : '#cd7f32'
              }}
            />
          ) : (
            <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#8c8c8c' }}>
              {index + 1}
            </span>
          )}
        </div>
      ),
      align: "center",
      width: 90,
    },
    {
      key: "image",
      title: t('report.product_image'),
      dataIndex: "product_image",
      render: (value) =>
        value ? (
          <Image
            src={config?.image_path + value}
            fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='70' height='70'%3E%3Crect width='70' height='70' fill='%23f5f5f5'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-size='12'%3E${t('report.no_image')}%3C/text%3E%3C/svg%3E"
            style={{
              width: 70,
              height: 70,
              objectFit: "cover",
              borderRadius: "12px",
              border: "2px solid #f0f0f0",
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
            alt="Product"
            preview={{
              mask: <div style={{ fontSize: '12px' }}>View</div>
            }}
          />
        ) : (
          <div
            style={{
              width: 70,
              height: 70,
              backgroundColor: "#f5f5f5",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              borderRadius: "12px",
              border: "2px solid #f0f0f0",
            }}
          >
            <ShoppingOutlined style={{ fontSize: '28px', color: '#d9d9d9' }} />
          </div>
        ),
      align: "center",
      width: 110,
    },
    {
      key: "name",
      title: t('report.product_info'),
      dataIndex: "product_name",
      render: (text, record) => {
        // Clean category name - remove special characters
        const cleanCategory = (record.category_name || 'N/A').replace(/[^\w\s]/gi, '').trim();
        return (
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#262626', marginBottom: '6px' }}>
              {text}
            </div>
            <Tag color="blue" style={{ fontSize: '13px', fontWeight: '500' }}>
              {cleanCategory || t('report.uncategorized')}
            </Tag>
          </div>
        );
      },
    },
    {
      key: "total_sale_amount",
      title: t('report.sales_performance'),
      dataIndex: "total_sale_amount",
      render: (value, record, index) => (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#52c41a',
            marginBottom: '4px'
          }}>
            ${Number(value).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </div>
          <div style={{
            fontSize: '12px',
            color: '#8c8c8c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}>
            <MdTrendingUp style={{ color: '#52c41a' }} />
            {t('report.top_rank_product', { rank: index + 1 })}
          </div>
        </div>
      ),
      align: "center",
      sorter: (a, b) => a.total_sale_amount - b.total_sale_amount,
      width: 220,
    },
  ];

  return (
    <MainPage loading={loading}>
      <div style={{ padding: '0' }}>
        {/* Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={8}>
            <Card
              bordered={false}
              style={{
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)'
              }}
            >
              <Statistic
                title={<span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>{t('report.total_amount')}</span>}
                value={totalSales}
                precision={2}
                prefix={<DollarOutlined style={{ color: '#fff' }} />}
                valueStyle={{ color: '#fff', fontWeight: 'bold', fontSize: '28px' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card
              bordered={false}
              style={{
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                boxShadow: '0 8px 24px rgba(240, 147, 251, 0.3)'
              }}
            >
              <Statistic
                title={<span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>{t('report.top_product')}</span>}
                value={topProduct ? topProduct.product_name : 'N/A'}
                valueStyle={{ color: '#fff', fontWeight: 'bold', fontSize: '18px' }}
                prefix={<TrophyOutlined style={{ color: '#ffd700' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card
              bordered={false}
              style={{
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                boxShadow: '0 8px 24px rgba(79, 172, 254, 0.3)'
              }}
            >
              <Statistic
                title={<span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>{t('report.total_products')}</span>}
                value={list.length}
                valueStyle={{ color: '#fff', fontWeight: 'bold', fontSize: '28px' }}
                prefix={<ShoppingOutlined style={{ color: '#fff' }} />}
              />
            </Card>
          </Col>
        </Row>

        {/* Main Table Card */}
        <Card
          bordered={false}
          style={{
            borderRadius: '20px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '24px 24px 16px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            marginBottom: '24px',
            borderRadius: '16px'
          }}>
            <Row justify="space-between" align="middle">
              <Col>
                <Title
                  level={2}
                  style={{
                    margin: 0,
                    color: '#fff',
                    fontSize: '28px',
                    fontWeight: 'bold'
                  }}
                >
                  🏆 {t('report.top_sales_report')}
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>
                  {t('report.top_sales_subtitle')}
                </Text>
              </Col>
              <Col>
                <Space size="middle">
                  <Button
                    icon={<MdFileDownload size={18} />}
                    onClick={handleDownloadPDF}
                    size="large"
                    style={{
                      backgroundColor: '#722ed1',
                      borderColor: '#722ed1',
                      color: '#fff',
                      borderRadius: '10px',
                      fontWeight: '600',
                      height: '44px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {t('report.download_pdf')}
                  </Button>
                  <Button
                    icon={<MdPrint size={18} />}
                    onClick={handlePrint}
                    size="large"
                    style={{
                      backgroundColor: '#1890ff',
                      borderColor: '#1890ff',
                      color: '#fff',
                      borderRadius: '10px',
                      fontWeight: '600',
                      height: '44px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {t('report.print')}
                  </Button>
                  <Button
                    icon={<MdRefresh size={18} />}
                    onClick={refreshList}
                    size="large"
                    loading={loading}
                    style={{
                      backgroundColor: '#52c41a',
                      borderColor: '#52c41a',
                      color: '#fff',
                      borderRadius: '10px',
                      fontWeight: '600',
                      height: '44px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {t('report.refresh')}
                  </Button>
                </Space>
              </Col>
            </Row>
          </div>

          {/* Table */}
          <Table
            dataSource={list}
            columns={columns}
            bordered={false}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ['5', '10', '20', '50'],
              showTotal: (total, range) => (
                <span style={{ fontWeight: '500', color: '#595959' }}>
                  {t('report.showing_range', { start: range[0], end: range[1], total: total })}
                </span>
              ),
              style: { marginTop: '16px' }
            }}
            rowClassName={(record, index) =>
              index % 2 === 0 ? 'table-row-light' : 'table-row-dark'
            }
          />
        </Card>

        {/* Hidden print reference */}
        <div ref={printRef} style={{ display: 'none' }} />
      </div>

      {/* Custom Styles */}
      <style jsx global>{`
        .table-row-light {
          background-color: #ffffff;
          transition: all 0.3s ease;
        }
        .table-row-dark {
          background-color: #fafafa;
          transition: all 0.3s ease;
        }
        .table-row-light:hover,
        .table-row-dark:hover {
          background-color: #f0f5ff !important;
          transform: scale(1.01);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }

        .ant-table {
          border-radius: 12px;
          overflow: hidden;
        }

        .ant-table-thead > tr > th {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
          font-weight: 600;
          font-size: 15px;
          padding: 18px 16px;
          border: none;
        }

        .ant-table-tbody > tr > td {
          padding: 16px;
          border-bottom: 1px solid #f0f0f0;
        }
      `}</style>
    </MainPage>
  );
}

export default Top_Sales;