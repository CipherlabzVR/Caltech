import { StyleSheet } from "@react-pdf/renderer";

const GREEN = "#92D050";
const YELLOW = "#FFFF00";
const RED = "#C00000";
const BORDER = "#000000";

const ChargesInvoiceStyles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 8,
    fontFamily: "Helvetica",
  },
  dressingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  dressingText: {
    fontSize: 8,
    color: RED,
    fontFamily: "Helvetica-Bold",
  },
  outerBorder: {
    borderWidth: 1,
    borderColor: BORDER,
  },
  invoiceTitle: {
    backgroundColor: GREEN,
    textAlign: "center",
    fontSize: 16,
    fontFamily: "Helvetica-BoldOblique",
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderColor: BORDER,
  },
  clientBlock: {
    backgroundColor: GREEN,
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: BORDER,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  clientCol: {
    flex: 1,
  },
  clientLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
  },
  clientName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    marginBottom: 1,
  },
  clientAddress: {
    fontSize: 8,
    marginBottom: 2,
  },
  clientValue: {
    fontSize: 8,
  },
  rightCol: {
    alignItems: "flex-end",
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    marginBottom: 4,
  },
  categoryBadge: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: RED,
    backgroundColor: "#FFFFFF",
    borderWidth: 0.5,
    borderColor: BORDER,
    borderRadius: 3,
    paddingVertical: 1.5,
    paddingHorizontal: 5,
    marginLeft: 3,
    marginBottom: 3,
  },
  datesRow: {
    flexDirection: "row",
    marginBottom: 1,
  },
  dateLabel: {
    fontFamily: "Helvetica-Bold",
    width: 70,
    fontSize: 8,
  },
  dateValue: {
    fontSize: 8,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: GREEN,
    borderBottomWidth: 1,
    borderColor: BORDER,
  },
  th: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    paddingVertical: 2,
    paddingHorizontal: 3,
    borderRightWidth: 1,
    borderColor: BORDER,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderColor: BORDER,
  },
  sectionRow: {
    flexDirection: "row",
    backgroundColor: "#EAF7DC",
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: BORDER,
    marginTop: 3,
  },
  td: {
    fontSize: 8,
    paddingVertical: 1.5,
    paddingHorizontal: 3,
    borderRightWidth: 1,
    borderColor: BORDER,
  },
  sectionLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    paddingVertical: 3,
    paddingHorizontal: 3,
  },
  colDesc: { width: "46%" },
  colQty: { width: "16%", textAlign: "center" },
  colRate: { width: "18%", textAlign: "right" },
  colAmount: { width: "20%", textAlign: "right", borderRightWidth: 0 },
  totalRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderColor: BORDER,
  },
  totalLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    paddingVertical: 2,
    paddingHorizontal: 3,
    width: "80%",
  },
  totalValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    paddingVertical: 2,
    paddingHorizontal: 3,
    width: "20%",
    textAlign: "right",
  },
  summaryBlock: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    overflow: "hidden",
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F5F5F5",
    borderBottomWidth: 0.5,
    borderColor: "#CCCCCC",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  summaryLabelCol: {
    width: "70%",
  },
  summaryLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    width: "70%",
  },
  summaryHint: {
    fontSize: 7,
    color: "#555555",
    marginTop: 1,
  },
  summaryValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    textAlign: "right",
    width: "30%",
  },
  netTotalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: YELLOW,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  netTotalLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    width: "70%",
  },
  netTotalValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    textAlign: "right",
    width: "30%",
  },
  footer: {
    marginTop: 8,
    alignItems: "center",
  },
  footerText: {
    fontSize: 8,
    textAlign: "center",
    marginBottom: 2,
  },
  footerRed: {
    fontSize: 8,
    textAlign: "center",
    marginBottom: 2,
    color: RED,
    fontFamily: "Helvetica-Oblique",
  },
  thankYou: {
    fontSize: 10,
    textAlign: "center",
    marginTop: 4,
    color: RED,
    fontFamily: "Helvetica-BoldOblique",
  },
});

export default ChargesInvoiceStyles;
