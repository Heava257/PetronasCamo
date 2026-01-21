
import "./App.css";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import HomePage from "./page/home/HomePage";
import LogingPage from "./page/auth/LogingPage";
import RegisterPage from "./page/auth/RegisterPage";

import MainLayout from "./component/layout/MainLayout";
import MainLayoutAuth from "./component/layout/MainLayoutAuth";
import EmployeePage from "./page/employee/EmployeePage";
import CustomerPage from "./page/customer/CustomerPage";
import CategoryPage from "./page/category/CategoryPage";
import UserPage from "./page/user/UserPage";
import RolePage from "./page/role/RolePage";
import SupplierPage from "./page/purchase/SupplierPage";
import PurchasePage from "./page/purchase/PurchasePage";
import SupplierPaymentPage from "./page/supplier_payment/SupplierPaymentPage"; // ✅ Supplier Payment Ledger
import CustomerPaymentPage from "./page/customer_payment/CustomerPaymentPage"; // ✅ Customer Payment Ledger
import ProductPage from "./page/product/ProductPage";
import ExpansePage from "./page/expanse/ExpansePage";
import PosPage from "./page/pos/PosPage";
import OrderPage from "./page/orderPage/OrderPage";
import ReportSale_Summary from "./page/report/ReportSale_Summary";
import ReportExpense_Summary from "./page/report/ReportExpense_Summary";
import ReportCustomer_Summary from "./page/report/ReportCustomer_Summary";
import ReportPurchase_Summary from "./page/report/ReportPurchase_Summary";
import Top_Sales from "./page/top_sale/Top_Sales";
import Total_DuePage from "./page/total_due/Total_DuePage";
import ProfilePage from "./page/user/ProfilePage";
import ExpanseTypePage from "./page/expanse/ExpanseTypePage";
import FinancePage from "./page/finances/FinancesPage";
import PaymentHistoryPage from "./page/his_payment/PaymentHistoryPage";
import ProductDetailPage from "./page/product_detail/Product_DetailPage";
import DeliveryNotePage from "./page/delivery/DeliveryNotePage";
import AttendanceDashboard from "./page/Attendance/AttendanceDashboard";
import FakeInvoicePage from "./page/fake_invoice/Fake_Invoices";
// import { AutoLogoutProvider } from "./context/AutoLogoutContext";
import AboutHomepage from "./page/about/Aboutpage";
import { TranslationProvider } from './locales/TranslationContext.jsx';
import { DarkModeProvider } from "./component/DarkModeContext.jsx";
import OAuthCallback from "./page/OAuthCallback.jsx";
import ReportStockStatus from "./page/report/ReportStockStatus.jsx";
import ReportStockMovement from "./page/report/ReportStockMovement.jsx";
import ReportOutstandingDebt from "./page/report/ReportOutstandingDebt.jsx";
import ReportPurchaseHistory from "./page/report/ReportPurchaseHistory.jsx";
import ReportPaymentHistory from "./page/report/ReportPaymentHistory.jsx";
import ReportProfitLoss from "./page/report/ReportProfitLoss.jsx";
import BranchComparisonReport from "./page/supperAdmin/BranchComparisonReport/BranchComparisonReportPage.jsx";
import AdminManagement from "./page/supperAdmin/AdminManagement/AdminManagementPage.jsx";
import InactiveAdminsReport from "./page/supperAdmin/InactiveAdminsReport/InactiveAdminsReportPage.jsx";
import NotificationPanel from "./page/supperAdmin/NotificationPanel/NotificationPanelPage.jsx";
import SuperAdminUserManagement from "./page/supperAdmin/SuperAdminUserManagement/SuperAdminUserManagementPage.jsx";
import PermissionManagement from "./page/supperAdmin/PermissionManagement/PermissionManagement.jsx";

