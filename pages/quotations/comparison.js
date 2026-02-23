import React, { useEffect, useState } from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import Grid from "@mui/material/Grid";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Button,
  Typography,
  Chip,
} from "@mui/material";
import BASE_URL from "Base/api";
import { useRouter } from "next/router";
import { formatCurrency } from "@/components/utils/formatHelper";
import { formatDate } from "@/components/utils/formatHelper";

export default function Comparison() {
  const router = useRouter();
  const inqId = router.query.id;
  const optId = router.query.option;
  const windowType = router.query.windowType;
  const from = router.query.from; // Get the source page (pending-quotation or approved-quotation)
  const [inquiry, setInquiry] = useState(null);
  const [versions, setVersions] = useState([]);
  const [versionLineItems, setVersionLineItems] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Determine the back navigation URL based on the source
  const getBackUrl = () => {
    if (from === "pending-quotation") {
      return "/quotations/pending-quotation";
    } else if (from === "approved-quotation") {
      return "/quotations/approved-quotation";
    }
    // Default to approved-quotation if no source is specified (for backward compatibility)
    return "/quotations/approved-quotation";
  };

  const fetchInquiryById = async () => {
    try {
      const response = await fetch(`${BASE_URL}/Inquiry/GetInquiryByInquiryId?id=${inqId}&optId=${optId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch Inquiry");
      }

      const data = await response.json();
      const inq = data.result;
      setInquiry(inq);
    } catch (error) {
      console.error("Error fetching Inquiry:", error);
    }
  };

  const fetchVersionHistory = async () => {
    try {
      // Don't filter by WindowType - we want to see all history versions for comparison
      // This ensures "Sent Quotation Edit" and other versions are visible regardless of WindowType
      const response = await fetch(`${BASE_URL}/Inquiry/GetQuotationVersionHistory?InquiryID=${inqId}&OptionId=${optId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch Version History");
      }

      const data = await response.json();
      const versionList = data.result || [];
      setVersions(versionList);

      // Fetch line items for each version
      const lineItemsMap = {};
      for (const version of versionList) {
        try {
          const lineResponse = await fetch(`${BASE_URL}/Inquiry/GetQuotationVersionLineHistory?VersionHistoryId=${version.id}`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          });

          if (lineResponse.ok) {
            const lineData = await lineResponse.json();
            lineItemsMap[version.id] = lineData.result || [];
          }
        } catch (error) {
          console.error(`Error fetching line items for version ${version.id}:`, error);
          lineItemsMap[version.id] = [];
        }
      }

      setVersionLineItems(lineItemsMap);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching Version History:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (inqId && optId) {
      fetchInquiryById();
    }
  }, [inqId, optId]);

  useEffect(() => {
    if (inqId && optId && inquiry) {
      fetchVersionHistory();
    }
  }, [inqId, optId, inquiry]);

  const getVersionTypeLabel = (versionType) => {
    const labels = {
      "Initial Creation": "Inquiry Created",
      "Inquiry Created": "Inquiry Created",
      "Pending Quotation Edit": "Pending Quotation Edit",
      "Quotation Approved": "Quotation Approved",
      "Approved Quotation Edit": "Approved Quotation Edit",
      "Sent Quotation Edit": "Sent Quotation Edit"
    };
    return labels[versionType] || versionType;
  };

  const getVersionTypeColor = (versionType) => {
    const colors = {
      "Initial Creation": "primary",
      "Inquiry Created": "primary",
      "Pending Quotation Edit": "warning",
      "Quotation Approved": "success",
      "Approved Quotation Edit": "info",
      "Sent Quotation Edit": "secondary"
    };
    return colors[versionType] || "default";
  };

  // First column (Inquiry Created): show Unit Cost only, no Approved - support both legacy and new version type
  const isInquiryCreatedVersion = (versionType) =>
    versionType === "Initial Creation" || versionType === "Inquiry Created";

  const toNumber = (val) => {
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  const getAllItemNames = () => {
    if (versions.length === 0) return [];
    const firstVersionId = versions[0].id;
    const firstItems = versionLineItems[firstVersionId] || [];
    const ordered = firstItems
      .filter((item) => item.itemName && item.itemName !== "Commission" && item.itemName !== "Pattern")
      .map((item) => item.itemName);
    const seen = new Set(ordered);
    versions.slice(1).forEach((version) => {
      const items = versionLineItems[version.id] || [];
      items.forEach((item) => {
        if (item.itemName && item.itemName !== "Commission" && item.itemName !== "Pattern" && !seen.has(item.itemName)) {
          seen.add(item.itemName);
          ordered.push(item.itemName);
        }
      });
    });
    return ordered;
  };

  // Get pattern and commission items for each version
  const getPatternItem = (versionId) => {
    const items = versionLineItems[versionId] || [];
    return items.find((item) => item.itemName === "Pattern") || {};
  };

  const getCommissionItem = (versionId) => {
    const items = versionLineItems[versionId] || [];
    return items.find((item) => item.itemName === "Commission") || {};
  };

  const getItemForVersion = (versionId, itemName) => {
    const items = versionLineItems[versionId] || [];
    return items.find((item) => item.itemName === itemName) || {};
  };

  // Common qty: use first version's quantity for this item (same line item across versions)
  const getCommonQty = (itemName) => {
    if (versions.length === 0) return 0;
    const item = getItemForVersion(versions[0].id, itemName);
    return item.quantity === null || item.quantity === undefined ? 0 : item.quantity;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  const allItemNames = getAllItemNames();

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>Quotation Version Comparison</h1>
        <ul>
          <li>
            <Link href={getBackUrl()}>
              {from === "pending-quotation" ? "Pending Quotations" : "Approved Quotations"}
            </Link>
          </li>
          <li>Comparison</li>
        </ul>
      </div>
      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} mb={1} display="flex" justifyContent="space-between">
          <Box display="flex" sx={{ gap: "10px" }}>
            {inquiry ? inquiry.customerName : ""} / {inquiry ? inquiry.inquiryCode : ""} / {inquiry ? inquiry.optionName : ""}
          </Box>
          <Button 
            variant="outlined" 
            color="primary"
            onClick={() => router.push(getBackUrl())}
          >
            Go Back
          </Button>
        </Grid>

        {versions.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: "center" }}>
              <Typography color="textSecondary">No version history available</Typography>
            </Paper>
          </Grid>
        ) : (
          <>
            {/* Line Items Table */}
            <Grid item xs={12}>
              <TableContainer component={Paper}>
                <Table size="small" aria-label="line items comparison table" className="dark-table" sx={{ fontSize: "0.75rem" }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ position: "sticky", left: 0, zIndex: 3, backgroundColor: "#f5f5f5", minWidth: 120, padding: "8px 4px" }}>
                        <Typography variant="caption" fontWeight="bold">Description</Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ position: "sticky", left: 120, zIndex: 3, backgroundColor: "#f5f5f5", minWidth: 50, padding: "8px 4px" }}>
                        <Typography variant="caption" fontWeight="bold">Qty</Typography>
                      </TableCell>
                      {versions.map((version, index) => (
                        <TableCell key={index} align="center" sx={{ minWidth: 120, padding: "8px 4px" }}>
                          <Box display="flex" flexDirection="column" alignItems="center" gap={0.3}>
                            <Chip
                              label={getVersionTypeLabel(version.versionType)}
                              color={getVersionTypeColor(version.versionType)}
                              size="small"
                              sx={{ fontWeight: "bold", fontSize: "0.65rem", height: "20px" }}
                            />
                            <Typography variant="caption" color="textSecondary" sx={{ fontSize: "0.65rem" }}>
                              {formatDate(version.createdOn)}
                            </Typography>
                          </Box>
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ position: "sticky", left: 0, zIndex: 3, backgroundColor: "#f5f5f5", padding: "4px" }}></TableCell>
                      <TableCell sx={{ position: "sticky", left: 120, zIndex: 3, backgroundColor: "#f5f5f5", padding: "4px" }}></TableCell>
                      {versions.map((version, index) => (
                        <TableCell key={index} align="center" sx={{ backgroundColor: "#f5f5f5", padding: "4px" }}>
                          {isInquiryCreatedVersion(version.versionType) ? (
                            <Typography variant="caption" sx={{ minWidth: 50, fontSize: "0.7rem" }}>Unit Cost</Typography>
                          ) : (
                            <Typography variant="caption" sx={{ minWidth: 60, background: "#a0b8f6", color: "#fff", p: 0.3, borderRadius: 0.5, fontSize: "0.7rem" }}>
                              Approved
                            </Typography>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {allItemNames.map((itemName, itemIndex) => (
                      <TableRow key={itemIndex} sx={{ "& td": { padding: "4px 8px" } }}>
                        <TableCell sx={{ position: "sticky", left: 0, zIndex: 2, backgroundColor: "#fff", fontWeight: "bold", fontSize: "0.75rem" }}>
                          {itemName}
                        </TableCell>
                        <TableCell align="center" sx={{ position: "sticky", left: 120, zIndex: 2, backgroundColor: "#fff", fontSize: "0.75rem" }}>
                          {getCommonQty(itemName)}
                        </TableCell>
                        {versions.map((version, versionIndex) => {
                          const item = getItemForVersion(version.id, itemName);
                          const isInquiryCreated = isInquiryCreatedVersion(version.versionType);
                          return (
                            <TableCell key={versionIndex} align="center" sx={{ padding: "4px" }}>
                              {isInquiryCreated ? (
                                <Typography sx={{ minWidth: 50, fontSize: "0.7rem" }}>
                                  {item.unitCost === null || item.unitCost === undefined ? 0 : formatCurrency(item.unitCost)}
                                </Typography>
                              ) : (
                                <Typography
                                  sx={{
                                    minWidth: 60,
                                    background: "#a0b8f6",
                                    color: item.approvedUnitCost !== item.unitCost ? "blue" : "#fff",
                                    fontWeight: "bold",
                                    p: 0.3,
                                    borderRadius: 0.5,
                                    fontSize: "0.7rem",
                                  }}
                                >
                                  {item.approvedUnitCost === null || item.approvedUnitCost === undefined
                                    ? 0
                                    : formatCurrency(item.approvedUnitCost)}
                                </Typography>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                    {/* Pattern Row */}
                    <TableRow sx={{ "& td": { padding: "4px 8px" } }}>
                      <TableCell sx={{ position: "sticky", left: 0, zIndex: 2, backgroundColor: "#fff", fontWeight: "bold", fontSize: "0.75rem" }}>
                        Pattern
                      </TableCell>
                      <TableCell align="center" sx={{ position: "sticky", left: 120, zIndex: 2, backgroundColor: "#fff", fontSize: "0.75rem" }}>
                        {versions.length > 0 ? (getPatternItem(versions[0].id).quantity ?? 0) : 0}
                      </TableCell>
                      {versions.map((version, versionIndex) => {
                        const patternItem = getPatternItem(version.id);
                        const isInquiryCreated = isInquiryCreatedVersion(version.versionType);
                        return (
                          <TableCell key={versionIndex} align="center" sx={{ padding: "4px" }}>
                            {isInquiryCreated ? (
                              <Typography sx={{ minWidth: 50, fontSize: "0.7rem" }}>
                                {patternItem.unitCost === null || patternItem.unitCost === undefined
                                  ? 0
                                  : formatCurrency(patternItem.unitCost)}
                              </Typography>
                            ) : (
                              <Typography
                                sx={{
                                  minWidth: 60,
                                  background: "#a0b8f6",
                                  color: patternItem.approvedUnitCost !== patternItem.unitCost ? "blue" : "#fff",
                                  fontWeight: "bold",
                                  p: 0.3,
                                  borderRadius: 0.5,
                                  fontSize: "0.7rem",
                                }}
                              >
                                {patternItem.approvedUnitCost === null || patternItem.approvedUnitCost === undefined
                                  ? 0
                                  : formatCurrency(patternItem.approvedUnitCost)}
                              </Typography>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                    {/* Commission Row */}
                    <TableRow sx={{ "& td": { padding: "4px 8px" } }}>
                      <TableCell sx={{ position: "sticky", left: 0, zIndex: 2, backgroundColor: "#fff", fontWeight: "bold", fontSize: "0.75rem" }}>
                        Commission
                      </TableCell>
                      <TableCell align="center" sx={{ position: "sticky", left: 120, zIndex: 2, backgroundColor: "#fff", fontSize: "0.75rem" }}>
                        1
                      </TableCell>
                      {versions.map((version, versionIndex) => {
                        const commissionItem = getCommissionItem(version.id);
                        const isInquiryCreated = isInquiryCreatedVersion(version.versionType);
                        return (
                          <TableCell key={versionIndex} align="center" sx={{ padding: "4px" }}>
                            {isInquiryCreated ? (
                              <Typography sx={{ minWidth: 50, fontSize: "0.7rem" }}>
                                {commissionItem.totalCost === null || commissionItem.totalCost === undefined
                                  ? 0
                                  : formatCurrency(commissionItem.totalCost)}
                              </Typography>
                            ) : (
                              <Typography
                                sx={{
                                  minWidth: 60,
                                  background: "#a0b8f6",
                                  color: commissionItem.approvedTotalCost !== commissionItem.totalCost ? "blue" : "#fff",
                                  fontWeight: "bold",
                                  p: 0.3,
                                  borderRadius: 0.5,
                                  fontSize: "0.7rem",
                                }}
                              >
                                {commissionItem.approvedTotalCost === null || commissionItem.approvedTotalCost === undefined
                                  ? 0
                                  : formatCurrency(commissionItem.approvedTotalCost)}
                              </Typography>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            {/* Summary Table */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <TableContainer component={Paper}>
                <Table size="small" aria-label="summary comparison table" className="dark-table">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ position: "sticky", left: 0, zIndex: 3, backgroundColor: "#f5f5f5", minWidth: 150 }}>
                        <Typography variant="subtitle2" fontWeight="bold">Description</Typography>
                      </TableCell>
                      {versions.map((version, index) => (
                        <TableCell key={index} align="center" sx={{ minWidth: 200 }}>
                          <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
                            <Chip
                              label={getVersionTypeLabel(version.versionType)}
                              color={getVersionTypeColor(version.versionType)}
                              size="small"
                              sx={{ fontWeight: "bold" }}
                            />
                            <Typography variant="caption" color="textSecondary">
                              {formatDate(version.createdOn)}
                            </Typography>
                          </Box>
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ position: "sticky", left: 0, zIndex: 3, backgroundColor: "#f5f5f5" }}></TableCell>
                      {versions.map((version, index) => (
                        <TableCell key={index} align="center" sx={{ backgroundColor: "#f5f5f5" }}>
                          {isInquiryCreatedVersion(version.versionType) ? (
                            <Typography variant="caption" sx={{ minWidth: 80, color: "#90a4ae" }}>Initial</Typography>
                          ) : (
                            <Typography variant="caption" sx={{ minWidth: 80, background: "#a0b8f6", color: "#fff", p: 0.5, borderRadius: 1 }}>
                              Approved
                            </Typography>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ position: "sticky", left: 0, zIndex: 2, backgroundColor: "#fff", color: "#90a4ae" }}>
                        Total Cost
                      </TableCell>
                      {versions.map((version, index) => (
                        <TableCell key={index} align="center">
                          {isInquiryCreatedVersion(version.versionType) ? (
                            <Typography sx={{ minWidth: 80, color: "#90a4ae" }}>{formatCurrency(version.totalCost)}</Typography>
                          ) : (
                            <Typography
                              sx={{
                                minWidth: 80,
                                background: "#a0b8f6",
                                color: version.apprvedTotalCost !== version.totalCost ? "blue" : "#fff",
                                fontWeight: "bold",
                                p: 0.5,
                                borderRadius: 1,
                              }}
                            >
                              {formatCurrency(version.apprvedTotalCost)}
                            </Typography>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ position: "sticky", left: 0, zIndex: 2, backgroundColor: "#fff", color: "#90a4ae" }}>
                        No of Units
                      </TableCell>
                      {versions.map((version, index) => (
                        <TableCell key={index} align="center">
                          {isInquiryCreatedVersion(version.versionType) ? (
                            <Typography sx={{ minWidth: 80, color: "#90a4ae" }}>{version.totalUnits}</Typography>
                          ) : (
                            <Typography sx={{ minWidth: 80, background: "#a0b8f6", fontWeight: "bold", p: 0.5, borderRadius: 1 }}>
                              {version.apprvedTotalUnits}
                            </Typography>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ position: "sticky", left: 0, zIndex: 2, backgroundColor: "#fff", color: "#90a4ae" }}>
                        Unit Cost
                      </TableCell>
                      {versions.map((version, index) => (
                        <TableCell key={index} align="center">
                          {isInquiryCreatedVersion(version.versionType) ? (
                            <Typography sx={{ minWidth: 80, color: "#90a4ae" }}>{formatCurrency(version.unitCost)}</Typography>
                          ) : (
                            <Typography
                              sx={{
                                minWidth: 80,
                                background: "#a0b8f6",
                                color: version.apprvedUnitCost !== version.unitCost ? "blue" : "#fff",
                                fontWeight: "bold",
                                p: 0.5,
                                borderRadius: 1,
                              }}
                            >
                              {formatCurrency(version.apprvedUnitCost)}
                            </Typography>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ position: "sticky", left: 0, zIndex: 2, backgroundColor: "#fff", color: "#90a4ae" }}>
                        Profit
                      </TableCell>
                      {versions.map((version, index) => (
                        <TableCell key={index} align="center">
                          {isInquiryCreatedVersion(version.versionType) ? (
                            <Typography sx={{ minWidth: 80, color: "#90a4ae" }}>{formatCurrency(version.unitProfit)}</Typography>
                          ) : (
                            <Typography
                              sx={{
                                minWidth: 80,
                                background: "#a0b8f6",
                                color: version.apprvedUnitProfit !== version.unitProfit ? "blue" : "#fff",
                                fontWeight: "bold",
                                p: 0.5,
                                borderRadius: 1,
                              }}
                            >
                              {formatCurrency(version.apprvedUnitProfit)}
                            </Typography>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ position: "sticky", left: 0, zIndex: 2, backgroundColor: "#fff", color: "#90a4ae" }}>
                        Unit Price
                      </TableCell>
                      {versions.map((version, index) => (
                        <TableCell key={index} align="center">
                          {isInquiryCreatedVersion(version.versionType) ? (
                            <Typography sx={{ minWidth: 80, color: "#90a4ae" }}>{formatCurrency(version.sellingPrice)}</Typography>
                          ) : (
                            <Typography
                              sx={{
                                minWidth: 80,
                                background: "#a0b8f6",
                                color: version.apprvedSellingPrice !== version.sellingPrice ? "blue" : "#fff",
                                fontWeight: "bold",
                                p: 0.5,
                                borderRadius: 1,
                              }}
                            >
                              {formatCurrency(version.apprvedSellingPrice)}
                            </Typography>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ position: "sticky", left: 0, zIndex: 2, backgroundColor: "#fff", color: "#90a4ae" }}>
                        Profit Percentage
                      </TableCell>
                      {versions.map((version, index) => (
                        <TableCell key={index} align="center">
                          {isInquiryCreatedVersion(version.versionType) ? (
                            <Typography sx={{ minWidth: 80, color: "#90a4ae" }}>{toNumber(version.profitPercentage).toFixed(2)}%</Typography>
                          ) : (
                            <Typography
                              sx={{
                                minWidth: 80,
                                background: "#a0b8f6",
                                color: version.apprvedProfitPercentage !== version.profitPercentage ? "blue" : "#fff",
                                fontWeight: "bold",
                                p: 0.5,
                                borderRadius: 1,
                              }}
                            >
                              {toNumber(version.apprvedProfitPercentage).toFixed(2)}%
                            </Typography>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ position: "sticky", left: 0, zIndex: 2, backgroundColor: "#fff", color: "#90a4ae" }}>
                        Total Profit
                      </TableCell>
                      {versions.map((version, index) => (
                        <TableCell key={index} align="center">
                          {isInquiryCreatedVersion(version.versionType) ? (
                            <Typography sx={{ minWidth: 80, color: "#90a4ae" }}>{formatCurrency(version.totalProfit)}</Typography>
                          ) : (
                            <Typography
                              sx={{
                                minWidth: 80,
                                background: "#a0b8f6",
                                color: version.apprvedTotalProfit !== version.totalProfit ? "blue" : "#fff",
                                fontWeight: "bold",
                                p: 0.5,
                                borderRadius: 1,
                              }}
                            >
                              {formatCurrency(version.apprvedTotalProfit)}
                            </Typography>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ position: "sticky", left: 0, zIndex: 2, backgroundColor: "#fff", color: "#90a4ae" }}>
                        Revenue
                      </TableCell>
                      {versions.map((version, index) => (
                        <TableCell key={index} align="center">
                          {isInquiryCreatedVersion(version.versionType) ? (
                            <Typography sx={{ minWidth: 80, color: "#90a4ae" }}>{formatCurrency(version.revanue)}</Typography>
                          ) : (
                            <Typography
                              sx={{
                                minWidth: 80,
                                background: "#a0b8f6",
                                color: version.apprvedRevanue !== version.revanue ? "blue" : "#fff",
                                fontWeight: "bold",
                                p: 0.5,
                                borderRadius: 1,
                              }}
                            >
                              {formatCurrency(version.apprvedRevanue)}
                            </Typography>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </>
        )}
      </Grid>
    </>
  );
}
