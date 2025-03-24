import React, { useEffect, useState } from "react";
import { Breadcrumb, Button, Dropdown, Input, Layout, Menu, Tag, theme } from "antd";
import { Outlet, useNavigate } from "react-router-dom";
import "./MainLayout.css";
import logo from "../../assets/petronas_header.png";
import ImgUser from "../../assets/profile.png";
import { Tooltip } from "antd";
import { MdOutlineMarkEmailUnread } from "react-icons/md";
import {
  getPermission,
  getProfile,
  setAcccessToken,
  setProfile,
} from "../../store/profile.store";
import { request } from "../../util/helper";
import { configStore } from "../../store/configStore";
import {
  PieChartOutlined,
  DesktopOutlined,
  FileOutlined,
  ShopOutlined,
  FileProtectOutlined,
  SolutionOutlined,
  ShoppingCartOutlined,
  UsergroupAddOutlined,
  DollarOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  TrophyOutlined,
  CreditCardOutlined,
  SmileOutlined,
} from "@ant-design/icons";
import { Config } from "../../util/config";
const { Header, Content, Footer, Sider } = Layout;
<div>
  <Tag>V 1.0.1</Tag>
</div>
const items_menu = [
  {
    key: "version",
    label: <Tag color="green">V 1.0.1</Tag>,
    disabled: true,
    className: "version-item khmrt-branch",
  },
  {
    key: "",
    label: "ផ្ទាំងគ្រប់គ្រង",
    icon: <PieChartOutlined />,
    className: "dashboard-item khmrt-branch",
  },
  {
    key: "invoices",
    label: "វិក្កយបត្រ",
    icon: <DesktopOutlined />,
    className: "invoices-item khmrt-branch",
  },
  {
    key: "order",
    label: "សេចក្ដីលម្អិតវិក្កយបត្រ",
    icon: <FileOutlined />,
    className: "invoices-detail-item khmrt-branch",
  },
  {
    key: "total_due",
    label: "បញ្ជីអ្នកជំពាក់",
    icon: <CreditCardOutlined />,
    className: "invoices-detail-item khmrt-branch",
  },
  {
    label: "ផលិតផល",
    icon: <ShopOutlined />,
    className: "product-menu khmrt-branch",
    children: [
      {
        key: "product",
        label: "ឃ្លាំងបញ្ចូលស្តុកប្រេង/Terminal",
        icon: <FileProtectOutlined />,
        className: "list-product-item khmrt-branch",
      },
    ],
  },
  {
    key: "category",
    label: "ប្រភេទ",
    icon: <SolutionOutlined />,
    className: "category-item khmrt-branch",
  },
  {
    label: "ការទិញ",
    icon: <ShoppingCartOutlined />,
    className: "purchase-menu khmrt-branch",
    children: [
      {
        key: "supplier",
        label: "អ្នកផ្គត់ផ្គង់",
        icon: <UsergroupAddOutlined />,
        className: "supplier-item khmrt-branch",
      },
    ],
  },
  {
    key: "customer",
    label: "អតិថិជន",
    icon: <UserOutlined />,
    className: "list-Customer-item khmrt-branch",
  },
 
  {
    label: "ចំណាយ",
    icon: <DollarOutlined />,
    className: "expense-menu khmrt-branch",
    children: [
      {
        key: "expanse",
        label: "ចំណាយ",
        icon: <DollarOutlined />,
        className: "expense-item khmrt-branch",
      },
      {
        key: "expanse_type",
        label: "ប្រភេទនៃការចំណាយ",
        icon: <DollarOutlined />,
        className: "expense-item khmrt-branch",
      },
    ],
  },
  {
    label: "និយោជិក",
    icon: <UserOutlined />,
    className: "employee-menu khmrt-branch",
    children: [
      {
        key: "employee",
        label: "និយោជិក",
        icon: <UserOutlined />,
        className: "employee-item khmrt-branch",
      },
    ],
  },
  {
    label: "អ្នកប្រើប្រាស់",
    icon: <SolutionOutlined />,
    className: "user-menu khmrt-branch",
    children: [
      {
        key: "user",
        label: "អ្នកប្រើប្រាស់",
        icon: <UserOutlined />,
        className: "user-item khmrt-branch",
      },
      {
        key: "role",
        label: "តួនាទី",
        icon: <SafetyCertificateOutlined />,
        className: "role-item khmrt-branch",
      },
    ],
  },
  {
    label: "របាយការណ៍",
    icon: <FileOutlined />,
    className: "report-menu khmrt-branch",
    children: [
      {
        key: "report_Sale_Summary",
        label: "សង្ខេបការលក់",
        icon: <PieChartOutlined />,
        className: "sale-summary-item khmrt-branch",
      },
      {
        key: "report_Expense_Summary",
        label: "សង្ខេបការចំណាយ",
        icon: <DollarOutlined />,
        className: "expense-summary-item khmrt-branch",
      },
      // {
      //   key: "purchase_Summary",
      //   label: "សង្ខេបការទិញ",
      //   icon: <ShoppingCartOutlined />,
      //   className: "purchase-summary-item khmrt-branch",
      // },
      {
        key: "report_Customer",
        label: "សង្ខេបអតិថិជនថ្មី",
        icon: <UserOutlined />,
        className: "new-customer-summary-item khmrt-branch",
      },
      {
        key: "Top_Sale",
        label: "ការលក់កំពូល",
        icon: <TrophyOutlined />,
        className: "top-sale-item khmrt-branch",
      },
    ],
  },
];


