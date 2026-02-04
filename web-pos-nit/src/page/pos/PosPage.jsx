import React, { useEffect, useState, useCallback } from "react";
import MainPage from "../../component/layout/MainPage";
import { getProfile } from "../../store/profile.store";
import { request } from "../../util/helper";
import { useTranslation } from "../../locales/TranslationContext";
import PreOrdersFullView from "./PreOrdersFullView";
import './PosPage.responsive.css';
import './PosPage.module.css';
import './PosPage.stock.css';

import { App } from "antd";

function PosPage() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCategories = async () => {
    try {
      const { id } = getProfile();
      if (!id) return;

      const res = await request(`category/my-group`, "get");
      if (res && !res.error) {
        setCategories(res.list || []);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { id } = getProfile();
      if (!id) return;

      const res = await request(`customer/my-group`, "get");

      if (res && !res.error) {
        const customers = (res.list || []).map((customer, i) => ({
          label: `${i + 1}. ${customer.name}`,
          value: customer.id,
          name: customer.name,
          address: customer.address,
          tel: customer.tel,
          index: i + 1,
        }));

        setCustomers(customers);
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    }
  };

  const fetchTrucks = async () => {
    try {
      const res = await request('trucks', 'get');
      if (res && res.success) {
        setTrucks(res.list || []);
      }
    } catch (error) {
      console.error("Failed to fetch trucks:", error);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await fetchCategories();
      await fetchCustomers();
      await fetchTrucks();
      setLoading(false);
    };
    initializeData();
  }, []);

  return (
    <App>
      <MainPage loading={loading}>
        <PreOrdersFullView
          categories={categories}
          customers={customers}
          trucks={trucks}
        />
      </MainPage>
    </App>
  );
}

export default PosPage;