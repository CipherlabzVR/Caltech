import { StyleSheet } from "@react-pdf/renderer";

const ShipmentStyles = StyleSheet.create({
    page: {
        flexDirection: "row",
        backgroundColor: "#E4E4E4",
        position: "relative",
      },
      backgroundImage: {
        width: "100%",
        height: "100%",
        top: 0,
        position: "absolute",
        zIndex: -1,
      },
      sign: {
        width: "150px",
        height: "70px",
        bottom: "200px",
        position: "absolute",
        zIndex: -1,
        left: "35px",
      },
      section: {
        margin: 10,
        flexGrow: 1,
        border: "1px solid black",
      },
      date: {
        fontSize: "9px",
        marginBottom: "20px",
        marginTop: "190px",
        marginLeft: "80px",
      },
      invoiceNo: {
        fontSize: "9px",
        marginBottom: "20px",
        marginTop: "-30px",
        marginLeft: "390px",
      },
      addDesi: {
        fontSize: "9px",
        marginBottom: "5px",
        marginLeft: "80px",
      },
      add: {
        fontSize: "9px",
        marginBottom: "5px",
        marginLeft: "80px",
      },
      contact: {
        fontSize: "9px",
        border: "1px solid gray",
        padding: "5px",
      },
      heading: {
        fontSize: "11px",
        fontWeight: "bold",
        marginTop: "15px",
        marginBottom: "15px",
        marginLeft: "80px",
      },
      points: {
        fontSize: "9px",
        marginLeft: "20px",
        marginBottom: "8px",
        marginLeft: "80px",
        marginRight: "85px",
      },
      table: {
        display: "table",
        width: "80%",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#000",
        borderBottom: "none",
        marginTop: 0,
        marginLeft: '80px',
      },
      tableRow: {
        flexDirection: "row",
      },
      lastTableCell: {
        flex: 1,
        borderBottomWidth: 1,
        borderColor: "#000",
        padding: 5,
        fontSize: "9px",
      },
      tableCell: {
        flex: 1,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: "#000",
        padding: 5,
        fontSize: "9px",
      },
});

export default ShipmentStyles;
