import React, { useEffect, useState, useRef } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import "./MainLayout.css";
import logo from "../../assets/petronas_header.png";
import ImgUser from "../../assets/profile.png";
import {
  getPermission,
  getProfile,
  setAcccessToken,
  setProfile,
} from "../../store/profile.store";
import { request } from "../../util/helper";
import { configStore } from "../../store/configStore";
import { Config } from "../../util/config";
import { GoChecklist } from "react-icons/go";
import KhmerTimeGreeting from "./KhmerTimeGreeting";
import LiveClock from "./LiveClock";

// Define the menu items with the original structure but using div and span instead of Ant Design
const items_menu = [
  {
    key: "version",
    label: "V 1.3.4",
    disabled: true,
    className: "version-item khmrt-branch petronas-tag",
  },
  {
    key: "",
    label: "ផ្ទាំងគ្រប់គ្រង",
    icon: "📊",
    className: "dashboard-item khmrt-branch petronas-sidebar-menu-item",
  },
  {
    key: "invoices",
    label: "វិក្កយបត្រ",
    icon: "🖥️",
    className: "invoices-item khmrt-branch petronas-sidebar-menu-item",
  },
   {
    key: "fakeinvoices",
        label: "វិក្កយបត្រCopy",
    
    icon: "🖥️",
    className: "invoices-item khmrt-branch petronas-sidebar-menu-item",
  }
  ,
  {
    key: "deliverynote",
    label: "លិខិតដឹកជញ្ជូន",  // Khmer text for "delivery note"
    icon: "🖥️",
    className: "invoices-item khmrt-branch petronas-sidebar-menu-item",
  },
  {
    key: "finance",
    label: "family_finance",
    icon: "🖥️",
    className: "invoices-item khmrt-branch petronas-sidebar-menu-item",
  },
  {
    key: "order",
    label: "លម្អិតវិក័យប័ត្រលក់ចេញ",
    icon: "📄",
    className: "invoices-detail-item khmrt-branch petronas-sidebar-menu-item",
  },
  {
    key: "total_due",
    label: "បញ្ជីអ្នកជំពាក់",
    icon: "💳",
    className: "invoices-detail-item khmrt-branch petronas-sidebar-menu-item",
  },
    {
    key: "payment/history",
    label: "សរុបសង",
    icon: "💳",
    className: "invoices-detail-item khmrt-branch petronas-sidebar-menu-item",
  },
  
 
  {
    label: "ផលិតផល",
    icon: "🏪",
    className: "product-menu khmrt-branch petronas-sidebar-menu-item",
    children: [
      {
        key: "product",
        label: "ឃ្លាំងបញ្ចូលស្តុកប្រេងរាវ/Terminal",
        icon: "🔐",
        className: "list-product-item khmrt-branch petronas-sidebar-submenu-item",
      },
      {
        key: "product_detail",
        label: "លម្អិតវិក័យប័ត្រទិញចូល",
        icon: "📋", // <- changed from 🔐 to 📦 (product box)
        className: "list-product-item khmrt-branch petronas-sidebar-submenu-item",
      }
      
    ],
  },
  {
    key: "category",
    label: "ប្រភេទ",
    icon: "📋",
    className: "category-item khmrt-branch petronas-sidebar-menu-item",
  },
  {
    label: "ការទិញ",
    icon: "🛒",
    className: "purchase-menu khmrt-branch petronas-sidebar-menu-item",
    children: [
      {
        key: "supplier",
        label: "អ្នកផ្គត់ផ្គង់",
        icon: "👥",
        className: "supplier-item khmrt-branch petronas-sidebar-submenu-item",
      },
    ],
  },
  {
    key: "customer",
    label: "អតិថិជន",
    icon: "👤",
    className: "list-Customer-item khmrt-branch petronas-sidebar-menu-item",
  },
  {
    label: "ចំណាយ",
    icon: "💲",
    className: "expense-menu khmrt-branch petronas-sidebar-menu-item",
    children: [
      {
        key: "expanse",
        label: "ចំណាយ",
        icon: "💲",
        className: "expense-item khmrt-branch petronas-sidebar-submenu-item",
      },
      {
        key: "expanse_type",
        label: "ប្រភេទនៃការចំណាយ",
        icon: "💲",
        className: "expense-item khmrt-branch petronas-sidebar-submenu-item",
      },
    ],
  },
  {
    label: "និយោជិក",
    icon: "👤",
    className: "employee-menu khmrt-branch petronas-sidebar-menu-item",
    children: [
      {
        key: "employee",
        label: "និយោជិក",
        icon: "👤",
        className: "employee-item khmrt-branch petronas-sidebar-submenu-item",
      },
    ],
  },
  {
    label: "អ្នកប្រើប្រាស់",
    icon: "📋",
    className: "user-menu khmrt-branch petronas-sidebar-menu-item",
    children: [
      {
        key: "user",
        label: "អ្នកប្រើប្រាស់",
        icon: "👤",
        className: "user-item khmrt-branch petronas-sidebar-submenu-item",
      },
      {
        key: "role",
        label: "តួនាទី",
        icon: "🔒",
        className: "role-item khmrt-branch petronas-sidebar-submenu-item",
      },
    ],
  },
  {
    label: "របាយការណ៍",
    icon: "📄",
    className: "report-menu khmrt-branch petronas-sidebar-menu-item",
    children: [
      {
        key: "report_Sale_Summary",
        label: "សង្ខេបការលក់",
        icon: "📊",
        className: "sale-summary-item khmrt-branch petronas-sidebar-submenu-item",
      },
      {
        key: "report_Expense_Summary",
        label: "សង្ខេបការចំណាយ",
        icon: "💲",
        className: "expense-summary-item khmrt-branch petronas-sidebar-submenu-item",
      },
      {
        key: "report_Customer",
        label: "សង្ខេបអតិថិជនថ្មី",
        icon: "👤",
        className: "new-customer-summary-item khmrt-branch petronas-sidebar-submenu-item",
      },
      {
        key: "Top_Sale",
        label: "ការលក់កំពូល",
        icon: "🏆",
        className: "top-sale-item khmrt-branch petronas-sidebar-submenu-item",
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
  const [openSubmenus, setOpenSubmenus] = useState({});
  const [selectedKey, setSelectedKey] = useState('');
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
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
  
  
  const handleClick = () => {
    navigate("/attendance"); // or your route
  };
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

  const toggleSubmenu = (key) => {
    setOpenSubmenus({
      ...openSubmenus,
      [key]: !openSubmenus[key]
    });
  };

  const onClickMenu = (item) => {
    setSelectedKey(item.key);
    if (item.key) {
      navigate("/" + item.key);
    } else {
      navigate("/");
    }
  };

  const onLoginOut = () => {
    setProfile("");
    setAcccessToken("");
    navigate("/login");
  };

  if (!profile) {
    return null;
  }

  const getProfileImageUrl = () => {
    if (!profile?.profile_image) return ImgUser;

    try {
      const imageUrl = Config.getFullImagePath(profile.profile_image);
      // Verify the URL is valid
      new URL(imageUrl); // This will throw if invalid
      return imageUrl;
    } catch (error) {
      console.error("Invalid profile image URL:", error);
      return ImgUser;
    }
  };

  return (
    <div className="admin-container flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`petronas-sidebar ${collapsed ? 'w-20' : 'w-64'} bg-gradient-to-b from-blue-50 to-blue-100 shadow-md transition-all duration-300 h-screen flex flex-col`}
      >
        {/* Sidebar Header */}
        <div className="admin-sidebar-header p-4 flex justify-center items-center border-b border-blue-200">
          {!collapsed ? (
            <div className="flex flex-col items-center space-y-1">
              <img
                src={logo}
                alt="Company Logo"
                className="h-12 object-contain"
              />
              <h1 className="text-lg font-bold text-blue-700">PETRONAS CAMBODIA</h1>
              <div className="text-xs text-blue-500">CO., LTD</div>
            </div>
          ) : (
            <div className="flex justify-center">
              <img
                src={logo}
                alt="Company Logo"
                className="h-10 object-contain"
              />
            </div>
          )}
        </div>

        {/* Version Tag */}
        <div className="flex justify-center my-2">
          <span className="petronas-tag px-2 py-1 text-xs font-medium bg-blue-100 text-blue-600 rounded-full">
            V 1.3.2
           
          </span>
          
        </div>
       <div>
          <LiveClock/>
       </div>

        {/* Toggle button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar-toggle-button self-end mx-2 p-1 text-blue-500 hover:text-blue-700 focus:outline-none"
        >
          {collapsed ? '→' : '←'}
        </button>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto">
          <ul className="py-2">
            {items.map((item) => (
              <li key={item.key || item.label} className="px-2 py-1">
                {/* Parent menu item */}
                <div
                  className={`${item.className} flex items-center px-3 py-2 rounded-md cursor-pointer ${selectedKey === item.key ? 'bg-blue-200 text-blue-800 petronas-sidebar-menu-item-active' : 'text-blue-700 hover:bg-blue-100'
                    }`}
                  onClick={() => {
                    if (item.children) {
                      toggleSubmenu(item.label);
                    } else {
                      onClickMenu(item);
                    }
                  }}
                >
                  <span className="mr-3">{item.icon}</span>
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      {item.children && (
                        <span className="ml-auto">
                          {openSubmenus[item.label] ? '▼' : '▶'}
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* Submenu items */}
                {!collapsed && item.children && openSubmenus[item.label] && (
                  <ul className="pl-6 mt-1">
                    {item.children.map((child) => (
                      <li key={child.key} className="mb-1">
                        <div
                          className={`${child.className} flex items-center px-3 py-2 rounded-md cursor-pointer ${selectedKey === child.key ? 'bg-blue-200 text-blue-800 petronas-sidebar-submenu-item-active' : 'text-blue-600 hover:bg-blue-100'
                            }`}
                          onClick={() => onClickMenu(child)}
                        >
                          <span className="mr-3 text-sm">{child.icon}</span>
                          <span className="text-sm">{child.label}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-main-content flex-1 flex flex-col">
        {/* Header */}
        <header className="admin-header">
          <div>
            <h1 className="admin-title">PETRONAS CAMBODIA CO., LTD</h1>
            <div className="flex flex-wrap mt-1">
              <div className="khmer-branch">សាខា: {profile?.branch_name}</div>
              <div className="khmer-branch">អាសយដ្ឋាន: {profile?.address}</div>
            </div>
          </div>

          <div className="flex items-center">
            <div className="notification-icon relative cursor-pointer" onClick={handleClick}>
      <GoChecklist size={20} />
      <span className="notification-badge"></span>
    </div>

 <div>
                    <KhmerTimeGreeting />
                 </div>
            {/* Custom Profile Dropdown */}
            <div className="user-profile-container ml-4" ref={dropdownRef}>
              <div className="relative">
                <button
                  className="user-profile-select flex items-center gap-2"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                
                  <img
                    src={getProfileImageUrl()}
                    className="profile-img w-8 h-8 rounded-full border border-yellow-300"
                    alt="User"
                    onError={(e) => {
                      e.target.src = ImgUser;
                      console.error("Failed to load profile image, using fallback");
                    }}
                  />
                  <span className="text-white">{profile?.name}</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50">
                    <div className="py-1">
                      <button
                        className="dropdown-item flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 w-full text-left"
                        onClick={() => {
                          navigate("/profile");
                          setIsDropdownOpen(false);
                        }}
                      >
                        <span className="mr-2">👤</span> My Profile
                      </button>
                      <button
                        className="dropdown-item flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                        onClick={() => {
                          onLoginOut();
                          setIsDropdownOpen(false);
                        }}
                      >
                        <span className="mr-2">🚪</span> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        {/* Content */}
        <main className="admin-body flex-1 p-6 overflow-auto">
          <div className="petronas-card bg-white rounded-lg shadow-sm p-6">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <footer className="admin-footer bg-white border-t border-gray-100 py-3 px-6 text-center text-sm text-gray-500">
          ©{new Date().getFullYear()} Created by PETRONAS CO.,LTD
        </footer>
      </div>
    </div>
  );
};

export default MainLayout;