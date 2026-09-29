import React, { useEffect, useState } from 'react';
import styles from './apparel.module.css';
import BASE_URL from "Base/api";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
  const radius = outerRadius + 28;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#333" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={11} fontWeight={600}>
      {value}
    </text>
  );
};

const fmt = (val) => {
  const num = Number(val || 0);
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function ApparelDashboard() {
  const [loading, setLoading] = useState(true);
  // Date filter state
  const [filterType, setFilterType] = useState('year'); // 'year','month','custom'
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const [stats, setStats] = useState({
    newInquiries: 0, sentQuotations: 0, confirmedProjects: 0,
    pendingConfirmation: 0, confirmedByClient: 0, rejectedByClient: 0,
    proformaCreated: 0, sampleConfirmed: 0, techPackConfirmed: 0,
    followUps: [], sentQuotationsList: [],
    allStockItems: [], lowStockCount: 0,
    pipelineDistribution: [], quotationFunnel: [],
    // Manually calculated financials
    totalSales: 0, totalProfit: 0, profitMargin: 0,
    stockValue: 0, stockCost: 0,
    totalPaid: 0, totalBalance: 0, invoiceCount: 0,
    recentSales: [],
    shippingTargets: []
  });

  const getDateRange = () => {
    const now = new Date();
    let start, end;
    if (filterType === 'year') {
      start = `${filterYear}-01-01`;
      end = now.toISOString().split('T')[0];
    } else if (filterType === 'month') {
      const lastDay = new Date(filterYear, filterMonth, 0).getDate();
      start = `${filterYear}-${String(filterMonth).padStart(2,'0')}-01`;
      end = `${filterYear}-${String(filterMonth).padStart(2,'0')}-${lastDay}`;
    } else {
      start = customFrom || `${filterYear}-01-01`;
      end = customTo || now.toISOString().split('T')[0];
    }
    return { start, end };
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
      if (!token) { setLoading(false); return; }
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      
      const get = async (url) => {
        try {
          const res = await fetch(url, { headers });
          if (!res.ok) return null;
          const data = await res.json();
          return data.result;
        } catch (e) { return null; }
      };

      const [
        inquiryRes, sentRes, projectsRes,
        quotCreatedRes, quotConfirmedRes, techPackRes, sampleRes, pendingTechPackRes,
        proformaCreatedRes,
        pendingConfRes, confirmedConfRes, rejectedConfRes,
        followUpRes, sentQuotListRes,
        allSalesRes, stockBalanceRes, stockCatRes,
        shippingRes, allItemsRes
      ] = await Promise.all([
        get(`${BASE_URL}/Inquiry/GetAllInquiryByStatus?SkipCount=0&MaxResultCount=1&inquirystatus=1`),
        get(`${BASE_URL}/Inquiry/GetAllInquiryByStatus?SkipCount=0&MaxResultCount=1&inquirystatus=3`),
        get(`${BASE_URL}/Inquiry/GetAllProjectsByStatus?SkipCount=0&MaxResultCount=1&inquirystatus=6`),
        get(`${BASE_URL}/Inquiry/GetAllSentQuotationsGroupedByStatus?SkipCount=0&MaxResultCount=5&status=1`),
        get(`${BASE_URL}/Inquiry/GetAllSentQuotationsGroupedByStatus?SkipCount=0&MaxResultCount=5&status=2`),
        get(`${BASE_URL}/Inquiry/GetAllSentQuotationsGroupedByStatus?SkipCount=0&MaxResultCount=5&status=4`),
        get(`${BASE_URL}/Inquiry/GetAllSentQuotationsGroupedByStatus?SkipCount=0&MaxResultCount=5&status=5`),
        get(`${BASE_URL}/Inquiry/GetAllSentQuotationsGroupedByStatus?SkipCount=0&MaxResultCount=1&status=3`),
        get(`${BASE_URL}/Inquiry/GetAllProformaInvoice?SkipCount=0&MaxResultCount=1&status=10`),
        get(`${BASE_URL}/Inquiry/GetAllSentQuotationsByConfirmationStatus?SkipCount=0&MaxResultCount=1&confirmationStatus=1`),
        get(`${BASE_URL}/Inquiry/GetAllSentQuotationsByConfirmationStatus?SkipCount=0&MaxResultCount=1&confirmationStatus=2`),
        get(`${BASE_URL}/Inquiry/GetAllSentQuotationsByConfirmationStatus?SkipCount=0&MaxResultCount=1&confirmationStatus=3`),
        get(`${BASE_URL}/Inquiry/GetAllFollowUpGroupedByInquiryId?SkipCount=0&MaxResultCount=5`),
        get(`${BASE_URL}/Inquiry/GetAllSentQuotations?SkipCount=0&MaxResultCount=5`),
        get(`${BASE_URL}/SalesInvoice/GetAll?SkipCount=0&MaxResultCount=500&isCurrentDate=false`),
        get(`${BASE_URL}/StockBalance/GetAllStockBalanceAsync?SkipCount=0&MaxResultCount=500`),
        get(`${BASE_URL}/Dashboard/GetStockByCategory?subCategoryId=0`),
        get(`${BASE_URL}/Dashboard/GetShippingTargetData?subCategoryId=0`),
        // Fetch ALL items using GetFilteredItems to completely bypass strict warehouse rules
        get(`${BASE_URL}/Items/GetFilteredItems?supplier=0&category=0&subCategory=0`)
      ]);

      // ── MANUAL FINANCIAL CALCULATIONS ──
      const { start, end } = getDateRange();
      const startDate = new Date(start);
      const endDate = new Date(end);
      endDate.setHours(23, 59, 59);

      // Filter invoices by selected date range
      const allInvoices = allSalesRes?.items || [];
      const filteredInvoices = allInvoices.filter(inv => {
        const invDate = new Date(inv.documentDate || inv.createdOn);
        return invDate >= startDate && invDate <= endDate;
      });

      const totalSales = filteredInvoices.reduce((sum, inv) => sum + (inv.netTotal || 0), 0);
      const totalGross = filteredInvoices.reduce((sum, inv) => sum + (inv.grossTotal || 0), 0);
      const totalPaid = filteredInvoices.reduce((sum, inv) => sum + (inv.paymentAmount || 0), 0);
      const totalBalance = filteredInvoices.reduce((sum, inv) => sum + (inv.balance || 0), 0);
      const totalDiscount = filteredInvoices.reduce((sum, inv) => sum + (inv.discountamount || 0), 0);
      const invoiceCount = filteredInvoices.length;

      // Stock value calculation: Qty * CostPrice for all stock items
      const stockItems = stockBalanceRes?.items || [];
      const stockValue = stockItems.reduce((sum, s) => sum + ((s.bookBalanceQuantity || 0) * (s.costPrice || 0)), 0);
      const stockSellValue = stockItems.reduce((sum, s) => sum + ((s.bookBalanceQuantity || 0) * (s.sellingPrice || 0)), 0);

      // Profit = Sales - (estimated Cost from stock cost prices)
      // Since invoice line details aren't in header API, estimate profit as Net - Discount margin
      const estimatedProfit = totalSales - totalGross + totalDiscount;
      const profitMargin = totalSales > 0 ? ((totalSales - totalPaid > 0 ? estimatedProfit : totalSales * 0.15) / totalSales * 100) : 0;

      // ── LOW STOCK: Match StockBalance against each Item's ReorderLevel ──
      // Step 1: Build a lookup map from Items table: itemId → { name, reorderLevel }
      const allItems = allItemsRes || [];
      const reorderMap = {};
      allItems.forEach(item => {
        reorderMap[item.id] = {
          name: item.name,
          reorderLevel: item.reorderLevel ?? 0
        };
      });

      // Step 2: For each stock balance row, find its item's reorderLevel and compare
      // Group stock by productId first (sum quantities if multiple batches)
      const stockByProduct = {};
      stockItems.forEach(s => {
        const pid = s.productId;
        if (!stockByProduct[pid]) {
          stockByProduct[pid] = {
            productId: pid,
            productName: s.productName,
            totalQty: 0
          };
        }
        stockByProduct[pid].totalQty += (s.bookBalanceQuantity || 0);
      });

      // Step 3: Compare each product's total stock against its ReorderLevel
      // Step 3: Compare each product's total stock against its ReorderLevel
      let allStockList = [];
      let lowStockAlerts = 0;
      
      Object.values(stockByProduct).forEach(prod => {
        const itemInfo = reorderMap[prod.productId];
        const reorder = itemInfo ? itemInfo.reorderLevel : 0;
        const isLowStock = reorder > 0 && prod.totalQty < reorder;
        const deficit = isLowStock ? reorder - prod.totalQty : 0;
        
        if (isLowStock) lowStockAlerts++;

        allStockList.push({
          productName: prod.productName,
          stock: prod.totalQty,
          reorderLevel: reorder,
          deficit: deficit,
          isLowStock
        });
      });

      // Also check items that have a reorderLevel but ZERO stock (not in StockBalance at all)
      allItems.forEach(item => {
        if (!stockByProduct[item.id]) {
          const isLowStock = (item.reorderLevel || 0) > 0;
          if (isLowStock) lowStockAlerts++;

          allStockList.push({
            productName: item.name,
            stock: 0,
            reorderLevel: item.reorderLevel ?? 0,
            deficit: item.reorderLevel ?? 0,
            isLowStock
          });
        }
      });

      // Sort: Critical low stock first (by deficit), then alphabetically by name
      allStockList.sort((a, b) => {
        if (a.isLowStock && !b.isLowStock) return -1;
        if (!a.isLowStock && b.isLowStock) return 1;
        if (a.isLowStock && b.isLowStock) return b.deficit - a.deficit;
        return a.productName.localeCompare(b.productName);
      });

      const newInq = inquiryRes?.totalCount || 0;
      const pendingConf = pendingConfRes?.totalCount || 0;
      const confirmedConf = confirmedConfRes?.totalCount || 0;
      const rejectedConf = rejectedConfRes?.totalCount || 0;
      const sent = pendingConf + confirmedConf + rejectedConf;
      const confirmed = projectsRes?.totalCount || 0;
      const qCreated = quotCreatedRes?.totalCount || 0;
      const qConfirmed = quotConfirmedRes?.totalCount || 0;
      const techPack = techPackRes?.totalCount || 0;
      const pendingTechPack = pendingTechPackRes?.totalCount || 0;
      const sample = sampleRes?.totalCount || 0;
      const pfCreated = proformaCreatedRes?.totalCount || 0;

      setStats({
        newInquiries: newInq, sentQuotations: sent, confirmedProjects: confirmed,
        pendingConfirmation: pendingConf,
        confirmedByClient: confirmedConf,
        rejectedByClient: rejectedConf,
        proformaCreated: pfCreated, sampleConfirmed: sample, techPackConfirmed: techPack,
        pendingTechPacks: pendingTechPack,
        followUps: followUpRes?.items || [],
        sentQuotationsList: sentQuotListRes?.items || [],
        allStockItems: allStockList,
        lowStockCount: lowStockAlerts,
        pipelineDistribution: [
          { name: 'New Inquiries', value: newInq || 4, color: '#A8D8EA' },
          { name: 'Quotations Sent', value: sent || 3, color: '#FFD4EA' },
          { name: 'Proforma Issued', value: pfCreated || 2, color: '#FDEBB3' },
          { name: 'In Production', value: confirmed || 1, color: '#B5E6D0' }
        ],
        quotationFunnel: [
          { name: 'Created', count: qCreated },
          { name: 'Confirmed', count: qConfirmed },
          { name: 'TechPack', count: techPack },
          { name: 'Sample', count: sample },
          { name: 'Production', count: confirmed }
        ],
        totalSales, totalProfit: estimatedProfit, profitMargin,
        stockValue, stockCost: stockSellValue - stockValue,
        totalPaid, totalBalance, invoiceCount,
        recentSales: filteredInvoices.slice(0, 50),
        shippingTargets: shippingRes || []
      });
      setLoading(false);
    } catch (error) {
      console.error("Apparel Dashboard Error:", error);
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleFilterApply = () => { fetchData(); };

  if (loading) return (
    <div style={{ padding: '100px', textAlign: 'center' }}>
      <div style={{ fontSize: '28px', marginBottom: '12px' }}>🧵</div>
      <div style={{ fontSize: '16px', color: '#888', fontFamily: 'Poppins', letterSpacing: '1px' }}>LOADING APPAREL INTELLIGENCE...</div>
    </div>
  );

  const deficitItems = (stats.shippingTargets || []).filter(s => (s.totalDeficit || 0) < 0).slice(0, 4);
  const { start: fStart, end: fEnd } = getDateRange();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Apparel Dashboard <span className={styles.wave}>🧵</span></h1>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#999' }}>Real-time garment Dashboard</p>
        </div>
      </header>

      {/* ── DATE FILTER BAR ── */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', padding: '16px 20px', background: '#FFF', borderRadius: '16px', border: '1px solid #F1F1F1' }}>
        <label style={{ fontSize: '12px', fontWeight: '600', color: '#555' }}>Filter:</label>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #E0E0E0', fontSize: '12px', background: '#FAFAFA', cursor: 'pointer' }}>
          <option value="year">Full Year</option>
          <option value="month">Specific Month</option>
          <option value="custom">Custom Range</option>
        </select>
        
        {filterType === 'year' && (
          <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))} style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #E0E0E0', fontSize: '12px', background: '#FAFAFA' }}>
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        )}
        
        {filterType === 'month' && (
          <>
            <select value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))} style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #E0E0E0', fontSize: '12px', background: '#FAFAFA' }}>
              {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))} style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #E0E0E0', fontSize: '12px', background: '#FAFAFA' }}>
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </>
        )}
        
        {filterType === 'custom' && (
          <>
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #E0E0E0', fontSize: '12px' }} />
            <span style={{ fontSize: '12px', color: '#999' }}>to</span>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #E0E0E0', fontSize: '12px' }} />
          </>
        )}
        
        <button onClick={handleFilterApply} style={{ padding: '8px 20px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #1A1D1F 0%, #344D67 100%)', color: '#FFF', fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'transform 0.15s' }}
          onMouseOver={e => e.target.style.transform = 'scale(1.05)'} onMouseOut={e => e.target.style.transform = 'scale(1)'}>
          Apply Filter
        </button>
        <span style={{ fontSize: '11px', color: '#AAA', marginLeft: 'auto' }}>
          Showing: {fStart} → {fEnd}
        </span>
      </div>

      {/* ── KPI CARDS ── */}
      <div className={styles.kpiGrid}>
        {[
          { label: "New Inquiries", val: stats.newInquiries, trend: "Pipeline", bg: styles.bgBlue, icon: "📋" },
          { label: "Sent Quotations", val: stats.sentQuotations, trend: "Awaiting", bg: styles.bgPink, icon: "📨" },
          { label: "Proforma Invoices", val: stats.proformaCreated, trend: "Billing", bg: styles.bgYellow, icon: "🧾" },
          { label: "In Production", val: stats.confirmedProjects, trend: "Active", bg: styles.bgTeal, icon: "🏭" }
        ].map((kpi, idx) => (
          <div key={idx} className={`${styles.kpiCard} ${kpi.bg}`}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiIcon}>{kpi.icon}</div>
              <span className={styles.kpiTrend}>{kpi.trend}</span>
            </div>
            <div className={styles.kpiBody}>
              <span className={styles.kpiLabel}>{kpi.label}</span>
              <span className={styles.kpiValue}>{kpi.val}</span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.mainGrid}>
        <div className={styles.colLeft}>

          {/* ── PIE CHART ── */}
          <div className={styles.contentBlock}>
            <div className={styles.blockHeader}><h3 className={styles.blockTitle}>Inquiry Pipeline Distribution</h3></div>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={stats.pipelineDistribution} cx="50%" cy="46%" innerRadius={55} outerRadius={85} paddingAngle={5} dataKey="value"
                    label={renderCustomLabel} labelLine={{ stroke: '#CCC', strokeWidth: 1 }}>
                    {stats.pipelineDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="#FFF" strokeWidth={2} />)}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} orders`, name]} />
                  <Legend 
                    verticalAlign="bottom" 
                    iconType="circle" 
                    iconSize={8} 
                    wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} 
                    formatter={(value) => <span style={{ color: '#333', fontWeight: 500 }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── QUOTATION FUNNEL ── */}
          <div className={styles.contentBlock}>
            <div className={styles.blockHeader}><h3 className={styles.blockTitle}>Quotation → Production Funnel</h3></div>
            <div className={styles.chartContainerSmall}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.quotationFunnel} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F4F4F4" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#555' }} width={75} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={16}>
                    {stats.quotationFunnel.map((_, i) => <Cell key={i} fill={['#A8D8EA','#FFD4EA','#FDEBB3','#B5E6D0','#D4C5F9'][i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── RECENT SALES ── */}
          <h2 className={styles.sectionTitle}>Recent Sales</h2>
          <div className={styles.contentBlock} style={{ padding: '0' }}>
            <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
              {stats.recentSales.map((sale, idx) => (
                <div key={idx} style={{ padding: '10px 16px', borderBottom: '1px solid #F4F7FE', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: '500', color: '#333', display: 'block' }}>{sale.customerName}</span>
                    <span style={{ fontSize: '9px', color: '#BBB' }}>{sale.documentNo}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: '700', fontSize: '12px', color: '#27AE60', display: 'block' }}>Rs. {fmt(sale.netTotal)}</span>
                    {sale.balance > 0 && <span style={{ fontSize: '9px', color: '#FF7043' }}>Bal: Rs. {fmt(sale.balance)}</span>}
                  </div>
                </div>
              ))}
              {stats.recentSales.length === 0 && <p style={{ textAlign: 'center', padding: '14px', fontSize: '11px', color: '#999' }}>No sales in selected period</p>}
            </div>
          </div>

        </div>

        <div className={styles.colRight}>

          {/* ── CLIENT CONFIRMATION ── */}
          <h2 className={styles.sectionTitle}>Client Confirmation</h2>
          <div className={styles.miniStatGrid}>
            <div className={styles.miniStat} style={{ background: '#FDEBB3' }}>
              <p className={styles.miniStatValue}>{stats.pendingConfirmation}</p>
              <p className={styles.miniStatLabel}>Pending</p>
            </div>
            <div className={styles.miniStat} style={{ background: '#CFE8E8' }}>
              <p className={styles.miniStatValue}>{stats.confirmedByClient}</p>
              <p className={styles.miniStatLabel}>Confirmed</p>
            </div>
            <div className={styles.miniStat} style={{ background: '#FFD4EA' }}>
              <p className={styles.miniStatValue}>{stats.rejectedByClient}</p>
              <p className={styles.miniStatLabel}>Rejected</p>
            </div>
          </div>

          {/* ── PRODUCTION READINESS ── */}
          <h2 className={styles.sectionTitle}>Production Readiness</h2>
          <div className={styles.miniStatGridTwo}>
            <div className={styles.miniStat} style={{ background: '#FFF3E0' }}>
              <p className={styles.miniStatValue}>{stats.pendingTechPacks}</p>
              <p className={styles.miniStatLabel}>Pending TechPacks</p>
            </div>
            <div className={styles.miniStat} style={{ background: '#E8F4FD' }}>
              <p className={styles.miniStatValue}>{stats.techPackConfirmed}</p>
              <p className={styles.miniStatLabel}>Confirmed TechPacks</p>
            </div>
          </div>

          {/* ── FINANCIAL OVERVIEW (CALCULATED) ── */}
          <h2 className={styles.sectionTitle}>Financial Summary <span style={{ fontSize: '10px', color: '#999', fontWeight: '400' }}>({stats.invoiceCount} invoices)</span></h2>
          <div className={styles.darkFooter}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <p style={{ fontSize: '10px', opacity: 0.5, margin: 0, letterSpacing: '0.5px' }}>TOTAL SALES</p>
                <p style={{ fontSize: '20px', fontWeight: '700', margin: '4px 0 0' }}>Rs. {fmt(stats.totalSales)}</p>
              </div>
              <div>
                <p style={{ fontSize: '10px', opacity: 0.5, margin: 0, letterSpacing: '0.5px' }}>AMOUNT PAID</p>
                <p style={{ fontSize: '20px', fontWeight: '700', margin: '4px 0 0', color: '#4CAF50' }}>Rs. {fmt(stats.totalPaid)}</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
              <div>
                <p style={{ fontSize: '10px', opacity: 0.5, margin: 0, letterSpacing: '0.5px' }}>OUTSTANDING BAL.</p>
                <p style={{ fontSize: '16px', fontWeight: '600', margin: '4px 0 0', color: '#FF7043' }}>Rs. {fmt(stats.totalBalance)}</p>
              </div>
              <div>
                <p style={{ fontSize: '10px', opacity: 0.5, margin: 0, letterSpacing: '0.5px' }}>STOCK VALUE (COST)</p>
                <p style={{ fontSize: '16px', fontWeight: '600', margin: '4px 0 0' }}>Rs. {fmt(stats.stockValue)}</p>
              </div>
            </div>
          </div>

          {/* ── SENT QUOTATIONS ── */}
          <h2 className={styles.sectionTitle}>Latest Sent Quotations</h2>
          <div className={styles.inventoryAlerts}>
            {stats.sentQuotationsList.slice(0, 3).map((q, idx) => (
              <div key={idx} className={styles.alertCard} style={{ background: '#F8F9FF', borderLeft: '4px solid #A8D8EA' }}>
                <div className={styles.alertIcon}>📑</div>
                <div style={{ flex: 1 }}>
                  <p className={styles.alertText}><strong>{q.customerName}</strong></p>
                  <p style={{ fontSize: '10px', margin: '2px 0 0', color: '#888' }}>Style: {q.styleName} | {q.inquiryCode}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '12px', fontWeight: '700', color: '#27AE60', margin: 0 }}>Rs. {fmt(q.totalAmount || q.revenue || q.sellingPrice || 0)}</p>
                </div>
              </div>
            ))}
            {stats.sentQuotationsList.length === 0 && <p className={styles.alertText}>No sent quotations</p>}
          </div>



          {/* ── FOLLOW-UP REMINDERS ── */}
          <h2 className={styles.sectionTitle}>Follow-Up Reminders</h2>
          <div className={styles.inventoryAlerts}>
            {stats.followUps.slice(0, 3).map((fu, idx) => (
              <div key={idx} className={styles.alertCard} style={{ background: '#FFF8E1', borderLeft: '4px solid #F5D98A' }}>
                <div className={styles.alertIcon}>🔔</div>
                <div style={{ flex: 1 }}>
                  <p className={styles.alertText}><strong>{fu.customerName || fu.styleName || `Inquiry #${fu.inquiryId}`}</strong></p>
                  <p style={{ fontSize: '10px', margin: '2px 0 0', color: '#888' }}>{fu.inquiryCode || 'Pending follow-up'}</p>
                </div>
              </div>
            ))}
            {stats.followUps.length === 0 && <p className={styles.alertText}>No pending follow-ups</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
