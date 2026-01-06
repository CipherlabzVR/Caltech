import React, { useEffect, useState } from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import Grid from "@mui/material/Grid";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import { Box, Button, IconButton, MenuItem, Select, TextField, Typography, Divider, CircularProgress, Tooltip as MuiTooltip, Tabs, Tab } from "@mui/material";
import { toast, ToastContainer } from "react-toastify";
import BASE_URL from "Base/api";
import DeleteIcon from "@mui/icons-material/Delete";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import LoadingButton from "@/components/UIElements/Buttons/LoadingButton";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import DescriptionIcon from "@mui/icons-material/Description";
import StoreIcon from "@mui/icons-material/Store";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import Modal from "@mui/material/Modal";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

export default function CreateDailyDeposit() {
  const [banks, setBanks] = useState([]);
  const [isHaSBank, setIsHasBank] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedList, setSelectedList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [depositSummary, setDepositSummary] = useState(null);
  const [summaryTotals, setSummaryTotals] = useState(null);
  const [selectedBank, setSelectedBank] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedItem, setSelectedItem] = useState({
    supplierId: "",
    supplierName: "",
    amount: "",
    paymentType: 0,
    bankId: null,
    bankName: "",
    bankAccNo: "",
    bankUsername: "",
    isHaSBank: false
  });
  const [invoiceLineDetailsModalOpen, setInvoiceLineDetailsModalOpen] = useState(false);
  const [invoiceLineDetails, setInvoiceLineDetails] = useState([]);
  const [selectedSalesPersonTab, setSelectedSalesPersonTab] = useState(0);
  const [loadingInvoiceDetails, setLoadingInvoiceDetails] = useState(false);
  const [selectedSupplierForDetails, setSelectedSupplierForDetails] = useState(null);
  const [bankAssignmentModalOpen, setBankAssignmentModalOpen] = useState(false);
  const [supplierNeedingBank, setSupplierNeedingBank] = useState(null);
  const [selectedBankForAssignment, setSelectedBankForAssignment] = useState(null);
  const [profitBreakdownModalOpen, setProfitBreakdownModalOpen] = useState(false);
  const [salesPersonBankSelection, setSalesPersonBankSelection] = useState({}); // { salesPersonName: bankId }
  const [supplierInvoiceLineDetails, setSupplierInvoiceLineDetails] = useState({}); // { supplierKey: invoiceLineDetails[] }
  const [supplierSalesPersonBanks, setSupplierSalesPersonBanks] = useState({}); // { supplierKey: { salesPersonName: bankId } }


  const fetchDepositSummary = async (date) => {
    try {
      const token = localStorage.getItem("token");
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      const query = `${BASE_URL}/DailyDeposit/LoadDailyDepositDataByDate?depositDate=${formattedDate}`;

      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch items");

      const data = await response.json();

      // Map the new response structure to match existing UI expectations
      if (data.result) {
        const mappedData = {
          supplierDetails: data.result.supplierDetails || [],
          totalCash: 0,
          totalCard: 0,
          totalBankTransfer: 0,
          totalCheque: 0,
          cashCustomerNames: data.result.cashCustomerNames || [],
          isCashCustomerNameEnabled: data.result.isCashCustomerNameEnabled || false,
          totalCancelledInvoice: data.result.totalCancelledInvoice || 0,
          totalReceipt: data.result.totalReceipt || 0,
          totalReceiptCash: data.result.totalReceiptCash || 0,
          totalReceiptCard: data.result.totalReceiptCard || 0,
          totalReceiptBankTransfer: data.result.totalReceiptBankTransfer || 0,
          totalReceiptCheque: data.result.totalReceiptCheque || 0,
          totalInvoice: data.result.totalInvoice || 0,
          totalInvoiceCash: data.result.totalInvoiceCash || 0,
          totalInvoiceCard: data.result.totalInvoiceCard || 0,
          totalInvoiceBankTransfer: data.result.totalInvoiceBankTransfer || 0,
          totalInvoiceCheque: data.result.totalInvoiceCheque || 0,
          totalInvoiceCredit: data.result.totalInvoiceCredit || 0
        };
        setDepositSummary(mappedData);
      } else {
        setDepositSummary(null);
      }
    } catch (error) {
      console.error("Error:", error);
      setDepositSummary(null);
    }
  };

  const fetchSummaryTotals = async (date) => {
    try {
      const token = localStorage.getItem("token");
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      const query = `${BASE_URL}/DailyDeposit/GetDailyDepositSummaryTotals?depositDate=${formattedDate}`;

      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch summary totals:", response.status, errorText);
        throw new Error("Failed to fetch summary totals");
      }

      const data = await response.json();
      console.log("Summary Totals API Response:", data);

      if (data.result) {
        console.log("Setting summary totals:", data.result);
        setSummaryTotals({
          totalCashIn: data.result.totalCashIn || 0,
          totalCashOut: data.result.totalCashOut || 0,
          totalSalesReturn: data.result.totalSalesReturn || 0
        });
      } else {
        console.warn("No result in summary totals response:", data);
        setSummaryTotals({
          totalCashIn: 0,
          totalCashOut: 0,
          totalSalesReturn: 0
        });
      }
    } catch (error) {
      console.error("Error fetching summary totals:", error);
      // Set default values instead of null so cards still display
      setSummaryTotals({
        totalCashIn: 0,
        totalCashOut: 0,
        totalSalesReturn: 0
      });
    }
  };

  const fetchBanks = async () => {
    try {
      const response = await fetch(`${BASE_URL}/Bank/GetAllBanks`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setBanks(data.result);
    } catch (error) {
      console.error("Error fetching:", error);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      // Clear stored invoice line details when fetching new deposit summary
      setSupplierInvoiceLineDetails({});
      setSupplierSalesPersonBanks({});
      fetchDepositSummary(selectedDate);
      fetchSummaryTotals(selectedDate);
    } else {
      setDepositSummary(null);
      setSummaryTotals(null);
      setSelectedList([]);
    }
    fetchBanks();
  }, [selectedDate]);

  useEffect(() => {
    const summaryItems = [];
    if (depositSummary) {
      if (depositSummary.totalCash > 0) {
        summaryItems.push({
          supplierId: 'SUMMARY_CASH', supplierName: 'Daily Cash Summary', amount: depositSummary.totalCash,
          cashAmount: depositSummary.totalCash, cardAmount: 0, bankTransferAmount: 0, chequeAmount: 0,
          paymentType: -1, bank: 'N/A', accountNo: 'N/A', accountUsername: 'N/A', bankId: null,
        });
      }
      if (depositSummary.totalCard > 0) {
        summaryItems.push({
          supplierId: 'SUMMARY_CARD', supplierName: 'Daily Card Summary', amount: depositSummary.totalCard,
          cashAmount: 0, cardAmount: depositSummary.totalCard, bankTransferAmount: 0, chequeAmount: 0,
          paymentType: -2, bank: 'N/A', accountNo: 'N/A', accountUsername: 'N/A', bankId: null,
        });
      }
      if (depositSummary.totalBankTransfer > 0) {
        summaryItems.push({
          supplierId: 'SUMMARY_BANK', supplierName: 'Daily Bank Transfer Summary', amount: depositSummary.totalBankTransfer,
          cashAmount: 0, cardAmount: 0, bankTransferAmount: depositSummary.totalBankTransfer, chequeAmount: 0,
          paymentType: -3, bank: 'N/A', accountNo: 'N/A', accountUsername: 'N/A', bankId: null,
        });
      }
      if (depositSummary.totalCheque > 0) {
        summaryItems.push({
          supplierId: 'SUMMARY_CHEQUE', supplierName: 'Daily Cheque Summary', amount: depositSummary.totalCheque,
          cashAmount: 0, cardAmount: 0, bankTransferAmount: 0, chequeAmount: depositSummary.totalCheque,
          paymentType: -4, bank: 'N/A', accountNo: 'N/A', accountUsername: 'N/A', bankId: null,
        });
      }

    }
    setSelectedList(currentList => {
      const manuallyAddedItems = currentList.filter(item => !String(item.supplierId).startsWith('SUMMARY_'));
      return [...manuallyAddedItems, ...summaryItems];
    });
  }, [depositSummary]);

  const handleRowClick = (item) => {
    setIsHasBank(item.bankId !== 0 && item.bankId !== null);
    setSelectedItem({
      ...item,
      amount: item.totalCost || item.totalProfit || 0,
      supplierId: item.supplierId,
      supplierName: item.supplierName,
      paymentType: item.paymentType || 0,
      bankId: item.bankId || null,
      bankName: item.bankName || "",
      bankAccNo: item.bankAccountNo || "",
      bankUsername: item.bankAccountUsername || "",
      isHaSBank: item.bankId !== 0 && item.bankId !== null
    });
  };

  const fetchInvoiceLineDetails = async (item) => {
    if (!selectedDate) {
      toast.error("Please select a date first");
      return;
    }

    setLoadingInvoiceDetails(true);
    setSelectedSupplierForDetails(item);

    try {
      const token = localStorage.getItem("token");
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;

      // Determine itemType: if itemType is not set, check if it's a DBR item by checking if supplierId matches DBR pattern
      // For DBR items, we need to ensure itemType is 3
      let itemType = item.itemType;
      if (!itemType) {
        // Check if this might be a DBR item - DBR items typically have higher supplierIds
        // If itemType is not set, default to 1 (Item), but we should check the context
        itemType = 1;
      }
      // Ensure itemType is a number
      itemType = Number(itemType) || 1;
      const receiptNumber = item.isFromReceipt && item.receiptNumber ? `&receiptNumber=${encodeURIComponent(item.receiptNumber)}` : '';
      const query = `${BASE_URL}/DailyDeposit/GetInvoiceLineDetailsBySupplier?depositDate=${formattedDate}&supplierId=${item.supplierId}&itemType=${itemType}${receiptNumber}`;

      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch invoice line details");

      const data = await response.json();

      if (data.result) {
        setInvoiceLineDetails(data.result);
        setSelectedSalesPersonTab(0);
        
        // Store invoice line details for this supplier
        const supplierKey = getSupplierKey(item);
        setSupplierInvoiceLineDetails(prev => ({
          ...prev,
          [supplierKey]: data.result
        }));
        
        // Initialize bank selection for each sales person from the supplier's bank
        const groupedBySalesPerson = data.result.reduce((acc, detail) => {
          const salesPersonName = detail.salesPersonName || "N/A";
          if (!acc[salesPersonName]) {
            acc[salesPersonName] = [];
          }
          acc[salesPersonName].push(detail);
          return acc;
        }, {});
        
        const initialBankSelection = {};
        Object.keys(groupedBySalesPerson).forEach(salesPersonName => {
          // Use the supplier's current bank if available
          if (item.bankId && item.bankId > 0) {
            initialBankSelection[salesPersonName] = item.bankId;
          }
        });
        setSalesPersonBankSelection(initialBankSelection);
        
        // Store bank selections for this supplier
        setSupplierSalesPersonBanks(prev => ({
          ...prev,
          [supplierKey]: initialBankSelection
        }));
        
        setInvoiceLineDetailsModalOpen(true);
      } else {
        setInvoiceLineDetails([]);
        setSelectedSalesPersonTab(0);
        setSalesPersonBankSelection({});
        
        // Store empty invoice line details
        const supplierKey = getSupplierKey(item);
        setSupplierInvoiceLineDetails(prev => ({
          ...prev,
          [supplierKey]: []
        }));
        setSupplierSalesPersonBanks(prev => ({
          ...prev,
          [supplierKey]: {}
        }));
        
        setInvoiceLineDetailsModalOpen(true);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to fetch invoice line details");
      setInvoiceLineDetails([]);
    } finally {
      setLoadingInvoiceDetails(false);
    }
  };

  const handleRowDoubleClick = (item) => {
    fetchInvoiceLineDetails(item);
  };

  const handleAddSupplier = () => {
    const { supplierName, amount, paymentType } = selectedItem;
    if (!supplierName || !amount) {
      setMessage("Please select an item and ensure it has an amount."); return;
    }
    setMessage("");

    let paymentAmounts = {
      cashAmount: 0, cardAmount: 0, bankTransferAmount: 0, chequeAmount: 0
    };
    switch (paymentType) {
      case 1: paymentAmounts.cashAmount = parseFloat(amount); break;
      case 2: paymentAmounts.cardAmount = parseFloat(amount); break;
      case 4: paymentAmounts.bankTransferAmount = parseFloat(amount); break;
      case 5: paymentAmounts.chequeAmount = parseFloat(amount); break;
    }
    const newItem = {
      ...selectedItem, ...paymentAmounts,
      bank: selectedItem.isHaSBank ? selectedItem.bankName : selectedBank.name,
      // FIX: Use `null` if no bank is selected.
      bankId: selectedItem.isHaSBank ? selectedItem.bankId : (selectedBank.id || null),
      accountNo: selectedItem.isHaSBank ? selectedItem.bankAccNo : selectedBank.accountNo,
      accountUsername: selectedItem.isHaSBank ? selectedItem.bankUsername : selectedBank.accountUsername
    };
    setSelectedList(prev => [...prev, newItem]);
    setSelectedItem({ supplierName: "", amount: "", bank: "", supplierId: "", bankId: null, bankName: "", bankAccNo: "", bankUsername: "", isHaSBank: false, paymentType: 0 });
    setSelectedBank({});
    setIsHasBank(false);
  };

  const handleDelete = (indexToRemove) => {
    setSelectedList(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  // Add all suppliers at once
  const handleAddAll = () => {
    if (!depositSummary?.supplierDetails || depositSummary.supplierDetails.length === 0) {
      toast.error("No suppliers available to add.");
      return;
    }

    const suppliersToAdd = [];
    const suppliersNeedingBank = [];

    depositSummary.supplierDetails.forEach((supplier) => {
      // Skip receipt entries and profit account (they're handled separately)
      if (supplier.isFromReceipt || supplier.isProfitAccount) {
        return;
      }

      const total = (supplier.totalCost || 0) + (supplier.totalProfit || 0);

      if (total <= 0) {
        return; // Skip entries with zero or negative amounts
      }

      // Check if bank is assigned
      if (!supplier.bankId || supplier.bankId === 0) {
        suppliersNeedingBank.push(supplier);
        return;
      }

      const paymentAmounts = {
        cashAmount: supplier.cashAmount || 0,
        cardAmount: supplier.cardAmount || 0,
        bankTransferAmount: supplier.bankTransferAmount || 0,
        chequeAmount: supplier.chequeAmount || 0
      };

      suppliersToAdd.push({
        supplierId: supplier.supplierId,
        supplierName: supplier.supplierName,
        amount: total,
        paymentType: supplier.paymentType || 0,
        bankId: supplier.bankId,
        bank: supplier.bankName || "",
        accountNo: supplier.bankAccountNo || "",
        accountUsername: supplier.bankAccountUsername || "",
        isHaSBank: true,
        ...paymentAmounts
      });
    });

    // Handle suppliers needing bank assignment
    if (suppliersNeedingBank.length > 0) {
      setSupplierNeedingBank(suppliersNeedingBank);
      setBankAssignmentModalOpen(true);
      // Add suppliers that have banks
      if (suppliersToAdd.length > 0) {
        setSelectedList(prev => [...prev, ...suppliersToAdd]);
        toast.info(`${suppliersToAdd.length} suppliers added. ${suppliersNeedingBank.length} need bank assignment.`);
      } else {
        toast.warning(`${suppliersNeedingBank.length} suppliers need bank assignment.`);
      }
      return;
    }

    // Add profit account if exists
    const profitAccount = depositSummary.supplierDetails.find(item => item.isProfitAccount);
    if (profitAccount && profitAccount.totalProfit > 0) {
      suppliersToAdd.push({
        supplierId: 0,
        supplierName: profitAccount.supplierName,
        amount: profitAccount.totalProfit,
        paymentType: profitAccount.paymentType || 0,
        bankId: profitAccount.bankId,
        bank: profitAccount.bankName || "",
        accountNo: profitAccount.bankAccountNo || "",
        accountUsername: profitAccount.bankAccountUsername || "",
        isHaSBank: true,
        cashAmount: 0,
        cardAmount: 0,
        bankTransferAmount: 0,
        chequeAmount: 0
      });
    }

    if (suppliersToAdd.length === 0) {
      toast.error("No suppliers available to add.");
      return;
    }

    setSelectedList(prev => [...prev, ...suppliersToAdd]);
    toast.success(`${suppliersToAdd.length} suppliers added successfully.`);
  };

  // Handle bank assignment for suppliers without banks
  const handleAssignBank = () => {
    if (!selectedBankForAssignment || !supplierNeedingBank || supplierNeedingBank.length === 0) {
      toast.error("Please select a bank.");
      return;
    }

    const bank = banks.find(b => b.id === selectedBankForAssignment);
    if (!bank) {
      toast.error("Selected bank not found.");
      return;
    }

    const suppliersToAdd = supplierNeedingBank.map((supplier) => {
      const total = (supplier.totalCost || 0) + (supplier.totalProfit || 0);
      const paymentAmounts = {
        cashAmount: supplier.cashAmount || 0,
        cardAmount: supplier.cardAmount || 0,
        bankTransferAmount: supplier.bankTransferAmount || 0,
        chequeAmount: supplier.chequeAmount || 0
      };

      return {
        supplierId: supplier.supplierId,
        supplierName: supplier.supplierName,
        amount: total,
        paymentType: supplier.paymentType || 0,
        bankId: bank.id,
        bank: bank.name || "",
        accountNo: bank.accountNo || "",
        accountUsername: bank.accountUsername || "",
        isHaSBank: true,
        ...paymentAmounts
      };
    });

    setSelectedList(prev => [...prev, ...suppliersToAdd]);
    setBankAssignmentModalOpen(false);
    setSupplierNeedingBank(null);
    setSelectedBankForAssignment(null);
    toast.success(`${suppliersToAdd.length} suppliers added with bank assignment.`);
  };

  const selectedItemsTotalAmount = selectedList.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  // Calculate summary totals from supplier details
  // Calculate totals including all supplier details (invoices, receipts, and profit account)
  const supplierSummaryTotals = depositSummary?.supplierDetails?.reduce((acc, supplier) => {
    acc.totalCost += supplier.totalCost || 0;
    acc.totalProfit += supplier.totalProfit || 0;
    acc.totalCashAmount += supplier.cashAmount || 0;
    // Count all entries including profit account (exclude only receipt entries that are duplicates)
    // For counting suppliers, include invoices and profit account, but not separate receipt entries
    // since receipt amounts are aggregated with invoices
    if (!supplier.isFromReceipt) {
      acc.totalSuppliers += 1;
    }
    return acc;
  }, { totalCost: 0, totalProfit: 0, totalCashAmount: 0, totalSuppliers: 0 }) || { totalCost: 0, totalProfit: 0, totalCashAmount: 0, totalSuppliers: 0 };

  // Get profit account amount (this is the sum of all profits from invoices and receipts)
  const profitAccountItem = depositSummary?.supplierDetails?.find(item => item.isProfitAccount);
  const baseProfitAmount = profitAccountItem?.totalProfit || 0;
  
  // Calculate adjusted profit: base profit + cash in - cash out
  const totalCashIn = summaryTotals?.totalCashIn || 0;
  const totalCashOut = summaryTotals?.totalCashOut || 0;
  const profitAccountAmount = baseProfitAmount + totalCashIn - totalCashOut;

  // Calculate total amount from invoice entries only (exclude receipt entries as they are separate)
  // Total = Cost + Profit (selling price)
  const invoiceEntries = depositSummary?.supplierDetails?.filter(item => !item.isFromReceipt && !item.isProfitAccount) || [];
  const invoiceTotalAmount = invoiceEntries.reduce((sum, item) => {
    return sum + (item.totalCost || 0) + (item.totalProfit || 0);
  }, 0);

  // Receipt entries total (Cost + Profit only, no cash amount in total)
  const receiptEntries = depositSummary?.supplierDetails?.filter(item => item.isFromReceipt) || [];
  const receiptTotalAmount = receiptEntries.reduce((sum, item) => {
    return sum + (item.totalCost || 0) + (item.totalProfit || 0);
  }, 0);

  // Profit account amount
  const profitAccountTotal = profitAccountAmount || 0;

  // Total Amount = Cost + Profit (should equal Cost card + Profit card)
  const totalAmount = supplierSummaryTotals.totalCost + profitAccountAmount;

  // Prepare pie chart data for Receipts
  const receiptChartData = [
    { name: "Cash", value: depositSummary?.totalReceiptCash || 0, color: "#16A34A" },
    { name: "Card", value: depositSummary?.totalReceiptCard || 0, color: "#2563EB" },
    { name: "Bank Transfer", value: depositSummary?.totalReceiptBankTransfer || 0, color: "#D97706" },
    { name: "Cheque", value: depositSummary?.totalReceiptCheque || 0, color: "#DB2777" }
  ].filter(item => item.value > 0);

  // Prepare pie chart data for Invoices
  const invoiceChartData = [
    { name: "Cash", value: depositSummary?.totalInvoiceCash || 0, color: "#16A34A" },
    { name: "Card", value: depositSummary?.totalInvoiceCard || 0, color: "#2563EB" },
    { name: "Bank Transfer", value: depositSummary?.totalInvoiceBankTransfer || 0, color: "#D97706" },
    { name: "Cheque", value: depositSummary?.totalInvoiceCheque || 0, color: "#DB2777" },
    { name: "Credit", value: depositSummary?.totalInvoiceCredit || 0, color: "#F59E0B" }
  ].filter(item => item.value > 0);

  const availableSuppliers = depositSummary?.supplierDetails?.filter(
    (supplier) => !selectedList.some(selected => selected.supplierId === supplier.supplierId && selected.paymentType === supplier.paymentType)
  ) || [];

  // Submit all suppliers at once
  // Function to update bank for a supplier in depositSummary
  const updateSupplierBank = (supplierIndex, bankId, bankName, bankAccountNo, bankAccountUsername) => {
    if (!depositSummary || !depositSummary.supplierDetails) return;

    const updatedSuppliers = [...depositSummary.supplierDetails];
    if (updatedSuppliers[supplierIndex]) {
      updatedSuppliers[supplierIndex] = {
        ...updatedSuppliers[supplierIndex],
        bankId: bankId,
        bankName: bankName || "",
        bankAccountNo: bankAccountNo || "",
        bankAccountUsername: bankAccountUsername || ""
      };
      setDepositSummary({
        ...depositSummary,
        supplierDetails: updatedSuppliers
      });
      toast.success(`Bank assigned to ${updatedSuppliers[supplierIndex].supplierName}`);
    }
  };

  // Helper function to find supplier index in depositSummary
  const findSupplierIndex = (item) => {
    if (!depositSummary || !depositSummary.supplierDetails) return -1;
    return depositSummary.supplierDetails.findIndex(s =>
      s.supplierId === item.supplierId &&
      s.itemType === item.itemType &&
      s.isFromReceipt === item.isFromReceipt &&
      s.isProfitAccount === item.isProfitAccount &&
      s.receiptNumber === item.receiptNumber
    );
  };

  // Helper function to generate a unique key for a supplier
  const getSupplierKey = (item) => {
    if (!item) return "";
    return `${item.supplierId}_${item.itemType || 1}_${item.isFromReceipt ? 'R' : 'I'}_${item.isProfitAccount ? 'P' : 'N'}_${item.receiptNumber || ''}`;
  };


  const handleSubmitAllSuppliers = async () => {
    if (!depositSummary?.supplierDetails || depositSummary.supplierDetails.length === 0) {
      toast.error("No supplier data available to submit.");
      return;
    }

    const allSuppliers = depositSummary.supplierDetails;
    const depositLineDetails = [];

    // Process each supplier
    for (const row of allSuppliers) {
      const supplierKey = getSupplierKey(row);
      const invoiceDetails = supplierInvoiceLineDetails[supplierKey] || [];
      const salesPersonBanks = supplierSalesPersonBanks[supplierKey] || {};

      // Check if this supplier has invoice line details with multiple sales persons
      if (invoiceDetails && invoiceDetails.length > 0) {
        // Group invoice details by sales person
        const groupedBySalesPerson = invoiceDetails.reduce((acc, detail) => {
          const salesPersonName = detail.salesPersonName || "N/A";
          if (!acc[salesPersonName]) {
            acc[salesPersonName] = [];
          }
          acc[salesPersonName].push(detail);
          return acc;
        }, {});

        const salesPersonNames = Object.keys(groupedBySalesPerson);

        // If multiple sales persons, create separate lines for each
        if (salesPersonNames.length > 1) {
          for (const salesPersonName of salesPersonNames) {
            const detailsForSalesPerson = groupedBySalesPerson[salesPersonName];
            const bankId = salesPersonBanks[salesPersonName];

            // Validate bank selection for this sales person
            if (!bankId || bankId === 0 || bankId === "") {
              toast.error(`Please assign a bank for ${row.supplierName} - ${salesPersonName} tab`);
              return;
            }

            // Calculate amounts for this sales person tab
            const lineTotal = detailsForSalesPerson.reduce((sum, d) => sum + (d.lineTotal || 0), 0);
            const costPrice = detailsForSalesPerson.reduce((sum, d) => sum + (d.costPrice || 0), 0);
            const profit = detailsForSalesPerson.reduce((sum, d) => sum + (d.profit || 0), 0);
            const amount = lineTotal; // Use lineTotal as the amount

            // Get bank details
            const bank = banks.find(b => b.id === bankId);

            // Create description with sales person information
            const description = `Sales Person: ${salesPersonName} | Items: ${detailsForSalesPerson.length} | Line Total: ${formatCurrency(lineTotal)} | Cost: ${formatCurrency(costPrice)} | Profit: ${formatCurrency(profit)}`;

            depositLineDetails.push({
              SupplierId: String(row.supplierId || 0).startsWith('SUMMARY_') || row.isProfitAccount ? 0 : (row.supplierId || 0),
              Supplier: `${row.supplierName} - ${salesPersonName}`,
              Amount: amount,
              BankId: bankId,
              BankAccountNumber: bank?.accountNo || "",
              CashAmount: 0,
              CardAmount: 0,
              BankTransferAmount: 0,
              ChequeAmount: 0,
              Description: description,
            });
          }
        } else {
          // Single sales person or no sales person grouping - use existing logic
          const salesPersonName = salesPersonNames[0] || "N/A";
          const bankId = salesPersonBanks[salesPersonName] || row.bankId;

          // Validate bank selection
          if (!bankId || bankId === 0 || bankId === "") {
            toast.error(`Please assign a bank for: ${row.supplierName}`);
            return;
          }

          const rowAmount = (row.totalCost || 0) + (row.totalProfit || 0);
          const bank = banks.find(b => b.id === bankId);

          depositLineDetails.push({
            SupplierId: String(row.supplierId || 0).startsWith('SUMMARY_') || row.isProfitAccount ? 0 : (row.supplierId || 0),
            Supplier: row.supplierName || "",
            Amount: rowAmount,
            BankId: bankId,
            BankAccountNumber: bank?.accountNo || "",
            CashAmount: row.cashAmount || 0,
            CardAmount: 0,
            BankTransferAmount: 0,
            ChequeAmount: 0,
          });
        }
      } else {
        // No invoice line details - use existing logic
        const hasAmount = ((row.totalCost || 0) + (row.totalProfit || 0) + (row.cashAmount || 0)) > 0;
        const hasBank = row.bankId && row.bankId > 0;

        if (hasAmount && !hasBank) {
          toast.error(`Please assign a bank for: ${row.supplierName}`);
          return;
        }

        const rowAmount = (row.totalCost || 0) + (row.totalProfit || 0);

        depositLineDetails.push({
          SupplierId: String(row.supplierId || 0).startsWith('SUMMARY_') || row.isProfitAccount ? 0 : (row.supplierId || 0),
          Supplier: row.supplierName || "",
          Amount: rowAmount,
          BankId: (row.bankId && row.bankId > 0) ? row.bankId : null,
          BankAccountNumber: row.bankAccountNo || "",
          CashAmount: row.cashAmount || 0,
          CardAmount: 0,
          BankTransferAmount: 0,
          ChequeAmount: 0,
        });
      }
    }

    // Calculate total amount from all deposit lines
    const calculatedTotalAmount = depositLineDetails.reduce((sum, line) => sum + (line.Amount || 0), 0);

    // Prepare data for submission
    const data = {
      DepositDate: formatDate(selectedDate),
      TotalAmount: parseFloat(calculatedTotalAmount),
      DailyDepositLineDetails: depositLineDetails,
    };

    try {
      setIsSubmitting(true);
      const res = await fetch(`${BASE_URL}/DailyDeposit/CreateDailyDeposit`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (res.ok) {
        toast.success(json.message || "All deposits created successfully!");
        //setTimeout(() => { window.location.href = "/sales/deposit/"; }, 1000);
      } else {
        toast.error(json.message || "An error occurred while creating deposits.");
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckDayEndDone = async (date) => {

    try {
      const response = await fetch(`${BASE_URL}/DayEnd/IsDayEndDoneForSelectedDate?date=${formatDate(date)}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch');
      }

      const result = await response.json();
      if (result) {
        setSelectedDate(date);
        // Clear stored invoice line details when date changes
        setSupplierInvoiceLineDetails({});
        setSupplierSalesPersonBanks({});
      } else {
        toast.info("Unable to proceed — day end not completed for " + formatDate(date));
        setSelectedDate(null);
        // Clear stored invoice line details when date is cleared
        setSupplierInvoiceLineDetails({});
        setSupplierSalesPersonBanks({});
        return;
      }
      return result;
    } catch (err) {
      console.error('Error fetching IsDayEndDone:', err);
    }

  }

  console.log(selectedDate);

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Create Daily Deposit</h1>
        <ul>
          <li><Link href="/sales/deposit/">Daily Deposit</Link></li>
          <li>Create</li>
        </ul>
      </div>

      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box sx={{ mb: 1 }}>
          <DatePicker
            label="Deposit Date"
            value={selectedDate}
            onChange={(newDate) => {
              console.log("Selected Date:", formatDate(newDate));
              handleCheckDayEndDone(newDate);
            }}
            renderInput={(params) => <TextField {...params} sx={{ mb: 2, width: '300px' }} />}
          />
        </Box>
      </LocalizationProvider>

      {/* Split Screen Layout: Left Supplier Table, Right Dashboard */}
      {selectedDate && depositSummary && (
        <Grid container spacing={2} sx={{ alignItems: "stretch" }}>
          {/* Left Side - Supplier-wise Totals Table */}
          <Grid item xs={12} md={7} sx={{ display: "flex" }}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 2,
                border: "1px solid #E5E7EB",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
                overflow: "hidden",
                width: "100%",
                display: "flex",
                flexDirection: "column"
              }}
            >
              <CardContent sx={{ p: 0, display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                <Box
                  sx={{
                    p: 1,
                    borderBottom: "1px solid #E5E7EB",
                    bgcolor: "#FAFBFC",
                    flexShrink: 0
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 600,
                      color: "#1F2937",
                      fontSize: "0.875rem"
                    }}
                  >
                    Supplier-wise Totals
                  </Typography>
                </Box>
                <TableContainer sx={{ flex: 1, overflowY: "auto", minHeight: 0, display: "flex", flexDirection: "column" }}>
                  <Table stickyHeader sx={{ flex: 1 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{
                          fontWeight: 600,
                          bgcolor: "#F9FAFB",
                          color: "#374151",
                          fontSize: "0.65rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          borderBottom: "2px solid #E5E7EB",
                          py: 0.5,
                          px: 1,
                          width: "35px",
                          minWidth: "35px"
                        }}>
                          #
                        </TableCell>
                        <TableCell sx={{
                          fontWeight: 600,
                          bgcolor: "#F9FAFB",
                          color: "#374151",
                          fontSize: "0.65rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          borderBottom: "2px solid #E5E7EB",
                          py: 0.5,
                          px: 1
                        }}>
                          Supplier Name
                        </TableCell>
                        <TableCell align="right" sx={{
                          fontWeight: 600,
                          bgcolor: "#F9FAFB",
                          color: "#374151",
                          fontSize: "0.65rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          borderBottom: "2px solid #E5E7EB",
                          py: 0.5,
                          px: 1,
                          width: "90px",
                          minWidth: "90px"
                        }}>
                          Cost
                        </TableCell>
                        <TableCell align="right" sx={{
                          fontWeight: 600,
                          bgcolor: "#F9FAFB",
                          color: "#374151",
                          fontSize: "0.65rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          borderBottom: "2px solid #E5E7EB",
                          py: 0.5,
                          px: 1,
                          width: "90px",
                          minWidth: "90px"
                        }}>
                          Profit
                        </TableCell>
                        <TableCell align="right" sx={{
                          fontWeight: 600,
                          bgcolor: "#F9FAFB",
                          color: "#374151",
                          fontSize: "0.65rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          borderBottom: "2px solid #E5E7EB",
                          py: 0.5,
                          px: 1,
                          width: "100px",
                          minWidth: "100px"
                        }}>
                          Total
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {!selectedDate ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                            <Typography color="textSecondary" sx={{ fontSize: "0.75rem" }}>Please select a deposit date.</Typography>
                          </TableCell>
                        </TableRow>
                      ) : !depositSummary ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                            <Typography color="textSecondary" sx={{ fontSize: "0.75rem" }}>Loading...</Typography>
                          </TableCell>
                        </TableRow>
                      ) : depositSummary.supplierDetails?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                            <Typography color="textSecondary" sx={{ fontSize: "0.75rem" }}>No supplier data found for the selected date.</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        <>
                          {(() => {
                            // Group supplier details by item type
                            const invoiceItems = depositSummary.supplierDetails?.filter(item => !item.isFromReceipt && !item.isProfitAccount) || [];
                            const receiptItems = depositSummary.supplierDetails?.filter(item => item.isFromReceipt) || [];
                            const profitAccountItems = depositSummary.supplierDetails?.filter(item => item.isProfitAccount) || [];

                            const itemType1 = invoiceItems.filter(item => item.itemType === 1 || !item.itemType);
                            const itemType2 = invoiceItems.filter(item => item.itemType === 2);
                            const itemType3 = invoiceItems.filter(item => item.itemType === 3);

                            const receiptItemType1 = receiptItems.filter(item => item.itemType === 1 || !item.itemType);
                            const receiptItemType2 = receiptItems.filter(item => item.itemType === 2);
                            const receiptItemType3 = receiptItems.filter(item => item.itemType === 3);

                            let rowIndex = 0;

                            return (
                              <>
                                {/* Item Type 1 (Item) */}
                                {itemType1.length > 0 && (
                                  <>
                                    <TableRow>
                                      <TableCell
                                        colSpan={5}
                                        sx={{
                                          bgcolor: "#F3F4F6",
                                          fontWeight: 600,
                                          color: "#1F2937",
                                          py: 0.5,
                                          px: 1,
                                          borderBottom: "2px solid #E5E7EB",
                                          fontSize: "0.75rem"
                                        }}
                                      >
                                        Items
                                      </TableCell>
                                    </TableRow>
                                    {itemType1.map((item) => {
                                      rowIndex++;
                                      const total = (item.totalCost || 0) + (item.totalProfit || 0);
                                      return (
                                        <TableRow
                                          key={`item-${item.supplierId}-${item.paymentType}`}
                                          onClick={() => handleRowClick(item)}
                                          onDoubleClick={() => handleRowDoubleClick(item)}
                                          hover
                                          sx={{
                                            cursor: "pointer",
                                            transition: "all 0.2s",
                                            "&:hover": {
                                              bgcolor: "#F3F4F6"
                                            }
                                          }}
                                        >
                                          <TableCell sx={{ py: 0.5, px: 1, color: "#6B7280", fontSize: "0.75rem" }}>{rowIndex}</TableCell>
                                          <TableCell sx={{ fontWeight: 500, color: "#111827", py: 0.5, px: 1, fontSize: "0.75rem" }}>
                                            {item.supplierName}
                                          </TableCell>
                                          <TableCell align="right" sx={{ color: "#374151", py: 0.5, px: 1, fontSize: "0.75rem" }}>
                                            {formatCurrency(item.totalCost || 0)}
                                          </TableCell>
                                          <TableCell align="right" sx={{ color: "#374151", py: 0.5, px: 1, fontSize: "0.75rem" }}>
                                            {formatCurrency(item.totalProfit || 0)}
                                          </TableCell>
                                          <TableCell align="right" sx={{ fontWeight: 600, color: "#111827", py: 0.5, px: 1, fontSize: "0.75rem" }}>
                                            {formatCurrency(total)}
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </>
                                )}

                                {/* Item Type 2 (Outlet) */}
                                {itemType2.length > 0 && (
                                  <>
                                    <TableRow>
                                      <TableCell
                                        colSpan={5}
                                        sx={{
                                          bgcolor: "#F3F4F6",
                                          fontWeight: 600,
                                          color: "#1F2937",
                                          py: 0.5,
                                          px: 1,
                                          borderBottom: "2px solid #E5E7EB",
                                          fontSize: "0.75rem"
                                        }}
                                      >
                                        Outlets
                                      </TableCell>
                                    </TableRow>
                                    {itemType2.map((item) => {
                                      rowIndex++;
                                      const total = (item.totalCost || 0) + (item.totalProfit || 0);
                                      return (
                                        <TableRow
                                          key={`outlet-${item.supplierId}-${item.paymentType}`}
                                          onClick={() => handleRowClick(item)}
                                          onDoubleClick={() => handleRowDoubleClick(item)}
                                          hover
                                          sx={{
                                            cursor: "pointer",
                                            transition: "all 0.2s",
                                            "&:hover": {
                                              bgcolor: "#F3F4F6"
                                            }
                                          }}
                                        >
                                          <TableCell sx={{ py: 0.5, px: 1, color: "#6B7280", fontSize: "0.75rem" }}>{rowIndex}</TableCell>
                                          <TableCell sx={{ fontWeight: 500, color: "#111827", py: 0.5, px: 1, fontSize: "0.75rem" }}>
                                            {item.supplierName}
                                          </TableCell>
                                          <TableCell align="right" sx={{ color: "#374151", py: 0.5, px: 1, fontSize: "0.75rem" }}>
                                            {formatCurrency(item.totalCost || 0)}
                                          </TableCell>
                                          <TableCell align="right" sx={{ color: "#374151", py: 0.5, px: 1, fontSize: "0.75rem" }}>
                                            {formatCurrency(item.totalProfit || 0)}
                                          </TableCell>
                                          <TableCell align="right" sx={{ fontWeight: 600, color: "#111827", py: 0.5, px: 1, fontSize: "0.75rem" }}>
                                            {formatCurrency(total)}
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </>
                                )}

                                {/* Item Type 3 (DBR) */}
                                {itemType3.length > 0 && (
                                  <>
                                    <TableRow>
                                      <TableCell
                                        colSpan={5}
                                        sx={{
                                          bgcolor: "#F3F4F6",
                                          fontWeight: 600,
                                          color: "#1F2937",
                                          py: 0.5,
                                          px: 1,
                                          borderBottom: "2px solid #E5E7EB",
                                          fontSize: "0.75rem"
                                        }}
                                      >
                                        DBR
                                      </TableCell>
                                    </TableRow>
                                    {itemType3.map((item) => {
                                      rowIndex++;
                                      const total = (item.totalCost || 0) + (item.totalProfit || 0);
                                      // Ensure itemType is set to 3 for DBR items
                                      const dbrItem = { ...item, itemType: 3 };
                                      return (
                                        <TableRow
                                          key={`dbr-${item.supplierId}-${item.paymentType}`}
                                          onClick={() => handleRowClick(dbrItem)}
                                          onDoubleClick={() => handleRowDoubleClick(dbrItem)}
                                          hover
                                          sx={{
                                            cursor: "pointer",
                                            transition: "all 0.2s",
                                            "&:hover": {
                                              bgcolor: "#F3F4F6"
                                            }
                                          }}
                                        >
                                          <TableCell sx={{ py: 0.5, px: 1, color: "#6B7280", fontSize: "0.75rem" }}>{rowIndex}</TableCell>
                                          <TableCell sx={{ fontWeight: 500, color: "#111827", py: 0.5, px: 1, fontSize: "0.75rem" }}>
                                            {item.supplierName}
                                          </TableCell>
                                          <TableCell align="right" sx={{ color: "#374151", py: 0.5, px: 1, fontSize: "0.75rem" }}>
                                            {formatCurrency(item.totalCost || 0)}
                                          </TableCell>
                                          <TableCell align="right" sx={{ color: "#374151", py: 0.5, px: 1, fontSize: "0.75rem" }}>
                                            {formatCurrency(item.totalProfit || 0)}
                                          </TableCell>
                                          <TableCell align="right" sx={{ fontWeight: 600, color: "#111827", py: 0.5, px: 1, fontSize: "0.75rem" }}>
                                            {formatCurrency(total)}
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </>
                                )}

                                {/* Receipt Item Type 1 */}
                                {receiptItemType1.length > 0 && (
                                  <>
                                    <TableRow>
                                      <TableCell
                                        colSpan={5}
                                        sx={{
                                          bgcolor: "#FEF3C7",
                                          fontWeight: 600,
                                          color: "#1F2937",
                                          py: 0.5,
                                          px: 1,
                                          borderBottom: "2px solid #E5E7EB",
                                          fontSize: "0.75rem"
                                        }}
                                      >
                                        Receipt Items
                                      </TableCell>
                                    </TableRow>
                                    {receiptItemType1.map((item) => {
                                      rowIndex++;
                                      const total = (item.totalCost || 0) + (item.totalProfit || 0);
                                      return (
                                        <TableRow
                                          key={`receipt-item-${item.supplierId}-${item.receiptNumber}`}
                                          onClick={() => handleRowClick(item)}
                                          onDoubleClick={() => handleRowDoubleClick(item)}
                                          hover
                                          sx={{
                                            cursor: "pointer",
                                            transition: "all 0.2s",
                                            "&:hover": {
                                              bgcolor: "#FEF3C7"
                                            }
                                          }}
                                        >
                                          <TableCell sx={{ py: 0.5, px: 1, color: "#6B7280", fontSize: "0.75rem" }}>{rowIndex}</TableCell>
                                          <TableCell sx={{ fontWeight: 500, color: "#111827", py: 0.5, px: 1, fontSize: "0.75rem" }}>
                                            {item.supplierName} (Receipt: {item.receiptNumber})
                                          </TableCell>
                                          <TableCell align="right" sx={{ color: "#374151", py: 0.5, px: 1, fontSize: "0.75rem" }}>
                                            {formatCurrency(item.totalCost || 0)}
                                          </TableCell>
                                          <TableCell align="right" sx={{ color: "#374151", py: 0.5, px: 1, fontSize: "0.75rem" }}>
                                            {formatCurrency(item.totalProfit || 0)}
                                          </TableCell>
                                          <TableCell align="right" sx={{ fontWeight: 600, color: "#111827", py: 0.5, px: 1, fontSize: "0.75rem" }}>
                                            {formatCurrency(total)}
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </>
                                )}

                                {/* Receipt Item Type 2 */}
                                {receiptItemType2.length > 0 && (
                                  <>
                                    <TableRow>
                                      <TableCell
                                        colSpan={5}
                                        sx={{
                                          bgcolor: "#FEF3C7",
                                          fontWeight: 600,
                                          color: "#1F2937",
                                          py: 0.5,
                                          px: 1,
                                          borderBottom: "2px solid #E5E7EB",
                                          fontSize: "0.75rem"
                                        }}
                                      >
                                        Receipt Outlets
                                      </TableCell>
                                    </TableRow>
                                    {receiptItemType2.map((item) => {
                                      rowIndex++;
                                      const total = (item.totalCost || 0) + (item.totalProfit || 0);
                                      return (
                                        <TableRow
                                          key={`receipt-outlet-${item.supplierId}-${item.receiptNumber}`}
                                          onClick={() => handleRowClick(item)}
                                          onDoubleClick={() => handleRowDoubleClick(item)}
                                          hover
                                          sx={{
                                            cursor: "pointer",
                                            transition: "all 0.2s",
                                            "&:hover": {
                                              bgcolor: "#FEF3C7"
                                            }
                                          }}
                                        >
                                          <TableCell sx={{ py: 0.5, px: 1, color: "#6B7280", fontSize: "0.75rem" }}>{rowIndex}</TableCell>
                                          <TableCell sx={{ fontWeight: 500, color: "#111827", py: 0.5, px: 1, fontSize: "0.75rem" }}>
                                            {item.supplierName} (Receipt: {item.receiptNumber})
                                          </TableCell>
                                          <TableCell align="right" sx={{ color: "#374151", py: 0.5, px: 1, fontSize: "0.75rem" }}>
                                            {formatCurrency(item.totalCost || 0)}
                                          </TableCell>
                                          <TableCell align="right" sx={{ color: "#374151", py: 0.5, px: 1, fontSize: "0.75rem" }}>
                                            {formatCurrency(item.totalProfit || 0)}
                                          </TableCell>
                                          <TableCell align="right" sx={{ fontWeight: 600, color: "#111827", py: 0.5, px: 1, fontSize: "0.75rem" }}>
                                            {formatCurrency(total)}
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </>
                                )}

                                {/* Receipt Item Type 3 */}
                                {receiptItemType3.length > 0 && (
                                  <>
                                    <TableRow>
                                      <TableCell
                                        colSpan={5}
                                        sx={{
                                          bgcolor: "#FEF3C7",
                                          fontWeight: 600,
                                          color: "#1F2937",
                                          py: 0.5,
                                          px: 1,
                                          borderBottom: "2px solid #E5E7EB",
                                          fontSize: "0.75rem"
                                        }}
                                      >
                                        Receipt DBR
                                      </TableCell>
                                    </TableRow>
                                    {receiptItemType3.map((item) => {
                                      rowIndex++;
                                      const total = (item.totalCost || 0) + (item.totalProfit || 0);
                                      // Ensure itemType is set to 3 for DBR items
                                      const dbrItem = { ...item, itemType: 3 };
                                      return (
                                        <TableRow
                                          key={`receipt-dbr-${item.supplierId}-${item.receiptNumber}`}
                                          onClick={() => handleRowClick(dbrItem)}
                                          onDoubleClick={() => handleRowDoubleClick(dbrItem)}
                                          hover
                                          sx={{
                                            cursor: "pointer",
                                            transition: "all 0.2s",
                                            "&:hover": {
                                              bgcolor: "#FEF3C7"
                                            }
                                          }}
                                        >
                                          <TableCell sx={{ py: 1, color: "#6B7280", fontSize: "0.8125rem" }}>{rowIndex}</TableCell>
                                          <TableCell sx={{ fontWeight: 500, color: "#111827", py: 1, fontSize: "0.8125rem" }}>
                                            {item.supplierName} (Receipt: {item.receiptNumber})
                                          </TableCell>
                                          <TableCell sx={{ py: 1, fontSize: "0.8125rem", color: "#9CA3AF" }}>
                                            -
                                          </TableCell>
                                          <TableCell align="right" sx={{ color: "#374151", py: 1, fontSize: "0.8125rem" }}>
                                            {formatCurrency(item.totalCost || 0)}
                                          </TableCell>
                                          <TableCell align="right" sx={{ color: "#374151", py: 1, fontSize: "0.8125rem" }}>
                                            {formatCurrency(item.totalProfit || 0)}
                                          </TableCell>
                                          <TableCell align="right" sx={{ fontWeight: 600, color: "#111827", py: 1, fontSize: "0.8125rem" }}>
                                            {formatCurrency(total)}
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </>
                                )}

                                {/* Profit Account Items */}
                                {profitAccountItems.length > 0 && (
                                  <>
                                    <TableRow>
                                      <TableCell
                                        colSpan={5}
                                        sx={{
                                          bgcolor: "#DBEAFE",
                                          fontWeight: 600,
                                          color: "#1F2937",
                                          py: 0.5,
                                          px: 1,
                                          borderBottom: "2px solid #E5E7EB",
                                          fontSize: "0.75rem"
                                        }}
                                      >
                                        Profit Accounts
                                      </TableCell>
                                    </TableRow>
                                    {profitAccountItems.map((item) => {
                                      rowIndex++;
                                      // Calculate adjusted profit: base profit - cash out + cash in
                                      const adjustedProfit = (item.totalProfit || 0) - (summaryTotals?.totalCashOut || 0) + (summaryTotals?.totalCashIn || 0);
                                      const adjustedTotal = (item.totalCost || 0) + adjustedProfit;
                                      return (
                                        <TableRow
                                          key={`profit-account-${item.supplierId}`}
                                          onClick={() => handleRowClick(item)}
                                          onDoubleClick={() => setProfitBreakdownModalOpen(true)}
                                          hover
                                          sx={{
                                            cursor: "pointer",
                                            transition: "all 0.2s",
                                            "&:hover": {
                                              bgcolor: "#DBEAFE"
                                            }
                                          }}
                                        >
                                          <TableCell sx={{ py: 0.5, px: 1, color: "#6B7280", fontSize: "0.75rem" }}>{rowIndex}</TableCell>
                                          <TableCell sx={{ fontWeight: 500, color: "#111827", py: 0.5, px: 1, fontSize: "0.75rem" }}>
                                            {item.supplierName}
                                          </TableCell>
                                          <TableCell align="right" sx={{ color: "#374151", py: 0.5, px: 1, fontSize: "0.75rem" }}>
                                            {formatCurrency(item.totalCost || 0)}
                                          </TableCell>
                                          <TableCell align="right" sx={{ color: "#374151", py: 0.5, px: 1, fontSize: "0.75rem" }}>
                                            {formatCurrency(adjustedProfit)}
                                          </TableCell>
                                          <TableCell align="right" sx={{ fontWeight: 600, color: "#111827", py: 0.5, px: 1, fontSize: "0.75rem" }}>
                                            {formatCurrency(adjustedTotal)}
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </>
                                )}
                              </>
                            );
                          })()}
                        </>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Submit Button */}
                <Box sx={{ mt: 2, p: 2, bgcolor: "#FAFBFC", borderRadius: 2, border: "1px solid #E5E7EB" }}>
                  <Button
                    onClick={handleSubmitAllSuppliers}
                    disabled={isSubmitting || !depositSummary?.supplierDetails || depositSummary.supplierDetails.length === 0}
                    fullWidth
                    variant="contained"
                    startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
                    sx={{
                      py: 1.5,
                      fontWeight: 600,
                      textTransform: "none",
                      borderRadius: 2,
                      fontSize: "1rem",
                      background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                      boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                      transition: "all 0.3s",
                      "&:hover": {
                        background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                        boxShadow: "0 6px 16px rgba(16, 185, 129, 0.4)",
                        transform: "translateY(-1px)",
                      },
                      "&:disabled": {
                        background: "#E5E7EB",
                        color: "#9CA3AF",
                      },
                    }}
                  >
                    {isSubmitting ? "Submitting..." : "Submit All Deposits"}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Side - Dashboard Components */}
          <Grid item xs={12} md={5} sx={{ display: "flex" }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, width: "100%" }}>
              {/* Header */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#1F2937", fontSize: "1.125rem" }}>
                  Financial Overview
                </Typography>
                <Box
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    bgcolor: "#F0FDF4",
                    borderRadius: 1.5,
                    border: "1px solid #D1FAE5"
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#059669", fontWeight: 600, fontSize: "0.7rem" }}>
                    {formatDate(selectedDate)}
                  </Typography>
                </Box>
              </Box>

              {/* Summary Cards */}
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Card
                    elevation={0}
                    sx={{
                      height: "100%",
                      bgcolor: "white",
                      border: "1px solid #E5E7EB",
                      borderRadius: 2.5,
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      position: "relative",
                      overflow: "hidden",
                      "&:hover": {
                        boxShadow: "0 8px 24px rgba(59, 130, 246, 0.15)",
                        transform: "translateY(-2px)",
                        borderColor: "#3B82F6",
                      },
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 4,
                        background: "linear-gradient(90deg, #3B82F6 0%, #2563EB 100%)",
                      },
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#6B7280",
                              fontSize: "0.8125rem",
                              fontWeight: 500,
                              mb: 1,
                              textTransform: "uppercase",
                              letterSpacing: "0.5px"
                            }}
                          >
                            Total Suppliers
                          </Typography>
                          <Typography
                            variant="h4"
                            sx={{
                              fontWeight: 700,
                              color: "#111827",
                              fontSize: "1.875rem",
                              lineHeight: 1.2
                            }}
                          >
                            {supplierSummaryTotals.totalSuppliers}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            bgcolor: "#EFF6FF",
                            borderRadius: 2,
                            p: 1.5,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#3B82F6",
                            width: 56,
                            height: 56,
                            flexShrink: 0,
                          }}
                        >
                          <StoreIcon sx={{ fontSize: 28 }} />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={6}>
                  <Card
                    elevation={0}
                    sx={{
                      height: "100%",
                      bgcolor: "white",
                      border: "1px solid #E5E7EB",
                      borderRadius: 2.5,
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      position: "relative",
                      overflow: "hidden",
                      "&:hover": {
                        boxShadow: "0 8px 24px rgba(16, 185, 129, 0.15)",
                        transform: "translateY(-2px)",
                        borderColor: "#10B981",
                      },
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 4,
                        background: "linear-gradient(90deg, #10B981 0%, #059669 100%)",
                      },
                    }}
                  >
                    <CardContent sx={{ p: 2, position: "relative", overflow: "hidden" }}>
                      <Box
                        sx={{
                          position: "absolute",
                          top: -15,
                          right: -15,
                          width: 80,
                          height: 80,
                          borderRadius: "50%",
                          bgcolor: "rgba(16, 185, 129, 0.08)",
                          zIndex: 0
                        }}
                      />
                      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#6B7280",
                              fontSize: "0.7rem",
                              fontWeight: 600,
                              mb: 1,
                              textTransform: "uppercase",
                              letterSpacing: "0.8px"
                            }}
                          >
                            Total Cost
                          </Typography>
                          <Typography
                            variant="h4"
                            sx={{
                              fontWeight: 800,
                              color: "#111827",
                              fontSize: "1.5rem",
                              lineHeight: 1.1,
                              mb: 0.25,
                              background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                              backgroundClip: "text",
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent"
                            }}
                          >
                            {formatCurrency(supplierSummaryTotals.totalCost)}
                          </Typography>
                          {totalAmount > 0 && (
                            <Box sx={{ mt: 0.75 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                <Box
                                  sx={{
                                    flex: 1,
                                    height: 3,
                                    bgcolor: "#E5E7EB",
                                    borderRadius: 2,
                                    overflow: "hidden"
                                  }}
                                >
                                  <Box
                                    sx={{
                                      height: "100%",
                                      width: `${Math.min(100, (supplierSummaryTotals.totalCost / totalAmount) * 100)}%`,
                                      bgcolor: "#10B981",
                                      borderRadius: 2,
                                      transition: "width 0.5s ease"
                                    }}
                                  />
                                </Box>
                                <Typography variant="caption" sx={{ color: "#6B7280", fontSize: "0.65rem", minWidth: "35px", textAlign: "right" }}>
                                  {totalAmount > 0 ? `${Math.round((supplierSummaryTotals.totalCost / totalAmount) * 100)}%` : "0%"}
                                </Typography>
                              </Box>
                            </Box>
                          )}
                        </Box>
                        <Box
                          sx={{
                            bgcolor: "rgba(16, 185, 129, 0.1)",
                            borderRadius: 2,
                            p: 1.25,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#10B981",
                            width: 48,
                            height: 48,
                            flexShrink: 0,
                            border: "2px solid rgba(16, 185, 129, 0.2)",
                            boxShadow: "0 2px 8px rgba(16, 185, 129, 0.15)"
                          }}
                        >
                          <AttachMoneyIcon sx={{ fontSize: 24 }} />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={6}>
                  <Card
                    elevation={0}
                    sx={{
                      height: "100%",
                      bgcolor: "white",
                      border: "1px solid #E5E7EB",
                      borderRadius: 2.5,
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      position: "relative",
                      overflow: "hidden",
                      "&:hover": {
                        boxShadow: "0 8px 24px rgba(34, 197, 94, 0.15)",
                        transform: "translateY(-2px)",
                        borderColor: "#22C55E",
                      },
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 4,
                        background: "linear-gradient(90deg, #22C55E 0%, #16A34A 100%)",
                      },
                    }}
                  >
                    <CardContent sx={{ p: 2, position: "relative", overflow: "hidden" }}>
                      <Box
                        sx={{
                          position: "absolute",
                          top: -15,
                          right: -15,
                          width: 80,
                          height: 80,
                          borderRadius: "50%",
                          bgcolor: "rgba(34, 197, 94, 0.08)",
                          zIndex: 0
                        }}
                      />
                      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#6B7280",
                              fontSize: "0.7rem",
                              fontWeight: 600,
                              mb: 1,
                              textTransform: "uppercase",
                              letterSpacing: "0.8px"
                            }}
                          >
                            Total Profit
                          </Typography>
                          <MuiTooltip
                            title={
                              <Box sx={{ p: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: "#fff" }}>
                                  Profit Breakdown:
                                </Typography>
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                                  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                                    <Typography variant="caption" sx={{ color: "#D1D5DB" }}>Base Profit:</Typography>
                                    <Typography variant="caption" sx={{ color: "#fff", fontWeight: 600 }}>
                                      {formatCurrency(baseProfitAmount)}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                                    <Typography variant="caption" sx={{ color: "#D1D5DB" }}>Cash In (+):</Typography>
                                    <Typography variant="caption" sx={{ color: "#10B981", fontWeight: 600 }}>
                                      {formatCurrency(totalCashIn)}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                                    <Typography variant="caption" sx={{ color: "#D1D5DB" }}>Cash Out (-):</Typography>
                                    <Typography variant="caption" sx={{ color: "#EF4444", fontWeight: 600 }}>
                                      {formatCurrency(totalCashOut)}
                                    </Typography>
                                  </Box>
                                  <Divider sx={{ my: 0.5, bgcolor: "#6B7280" }} />
                                  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                                    <Typography variant="caption" sx={{ color: "#fff", fontWeight: 700 }}>Final Profit:</Typography>
                                    <Typography variant="caption" sx={{ color: "#fff", fontWeight: 700 }}>
                                      {formatCurrency(profitAccountAmount)}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Box>
                            }
                            arrow
                            placement="top"
                          >
                            <Typography
                              variant="h4"
                              sx={{
                                fontWeight: 800,
                                color: "#111827",
                                fontSize: "1.5rem",
                                lineHeight: 1.1,
                                mb: 0.25,
                                background: "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",
                                backgroundClip: "text",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                cursor: "help"
                              }}
                            >
                              {formatCurrency(profitAccountAmount)}
                            </Typography>
                          </MuiTooltip>
                          {supplierSummaryTotals.totalCost > 0 && (
                            <Box sx={{ mt: 0.75 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                <Box
                                  sx={{
                                    flex: 1,
                                    height: 3,
                                    bgcolor: "#E5E7EB",
                                    borderRadius: 2,
                                    overflow: "hidden"
                                  }}
                                >
                                  <Box
                                    sx={{
                                      height: "100%",
                                      width: `${Math.min(100, (profitAccountAmount / (supplierSummaryTotals.totalCost + profitAccountAmount)) * 100)}%`,
                                      bgcolor: "#22C55E",
                                      borderRadius: 2,
                                      transition: "width 0.5s ease"
                                    }}
                                  />
                                </Box>
                                <Typography variant="caption" sx={{ color: "#6B7280", fontSize: "0.65rem", minWidth: "35px", textAlign: "right" }}>
                                  {supplierSummaryTotals.totalCost > 0 ? `${Math.round((profitAccountAmount / (supplierSummaryTotals.totalCost + profitAccountAmount)) * 100)}%` : "0%"}
                                </Typography>
                              </Box>
                            </Box>
                          )}
                        </Box>
                        <Box
                          sx={{
                            bgcolor: "rgba(34, 197, 94, 0.1)",
                            borderRadius: 2,
                            p: 1.25,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#22C55E",
                            width: 48,
                            height: 48,
                            flexShrink: 0,
                            border: "2px solid rgba(34, 197, 94, 0.2)",
                            boxShadow: "0 2px 8px rgba(34, 197, 94, 0.15)"
                          }}
                        >
                          <AccountBalanceWalletIcon sx={{ fontSize: 24 }} />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={6}>
                  <Card
                    elevation={0}
                    sx={{
                      height: "100%",
                      bgcolor: "white",
                      border: "1px solid #E5E7EB",
                      borderRadius: 2.5,
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      position: "relative",
                      overflow: "hidden",
                      "&:hover": {
                        boxShadow: "0 8px 24px rgba(245, 158, 11, 0.15)",
                        transform: "translateY(-2px)",
                        borderColor: "#F59E0B",
                      },
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 4,
                        background: "linear-gradient(90deg, #F59E0B 0%, #D97706 100%)",
                      },
                    }}
                  >
                    <CardContent sx={{ p: 2, position: "relative", overflow: "hidden" }}>
                      <Box
                        sx={{
                          position: "absolute",
                          top: -15,
                          right: -15,
                          width: 80,
                          height: 80,
                          borderRadius: "50%",
                          bgcolor: "rgba(245, 158, 11, 0.08)",
                          zIndex: 0
                        }}
                      />
                      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#6B7280",
                              fontSize: "0.7rem",
                              fontWeight: 600,
                              mb: 1,
                              textTransform: "uppercase",
                              letterSpacing: "0.8px"
                            }}
                          >
                            Total Amount
                          </Typography>
                          <Typography
                            variant="h4"
                            sx={{
                              fontWeight: 800,
                              color: "#111827",
                              fontSize: "1.5rem",
                              lineHeight: 1.1,
                              mb: 0.5,
                              background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
                              backgroundClip: "text",
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent"
                            }}
                          >
                            {formatCurrency(totalAmount)}
                          </Typography>
                          <Box sx={{ display: "flex", gap: 0.75, mt: 0.75, flexWrap: "wrap" }}>
                            <Box
                              sx={{
                                px: 1,
                                py: 0.4,
                                bgcolor: "#FEF3C7",
                                borderRadius: 1,
                                border: "1px solid #FDE68A"
                              }}
                            >
                              <Typography variant="caption" sx={{ color: "#D97706", fontWeight: 600, fontSize: "0.65rem" }}>
                                Cost: {formatCurrency(supplierSummaryTotals.totalCost)}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                px: 1,
                                py: 0.4,
                                bgcolor: "#D1FAE5",
                                borderRadius: 1,
                                border: "1px solid #A7F3D0"
                              }}
                            >
                              <Typography variant="caption" sx={{ color: "#059669", fontWeight: 600, fontSize: "0.65rem" }}>
                                Profit: {formatCurrency(profitAccountAmount)}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                        <Box
                          sx={{
                            bgcolor: "rgba(245, 158, 11, 0.1)",
                            borderRadius: 2,
                            p: 1.25,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#F59E0B",
                            width: 48,
                            height: 48,
                            flexShrink: 0,
                            border: "2px solid rgba(245, 158, 11, 0.2)",
                            boxShadow: "0 2px 8px rgba(245, 158, 11, 0.15)"
                          }}
                        >
                          <AccountBalanceWalletIcon sx={{ fontSize: 24 }} />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Total Cash In Card */}
                {selectedDate && (
                  <Grid item xs={6}>
                    <Card
                      elevation={0}
                      sx={{
                        height: "100%",
                        bgcolor: "white",
                        border: "1px solid #E5E7EB",
                        borderRadius: 2.5,
                        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        position: "relative",
                        overflow: "hidden",
                        "&:hover": {
                          boxShadow: "0 8px 24px rgba(5, 150, 105, 0.15)",
                          transform: "translateY(-2px)",
                          borderColor: "#059669",
                        },
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          height: 4,
                          background: "linear-gradient(90deg, #059669 0%, #047857 100%)",
                        },
                      }}
                    >
                      <CardContent sx={{ p: 2, position: "relative", overflow: "hidden" }}>
                        <Box
                          sx={{
                            position: "absolute",
                            top: -15,
                            right: -15,
                            width: 80,
                            height: 80,
                            borderRadius: "50%",
                            bgcolor: "rgba(5, 150, 105, 0.08)",
                            zIndex: 0
                          }}
                        />
                        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                color: "#6B7280",
                                fontSize: "0.7rem",
                                fontWeight: 600,
                                mb: 1,
                                textTransform: "uppercase",
                                letterSpacing: "0.8px"
                              }}
                            >
                              Total Cash In
                            </Typography>
                            <Typography
                              variant="h4"
                              sx={{
                                fontWeight: 800,
                                color: "#111827",
                                fontSize: "1.5rem",
                                lineHeight: 1.1,
                                mb: 0.25,
                                background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                                backgroundClip: "text",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent"
                              }}
                            >
                              {formatCurrency(summaryTotals?.totalCashIn || 0)}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "#9CA3AF", fontSize: "0.65rem" }}>
                              Incoming funds
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              bgcolor: "rgba(5, 150, 105, 0.1)",
                              borderRadius: 2,
                              p: 1.25,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#059669",
                              width: 48,
                              height: 48,
                              flexShrink: 0,
                              border: "2px solid rgba(5, 150, 105, 0.2)",
                              boxShadow: "0 2px 8px rgba(5, 150, 105, 0.15)"
                            }}
                          >
                            <TrendingUpIcon sx={{ fontSize: 24 }} />
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {/* Total Cash Out Card */}
                {selectedDate && (
                  <Grid item xs={6}>
                    <Card
                      elevation={0}
                      sx={{
                        height: "100%",
                        bgcolor: "white",
                        border: "1px solid #E5E7EB",
                        borderRadius: 2.5,
                        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        position: "relative",
                        overflow: "hidden",
                        "&:hover": {
                          boxShadow: "0 8px 24px rgba(220, 38, 38, 0.15)",
                          transform: "translateY(-2px)",
                          borderColor: "#DC2626",
                        },
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          height: 4,
                          background: "linear-gradient(90deg, #DC2626 0%, #B91C1C 100%)",
                        },
                      }}
                    >
                      <CardContent sx={{ p: 2, position: "relative", overflow: "hidden" }}>
                        <Box
                          sx={{
                            position: "absolute",
                            top: -15,
                            right: -15,
                            width: 80,
                            height: 80,
                            borderRadius: "50%",
                            bgcolor: "rgba(220, 38, 38, 0.08)",
                            zIndex: 0
                          }}
                        />
                        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                color: "#6B7280",
                                fontSize: "0.7rem",
                                fontWeight: 600,
                                mb: 1,
                                textTransform: "uppercase",
                                letterSpacing: "0.8px"
                              }}
                            >
                              Total Cash Out
                            </Typography>
                            <Typography
                              variant="h4"
                              sx={{
                                fontWeight: 800,
                                color: "#111827",
                                fontSize: "1.5rem",
                                lineHeight: 1.1,
                                mb: 0.25,
                                background: "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)",
                                backgroundClip: "text",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent"
                              }}
                            >
                              {formatCurrency(summaryTotals?.totalCashOut || 0)}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "#9CA3AF", fontSize: "0.65rem" }}>
                              Outgoing funds
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              bgcolor: "rgba(220, 38, 38, 0.1)",
                              borderRadius: 2,
                              p: 1.25,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#DC2626",
                              width: 48,
                              height: 48,
                              flexShrink: 0,
                              border: "2px solid rgba(220, 38, 38, 0.2)",
                              boxShadow: "0 2px 8px rgba(220, 38, 38, 0.15)"
                            }}
                          >
                            <TrendingDownIcon sx={{ fontSize: 24 }} />
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {/* Total Sales Return Card */}
                {selectedDate && (
                  <Grid item xs={6}>
                    <Card
                      elevation={0}
                      sx={{
                        height: "100%",
                        bgcolor: "white",
                        border: "1px solid #E5E7EB",
                        borderRadius: 2.5,
                        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        position: "relative",
                        overflow: "hidden",
                        "&:hover": {
                          boxShadow: "0 8px 24px rgba(217, 119, 6, 0.15)",
                          transform: "translateY(-2px)",
                          borderColor: "#D97706",
                        },
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          height: 4,
                          background: "linear-gradient(90deg, #D97706 0%, #B45309 100%)",
                        },
                      }}
                    >
                      <CardContent sx={{ p: 2, position: "relative", overflow: "hidden" }}>
                        <Box
                          sx={{
                            position: "absolute",
                            top: -15,
                            right: -15,
                            width: 80,
                            height: 80,
                            borderRadius: "50%",
                            bgcolor: "rgba(217, 119, 6, 0.08)",
                            zIndex: 0
                          }}
                        />
                        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                color: "#6B7280",
                                fontSize: "0.7rem",
                                fontWeight: 600,
                                mb: 1,
                                textTransform: "uppercase",
                                letterSpacing: "0.8px"
                              }}
                            >
                              Total Sales Return
                            </Typography>
                            <Typography
                              variant="h4"
                              sx={{
                                fontWeight: 800,
                                color: "#111827",
                                fontSize: "1.5rem",
                                lineHeight: 1.1,
                                mb: 0.25,
                                background: "linear-gradient(135deg, #D97706 0%, #B45309 100%)",
                                backgroundClip: "text",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent"
                              }}
                            >
                              {formatCurrency(summaryTotals?.totalSalesReturn || 0)}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "#9CA3AF", fontSize: "0.65rem" }}>
                              Returned items
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              bgcolor: "rgba(217, 119, 6, 0.1)",
                              borderRadius: 2,
                              p: 1.25,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#D97706",
                              width: 48,
                              height: 48,
                              flexShrink: 0,
                              border: "2px solid rgba(217, 119, 6, 0.2)",
                              boxShadow: "0 2px 8px rgba(217, 119, 6, 0.15)"
                            }}
                          >
                            <SwapHorizIcon sx={{ fontSize: 24 }} />
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {/* Total Cancelled Invoice Card */}
                {selectedDate && (
                  <Grid item xs={6}>
                    <Card
                      elevation={0}
                      sx={{
                        height: "100%",
                        bgcolor: "white",
                        border: "1px solid #E5E7EB",
                        borderRadius: 2.5,
                        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        position: "relative",
                        overflow: "hidden",
                        "&:hover": {
                          boxShadow: "0 8px 24px rgba(139, 92, 246, 0.15)",
                          transform: "translateY(-2px)",
                          borderColor: "#8B5CF6",
                        },
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          height: 4,
                          background: "linear-gradient(90deg, #8B5CF6 0%, #6D28D9 100%)",
                        },
                      }}
                    >
                      <CardContent sx={{ p: 2, position: "relative", overflow: "hidden" }}>
                        <Box
                          sx={{
                            position: "absolute",
                            top: -15,
                            right: -15,
                            width: 80,
                            height: 80,
                            borderRadius: "50%",
                            bgcolor: "rgba(139, 92, 246, 0.08)",
                            zIndex: 0
                          }}
                        />
                        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                color: "#6B7280",
                                fontSize: "0.7rem",
                                fontWeight: 600,
                                mb: 1,
                                textTransform: "uppercase",
                                letterSpacing: "0.8px"
                              }}
                            >
                              Total Cancelled Invoice
                            </Typography>
                            <Typography
                              variant="h4"
                              sx={{
                                fontWeight: 800,
                                color: "#111827",
                                fontSize: "1.5rem",
                                lineHeight: 1.1,
                                mb: 0.25,
                                background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
                                backgroundClip: "text",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent"
                              }}
                            >
                              {formatCurrency(depositSummary?.totalCancelledInvoice || 0)}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "#9CA3AF", fontSize: "0.65rem" }}>
                              Cancelled transactions
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              bgcolor: "rgba(139, 92, 246, 0.1)",
                              borderRadius: 2,
                              p: 1.25,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#8B5CF6",
                              width: 48,
                              height: 48,
                              flexShrink: 0,
                              border: "2px solid rgba(139, 92, 246, 0.2)",
                              boxShadow: "0 2px 8px rgba(139, 92, 246, 0.15)"
                            }}
                          >
                            <DescriptionIcon sx={{ fontSize: 24 }} />
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {/* Receipt Pie Chart */}
                {selectedDate && depositSummary && receiptChartData.length > 0 && (
                  <Grid item xs={12} sm={12} md={6}>
                    <Card
                      elevation={0}
                      sx={{
                        height: "100%",
                        bgcolor: "white",
                        border: "1px solid #E5E7EB",
                        borderRadius: 2.5,
                        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        position: "relative",
                        overflow: "hidden",
                        "&:hover": {
                          boxShadow: "0 8px 24px rgba(34, 197, 94, 0.15)",
                          transform: "translateY(-2px)",
                          borderColor: "#22C55E",
                        },
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          height: 4,
                          background: "linear-gradient(90deg, #22C55E 0%, #16A34A 100%)",
                        },
                      }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Box
                              sx={{
                                bgcolor: "#DCFCE7",
                                borderRadius: 1,
                                p: 0.75,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#22C55E",
                              }}
                            >
                              <AccountBalanceWalletIcon sx={{ fontSize: 18 }} />
                            </Box>
                            <Box>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: "#6B7280",
                                  fontSize: "0.65rem",
                                  fontWeight: 600,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.5px",
                                  mb: 0.25
                                }}
                              >
                                Total Receipt
                              </Typography>
                              <Typography
                                variant="subtitle1"
                                sx={{
                                  fontWeight: 700,
                                  color: "#111827",
                                  fontSize: "1.125rem",
                                  lineHeight: 1.2
                                }}
                              >
                                {formatCurrency(depositSummary?.totalReceipt || 0)}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>

                        <Box sx={{ height: { xs: 220, sm: 200, md: 180 }, width: "100%" }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={receiptChartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ percent }) => {
                                  const percentage = (percent * 100).toFixed(0);
                                  return `${percentage}%`;
                                }}
                                outerRadius="60%"
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {receiptChartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value, name) => {
                                  const total = receiptChartData.reduce((sum, item) => sum + item.value, 0);
                                  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                  return [`${formatCurrency(value)} (${percentage}%)`, name];
                                }}
                                contentStyle={{
                                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                                  border: "1px solid #E5E7EB",
                                  borderRadius: 6,
                                  padding: "6px 10px",
                                  fontSize: "0.75rem"
                                }}
                              />
                              <Legend
                                verticalAlign="bottom"
                                height="auto"
                                iconSize={10}
                                wrapperStyle={{ fontSize: "0.7rem" }}
                                formatter={(value, entry) => {
                                  const total = receiptChartData.reduce((sum, item) => sum + item.value, 0);
                                  const percentage = total > 0 ? ((entry.payload.value / total) * 100).toFixed(1) : 0;
                                  return (
                                    <span style={{ fontSize: "0.7rem", color: "#6B7280" }}>
                                      {value}: {formatCurrency(entry.payload.value)} ({percentage}%)
                                    </span>
                                  );
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {/* Invoice Pie Chart */}
                {selectedDate && depositSummary && invoiceChartData.length > 0 && (
                  <Grid item xs={12} sm={12} md={6}>
                    <Card
                      elevation={0}
                      sx={{
                        height: "100%",
                        bgcolor: "white",
                        border: "1px solid #E5E7EB",
                        borderRadius: 2.5,
                        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        position: "relative",
                        overflow: "hidden",
                        "&:hover": {
                          boxShadow: "0 8px 24px rgba(59, 130, 246, 0.15)",
                          transform: "translateY(-2px)",
                          borderColor: "#3B82F6",
                        },
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          height: 4,
                          background: "linear-gradient(90deg, #3B82F6 0%, #2563EB 100%)",
                        },
                      }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Box
                              sx={{
                                bgcolor: "#EFF6FF",
                                borderRadius: 1,
                                p: 0.75,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#3B82F6",
                              }}
                            >
                              <DescriptionIcon sx={{ fontSize: 18 }} />
                            </Box>
                            <Box>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: "#6B7280",
                                  fontSize: "0.65rem",
                                  fontWeight: 600,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.5px",
                                  mb: 0.25
                                }}
                              >
                                Total Invoice
                              </Typography>
                              <Typography
                                variant="subtitle1"
                                sx={{
                                  fontWeight: 700,
                                  color: "#111827",
                                  fontSize: "1.125rem",
                                  lineHeight: 1.2
                                }}
                              >
                                {formatCurrency(depositSummary?.totalInvoice || 0)}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>

                        <Box sx={{ height: { xs: 220, sm: 200, md: 180 }, width: "100%" }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={invoiceChartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ percent }) => {
                                  const percentage = (percent * 100).toFixed(0);
                                  return `${percentage}%`;
                                }}
                                outerRadius="60%"
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {invoiceChartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value, name) => {
                                  const total = invoiceChartData.reduce((sum, item) => sum + item.value, 0);
                                  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                  return [`${formatCurrency(value)} (${percentage}%)`, name];
                                }}
                                contentStyle={{
                                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                                  border: "1px solid #E5E7EB",
                                  borderRadius: 6,
                                  padding: "6px 10px",
                                  fontSize: "0.75rem"
                                }}
                              />
                              <Legend
                                verticalAlign="bottom"
                                height="auto"
                                iconSize={10}
                                wrapperStyle={{ fontSize: "0.7rem" }}
                                formatter={(value, entry) => {
                                  const total = invoiceChartData.reduce((sum, item) => sum + item.value, 0);
                                  const percentage = total > 0 ? ((entry.payload.value / total) * 100).toFixed(1) : 0;
                                  return (
                                    <span style={{ fontSize: "0.7rem", color: "#6B7280" }}>
                                      {value}: {formatCurrency(entry.payload.value)} ({percentage}%)
                                    </span>
                                  );
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </Box>
          </Grid>
        </Grid>
      )}

      {/* Invoice Line Details Modal */}
      <Modal
        open={invoiceLineDetailsModalOpen}
        onClose={() => {
          setInvoiceLineDetailsModalOpen(false);
          // Optionally clear bank selection when modal closes
          // setSalesPersonBankSelection({});
        }}
        aria-labelledby="invoice-line-details-modal"
        aria-describedby="invoice-line-details-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "95%", sm: "90%", md: "80%", lg: "70%" },
            maxWidth: "1200px",
            maxHeight: "90vh",
            bgcolor: "background.paper",
            borderRadius: 2.5,
            boxShadow: 24,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
          }}
        >
          <Box
            sx={{
              p: 3,
              borderBottom: "1px solid #E5E7EB",
              bgcolor: "#FAFBFC",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <Typography
              id="invoice-line-details-modal"
              variant="h6"
              component="h2"
              sx={{
                fontWeight: 600,
                color: "#1F2937",
                fontSize: "1.25rem"
              }}
            >
              Invoice Line Details - {selectedSupplierForDetails?.supplierName || "N/A"}
            </Typography>
            <IconButton
              onClick={() => setInvoiceLineDetailsModalOpen(false)}
              sx={{
                color: "#6B7280",
                "&:hover": {
                  bgcolor: "#F3F4F6"
                }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {loadingInvoiceDetails ? (
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
                <CircularProgress />
              </Box>
            ) : invoiceLineDetails.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography color="textSecondary">No invoice line details found.</Typography>
              </Box>
            ) : (() => {
              // Group invoice line details by sales person
              const groupedBySalesPerson = invoiceLineDetails.reduce((acc, detail) => {
                const salesPersonName = detail.salesPersonName || "N/A";
                if (!acc[salesPersonName]) {
                  acc[salesPersonName] = [];
                }
                acc[salesPersonName].push(detail);
                return acc;
              }, {});

              const salesPersonNames = Object.keys(groupedBySalesPerson).sort((a, b) => {
                if (a === "N/A") return 1;
                if (b === "N/A") return -1;
                return a.localeCompare(b);
              });

              // Ensure selected tab index is valid
              const validTabIndex = Math.min(Math.max(0, selectedSalesPersonTab), salesPersonNames.length - 1);

              const currentSalesPersonName = salesPersonNames[validTabIndex] || salesPersonNames[0];
              const currentDetails = groupedBySalesPerson[currentSalesPersonName] || [];

              return (
                <>
                  <Box sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "#FAFBFC" }}>
                    <Tabs
                      value={validTabIndex}
                      onChange={(e, newValue) => setSelectedSalesPersonTab(newValue)}
                      variant="scrollable"
                      scrollButtons="auto"
                      sx={{
                        "& .MuiTab-root": {
                          textTransform: "none",
                          fontWeight: 500,
                          minHeight: 48,
                          color: "#6B7280",
                          "&.Mui-selected": {
                            color: "#10B981",
                            fontWeight: 600
                          }
                        },
                        "& .MuiTabs-indicator": {
                          backgroundColor: "#10B981"
                        }
                      }}
                    >
                      {salesPersonNames.map((name, index) => (
                        <Tab
                          key={name}
                          label={
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: "inherit" }}>
                                {name}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  bgcolor: name === "N/A" ? "#9CA3AF" : "#10B981",
                                  color: "white",
                                  px: 1,
                                  py: 0.25,
                                  borderRadius: 1,
                                  fontSize: "0.7rem"
                                }}
                              >
                                {groupedBySalesPerson[name].length}
                              </Typography>
                            </Box>
                          }
                        />
                      ))}
                    </Tabs>
                  </Box>
                  {/* Bank Selection for Current Tab */}
                  <Box sx={{ px: 3, py: 2, borderBottom: "1px solid #E5E7EB", bgcolor: "#FAFBFC" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: "#374151",
                          minWidth: "80px"
                        }}
                      >
                        Select Bank:
                      </Typography>
                      <Select
                        value={salesPersonBankSelection[currentSalesPersonName] || ""}
                        onChange={(e) => {
                          const selectedBankId = e.target.value;
                          const bank = banks.find(b => b.id === selectedBankId);
                          
                          // Update the bank selection state
                          setSalesPersonBankSelection(prev => ({
                            ...prev,
                            [currentSalesPersonName]: selectedBankId
                          }));
                          
                          // Store bank selection for this supplier and sales person
                          if (selectedSupplierForDetails && bank && selectedBankId) {
                            const supplierKey = getSupplierKey(selectedSupplierForDetails);
                            setSupplierSalesPersonBanks(prev => ({
                              ...prev,
                              [supplierKey]: {
                                ...(prev[supplierKey] || {}),
                                [currentSalesPersonName]: selectedBankId
                              }
                            }));
                          }
                        }}
                        displayEmpty
                        size="small"
                        sx={{
                          minWidth: 250,
                          fontSize: "0.875rem",
                          "& .MuiSelect-select": {
                            py: 0.75,
                            color: salesPersonBankSelection[currentSalesPersonName] ? "#111827" : "#EF4444",
                            fontWeight: salesPersonBankSelection[currentSalesPersonName] ? 400 : 500
                          }
                        }}
                      >
                        <MenuItem value="">
                          <em style={{ color: "#EF4444" }}>Select Bank</em>
                        </MenuItem>
                        {banks.map((bank) => (
                          <MenuItem key={bank.id} value={bank.id}>
                            {bank.name} {bank.accountNo ? `- ${bank.accountNo}` : ""}
                          </MenuItem>
                        ))}
                      </Select>
                      {salesPersonBankSelection[currentSalesPersonName] && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#10B981",
                            fontWeight: 500,
                            ml: "auto"
                          }}
                        >
                          ✓ Bank Selected
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ flex: 1, overflow: "auto", p: 3 }}>
                    <TableContainer>
                      <Table stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, bgcolor: "#F9FAFB", color: "#374151", fontSize: "0.8125rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>#</TableCell>
                            <TableCell sx={{ fontWeight: 600, bgcolor: "#F9FAFB", color: "#374151", fontSize: "0.8125rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Invoice Number</TableCell>
                            <TableCell sx={{ fontWeight: 600, bgcolor: "#F9FAFB", color: "#374151", fontSize: "0.8125rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>GRN Document Number</TableCell>
                            <TableCell sx={{ fontWeight: 600, bgcolor: "#F9FAFB", color: "#374151", fontSize: "0.8125rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Item Name</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, bgcolor: "#F9FAFB", color: "#374151", fontSize: "0.8125rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Quantity</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, bgcolor: "#F9FAFB", color: "#374151", fontSize: "0.8125rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Line Total</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, bgcolor: "#F9FAFB", color: "#374151", fontSize: "0.8125rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Cost Price</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, bgcolor: "#F9FAFB", color: "#374151", fontSize: "0.8125rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Profit</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {currentDetails.map((detail, index) => (
                            <TableRow
                              key={index}
                              sx={{
                                "&:hover": {
                                  bgcolor: "#F9FAFB"
                                }
                              }}
                            >
                              <TableCell sx={{ color: "#6B7280" }}>{index + 1}</TableCell>
                              <TableCell sx={{ fontWeight: 500, color: "#111827" }}>{detail.invoiceNumber}</TableCell>
                              <TableCell sx={{ color: "#374151" }}>{detail.grnDocumentNumber || "N/A"}</TableCell>
                              <TableCell sx={{ color: "#374151" }}>{detail.itemName}</TableCell>
                              <TableCell align="right" sx={{ color: "#374151" }}>{detail.quantity.toFixed(2)}</TableCell>
                              <TableCell align="right" sx={{ color: "#374151" }}>{formatCurrency(detail.lineTotal)}</TableCell>
                              <TableCell align="right" sx={{ color: "#374151" }}>{formatCurrency(detail.costPrice)}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600, color: detail.profit >= 0 ? "#10B981" : "#EF4444" }}>
                                {formatCurrency(detail.profit)}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow sx={{ bgcolor: "#F9FAFB", fontWeight: 600 }}>
                            <TableCell colSpan={4} sx={{ fontWeight: 600, color: "#1F2937", py: 2 }}>Total</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, color: "#1F2937", py: 2 }}>
                              {currentDetails.reduce((sum, d) => sum + d.quantity, 0).toFixed(2)}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, color: "#1F2937", py: 2 }}>
                              {formatCurrency(currentDetails.reduce((sum, d) => sum + d.lineTotal, 0))}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, color: "#1F2937", py: 2 }}>
                              {formatCurrency(currentDetails.reduce((sum, d) => sum + d.costPrice, 0))}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, color: "#1F2937", py: 2 }}>
                              {formatCurrency(currentDetails.reduce((sum, d) => sum + d.profit, 0))}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                </>
              );
            })()}
          </Box>
        </Box>
      </Modal>

      {/* Profit Breakdown Modal */}
      <Modal
        open={profitBreakdownModalOpen}
        onClose={() => setProfitBreakdownModalOpen(false)}
        aria-labelledby="profit-breakdown-modal"
        aria-describedby="profit-breakdown-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "95%", sm: "80%", md: "600px" },
            maxHeight: "90vh",
            bgcolor: "background.paper",
            borderRadius: 2.5,
            boxShadow: 24,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
          }}
        >
          <Box
            sx={{
              p: 3,
              borderBottom: "1px solid #E5E7EB",
              bgcolor: "#FAFBFC",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <Typography
              id="profit-breakdown-modal"
              variant="h6"
              component="h2"
              sx={{
                fontWeight: 600,
                color: "#1F2937",
                fontSize: "1.25rem"
              }}
            >
              Profit Breakdown
            </Typography>
            <IconButton
              onClick={() => setProfitBreakdownModalOpen(false)}
              sx={{
                color: "#6B7280",
                "&:hover": {
                  bgcolor: "#F3F4F6"
                }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          <Box
            sx={{
              p: 3,
              overflow: "auto",
              flex: 1
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: "#F9FAFB",
                  borderRadius: 2,
                  border: "1px solid #E5E7EB"
                }}
              >
                <Typography variant="body2" sx={{ color: "#6B7280", mb: 2, fontWeight: 600 }}>
                  Profit Calculation Breakdown:
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body2" sx={{ color: "#374151" }}>Base Profit:</Typography>
                    <Typography variant="body2" sx={{ color: "#111827", fontWeight: 600 }}>
                      {formatCurrency(baseProfitAmount)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body2" sx={{ color: "#374151" }}>Cash In (+):</Typography>
                    <Typography variant="body2" sx={{ color: "#10B981", fontWeight: 600 }}>
                      {formatCurrency(totalCashIn)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body2" sx={{ color: "#374151" }}>Cash Out (-):</Typography>
                    <Typography variant="body2" sx={{ color: "#EF4444", fontWeight: 600 }}>
                      {formatCurrency(totalCashOut)}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pt: 1 }}>
                    <Typography variant="body1" sx={{ color: "#111827", fontWeight: 700 }}>
                      Final Profit:
                    </Typography>
                    <Typography variant="h6" sx={{ color: "#22C55E", fontWeight: 700 }}>
                      {formatCurrency(profitAccountAmount)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Box
                sx={{
                  p: 2,
                  bgcolor: "#FEF3C7",
                  borderRadius: 2,
                  border: "1px solid #FDE68A"
                }}
              >
                <Typography variant="caption" sx={{ color: "#92400E", fontStyle: "italic" }}>
                  Formula: Base Profit + Cash In - Cash Out = Final Profit
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Modal>
    </>
  );
}