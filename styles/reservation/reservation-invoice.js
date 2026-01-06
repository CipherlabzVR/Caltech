import { StyleSheet } from "@react-pdf/renderer";

const ReservationInvoiceStyles = StyleSheet.create({
  page: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    position: "relative",
  },
  section: {
    margin: 10,
    flexGrow: 1,
    border: "1px solid black",
  },
  title: {
    fontSize: "14px",
    marginBottom: "5px",
    marginTop: '10px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    textAlign: "center",
    alignSelf: "center",
  },
  subtitle: {
    fontSize: "14px",
    marginBottom: "5px",
    marginTop: '0',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    textAlign: "center",
    alignSelf: "center",
  },
  address: {
    fontSize: "11px",
    marginBottom: "5px",
    marginTop: '0',
    textAlign: "center",
    alignSelf: "center",
  },
  table: {
    display: "table",
    width: "95%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#000",
    borderBottom: "none",
    marginTop: 0,
    marginLeft: '2.5%'
  },
  tableRow: {
    flexDirection: "row",
  },
  tableCell: {
    flex: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000",
    padding: 3,
    fontSize: "9px",
  },
  
});

export default ReservationInvoiceStyles;