const MainLayout = () => {
  const permision = getPermission();
  const { setConfig } = configStore();
  const [items, setItems] = useState(items_menu);
  const profile = getProfile();
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const navigate = useNavigate();

  useEffect(() => {
    checkISnotPermissionViewPage();
    getMenuByUser();
    getConfig();
    if (!profile) {
      navigate("/login");
    }
  }, []);
  const checkISnotPermissionViewPage = () => {
    let findIndex = permision?.findIndex(
      (item) => item.web_route_key == location.pathname
    );
    if (findIndex == -1) {
      for (let i = 0; i < permision.length; i++) {
        navigate(permision[i].web_route_key);
        break;
      }
    }
  }
  const getMenuByUser = () => {
    let new_items_menu = [];
    items_menu?.map((item1) => {
      const p1 = permision?.findIndex(
        (data1) => data1.web_route_key == "/" + item1.key
      );
      if (p1 != -1) {
        new_items_menu.push(item1);
      }
      if (item1?.children && item1?.children.length > 0) {
        let childTmp = [];
        item1?.children.map((data1) => {
          permision?.map((data2) => {
            if (data2.web_route_key == "/" + data1.key) {
              childTmp.push(data1);
            }
          });
        });
        if (childTmp.length > 0) {
          item1.children = childTmp;
          new_items_menu.push(item1);
        }
      }
    })
    setItems(new_items_menu)
  }
  const getConfig = async () => {
    const res = await request("config", "get");
    if (res) {
      setConfig(res);
    }
  };
  const onClickMenu = (item) => {
    navigate(item.key);
  };
  const onLoginOut = () => {
    setProfile("");
    setAcccessToken("");
    navigate("/login");
  };
  if (!profile) {
    return null;
  }
  const itemsDropdown = [
    {
      key: "1",
      label: (
        <a
          onClick={(e) => {
            e.preventDefault(); // Prevent default link behavior
            // Use the navigate hook
            navigate('/profile'); // Navigate to the profile page
          }}
        >
          Profile
        </a>
      ),
    },
    {
      key: "2",
      label: (
        <a target="_blank" rel="noopener noreferrer" href="/">
          Changs Your Password
        </a>
      ),
      icon: <SmileOutlined />,
      disabled: true,
    },
    {
      key: "logout",
      danger: true,
      label: "Logout",
    },
  ];
  return (
    <Layout
      style={{
        minHeight: "100vh",
      }}
    >
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
      >
        <div className="demo-logo-vertical" />
        <Menu
          theme="dark"
          defaultSelectedKeys={["1"]}
          mode="inline"
          items={items}
          onClick={onClickMenu}
        />
      </Sider>
      <Layout>
        <div className="admin-header">
          <div className="admin-header-g1">
            <div className="flex flex-col items-start space-y-1">
              <div className="flex items-center gap-2">
                <img
                  src={logo}
                  alt="Company Logo"
                  className="w-50 h-12 object-contain filter brightness-0 invert"
                />
                <h1 className="text-2xl font-bold text-white font-sans text-left">
                  PETRONAS CAMBODIA CO., LTD
                </h1>
              </div>
              <div className="text-white text-sm">
                <div className="khmer-branch text-white">
                  សាខា: {profile?.branch_name}
                </div>
                <div className="khmer-branch text-white">
                  អាសយដ្ឋាន: {profile?.address}
                </div>
              </div>
            </div>
          </div>
          <div className="admin-header-g2">
            <MdOutlineMarkEmailUnread className="icon-email" />
            <div>
              <div className="txt-username">{profile?.name}</div>
              <div>{profile?.username}</div>
            </div>
            <Dropdown
              menu={{
                items: itemsDropdown,
                onClick: (event) => {
                  if (event.key === "logout") {
                    onLoginOut();
                  } else if (event.key === "profile") {
                    navigate('/profile');
                  } else if (event.key === "change_password") {
                    navigate('/change-password');
                  }
                },
              }}
              trigger={['click']}
              placement="bottomRight"
            >
              <div className="flex items-center cursor-pointer">
                <img
                  className="img-user rounded-full border-2 border-white hover:border-blue-300 transition-all"
                  src={profile?.profile_image ? Config.getFullImagePath(profile.profile_image) : ImgUser}
                  alt={profile?.name || "User"}
                />
                <span className="ml-2 text-white text-sm hidden md:inline">▼</span>
              </div>
            </Dropdown>
          </div>
        </div>
        <Content
          style={{
            margin: "10px",
          }}
        >
          <div
            className="admin-body"
            style={{
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <Outlet />
          </div>
        </Content>
        <Footer
          style={{
            textAlign: 'center',
          }}
        >
          ©{new Date().getFullYear()} Created by PETRONAS CO.,LTD
        </Footer>
      </Layout>

    </Layout>
  );
};
export default MainLayout;





