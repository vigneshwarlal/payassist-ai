import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import DashboardPage from './components/dashboard/DashboardPage.jsx';
import InvoicePage from './components/invoices/InvoicePage.jsx';
import CustomerPage from './components/customers/CustomerPage.jsx';
import CheckoutPage from './components/checkout/CheckoutPage.jsx';
import SentinelPage from './components/sentinel/SentinelPage.jsx';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/sentinel" element={<SentinelPage />} />
        <Route path="/invoices" element={<InvoicePage />} />
        <Route path="/customers" element={<CustomerPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