import CompanyPaymentPage from "./page/CompanyPayment/CompanyPaymentPage.jsx";
import Company_PaymentHistoryPage from "./page/Company_Payment_His/PaymentHistoryPage.jsx";
import activityTracker from "./util/activityTracker.js";
import { useAuth } from "./hooks/useAuth.js";
import { useEffect } from "react";
import TelegramConfiguration from "./page/supperAdmin/Telegramconfiguration/Telegramconfiguration.jsx";
import BranchPermissionOverridePage from "./page/supperAdmin/BranchPermissionOverride/BranchPermissionOverridePageWrapper.jsx";
import SecurityDashboard from "./page/supperAdmin/SecurityDashboard/SecurityDashboard.jsx";
import NotificationCenter from "./page/supperAdmin/NotificationCenter/NotificationCenter.jsx";
import NotificationStatistics from "./page/supperAdmin/NotificationStatistics/NotificationStatistics.jsx";
import DeliveryMapView from "./page/delivery/DeliveryMapView.jsx";
import OrderListWithMap from "./page/delivery/OrderListWithMap.jsx";
import DeliveryReports from "./page/delivery/DeliveryReports.jsx";
import ActiveDeliveriesMonitor from "./page/delivery/Activedeliveriesmonitor.jsx";
import DriverAuthSystem from "./page/delivery/DriverAuthSystem.jsx";
import CompleteDriverApp from "./page/delivery/CompleteDriverApp.jsx";
import TrucksManagement from "./page/delivery/TrucksManagement/TrucksManagement.jsx";
import InventoryTransactionPage from "./page/inventory/InventoryTransactionPage.jsx";
import ShiftClosingPage from "./page/ShiftClosing/ShiftClosingPage.jsx";
import DailyClosingPage from "./page/DailyClosing/DailyClosingPage.jsx";
import ShiftClosingChecklist from "./page/ShiftClosingChecklist/ShiftClosingChecklist.jsx";
import StockReconciliationPage from "./page/StockReconciliation/StockReconciliationPage.jsx";
import EnhancedPOSOrder from "./page/EnhancedPOSOrder/PreOrderManagementPage.jsx";
import PreOrderDetailPage from "./page/PreOrderDetail/PreOrderDetailPage.jsx";
import SettingsPage from "./page/settings/SettingsPage.jsx";
import { SettingsProvider } from "./settings";
// import BranchPermissionOverridePageWrapper from "./page/supperAdmin/BranchPermissionOverride/BranchPermissionOverridePageWrapper.jsx";



function App() {

  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      activityTracker.start();
    } else {
      activityTracker.stop();
    }

    return () => {
      activityTracker.stop();
    };
  }, [isAuthenticated]);
  return (

    <TranslationProvider>

      <BrowserRouter>
        {/* <AutoLogoutProvider timeoutDuration={1*60*1000}> ✅ Wrap your Routes here */}
        <SettingsProvider>
          <DarkModeProvider>
            <Routes>
              <Route element={<MainLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/employee" element={<EmployeePage />} />
                <Route path="/finance" element={<FinancePage />} />
                <Route path="/customer" element={<CustomerPage />} />
                <Route path="/invoices" element={<PosPage />} />
                <Route path="/category" element={<CategoryPage />} />
                <Route path="/order" element={<OrderPage />} />
                <Route path="/user" element={<UserPage />} />
                <Route path="/product" element={<ProductPage />} />
                <Route path="/product_detail" element={<ProductDetailPage />} />
                <Route path="/role" element={<RolePage />} />
                <Route path="/supplier" element={<SupplierPage />} />
                <Route path="/purchase-orders" element={<PurchasePage />} />
                <Route path="/supplier-payment" element={<SupplierPaymentPage />} /> {/* ✅ Supplier Payment Ledger */}
                <Route path="/customer-payment" element={<CustomerPaymentPage />} /> {/* ✅ Customer Payment Ledger */}
                <Route path="/inventory-transactions" element={<InventoryTransactionPage />} />
                <Route path="/total_due" element={<Total_DuePage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/deliverynote" element={<DeliveryNotePage />} />
                <Route path="/payment/history" element={<PaymentHistoryPage />} />
                <Route path="/attendance" element={<AttendanceDashboard />} />
                <Route path="/fakeinvoices" element={<FakeInvoicePage />} />
                <Route path="/oauth-callback" element={<OAuthCallback />} />
                <Route path="/ip-Management" element={<OAuthCallback />} />


                <Route path="/expanse" element={<ExpansePage />} />
                <Route path="/expanse_type" element={<ExpanseTypePage />} />
                <Route path="/report_Sale_Summary" element={<ReportSale_Summary />} />
                <Route path="/report_Expense_Summary" element={<ReportExpense_Summary />} />
                <Route path="/report_Customer" element={<ReportCustomer_Summary />} />
                <Route path="/purchase_Summary" element={<ReportPurchase_Summary />} />
                <Route path="/Top_Sale" element={<Top_Sales />} />
                <Route path="/report_Stock_Status" element={<ReportStockStatus />} />
                <Route path="/report_Stock_Movement" element={<ReportStockMovement />} />
                <Route path="/report_Outstanding_Debt" element={<ReportOutstandingDebt />} />
                <Route path="/report_Purchase_History" element={<ReportPurchaseHistory />} />
                <Route path="/report_Payment_History" element={<ReportPaymentHistory />} />
                <Route path="/report_Profit_Loss" element={<ReportProfitLoss />} />

                <Route path="/report_BranchComparison" element={<BranchComparisonReport />} />
                <Route path="/admin-management" element={<AdminManagement />} />
                <Route path="/inactive_admins" element={<InactiveAdminsReport />} />
                <Route path="/supperadmin-management" element={<SuperAdminUserManagement />} />
                <Route path="/permission-management" element={<PermissionManagement />} />
                <Route path="/notify-inactive" element={<NotificationPanel />} />
                <Route path="/super-TelegramConfiguration" element={<TelegramConfiguration />} />
                <Route path="/BranchPermissionOverride" element={<BranchPermissionOverridePage />} />
                <Route path="/security/dashboard" element={<SecurityDashboard />} />
                <Route path="/notifications" element={<NotificationCenter />} />
                <Route path="/notifications/statistics" element={<NotificationStatistics />} />
                <Route path="/delivery-map" element={<OrderListWithMap />} />
                <Route path="/DeliveryReports" element={<DeliveryReports />} />
                <Route path="/active-deliveries" element={<ActiveDeliveriesMonitor />} />

                <Route path="/company-payment-management" element={<CompanyPaymentPage />} />
                <Route path="/company-payment" element={<Company_PaymentHistoryPage />} />
                <Route path="/driver-auth" element={<DriverAuthSystem />} />
                <Route path="/driver" element={<CompleteDriverApp />} />
                <Route path="/Truck" element={<TrucksManagement />} />
                <Route path="/admin-ShiftClosing" element={<ShiftClosingPage />} />
                <Route path="/admin-DailyClosing" element={<DailyClosingPage />} />
                <Route path="/admin-ShiftClosingChecklist" element={<ShiftClosingChecklist />} />
                <Route path="/admin-StockReconciliation" element={<StockReconciliationPage />} />
                <Route path="/pre-order-management" element={<EnhancedPOSOrder />} />

                <Route path="/pre-order-detail" element={<PreOrderDetailPage />} />
                <Route path="/pre-order-detail/:id" element={<PreOrderDetailPage />} />
                <Route path="/settings" element={<SettingsPage />} />



                <Route path="*" element={<h1>404-Route Not Found!</h1>} />
              </Route>

              <Route element={<MainLayoutAuth />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LogingPage />} />
                <Route path="/about" element={<AboutHomepage />} />

                <Route path="/register" element={<RegisterPage />} />
              </Route>
            </Routes>
          </DarkModeProvider>
        </SettingsProvider>
        {/* </AutoLogoutProvider> */}
      </BrowserRouter>
    </TranslationProvider>


  );
}

export default App;


