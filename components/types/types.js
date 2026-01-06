export const getPaymentMethods = (type) => {
  switch (type) {
    case 1:
      return "Cash";
    case 2:
      return "Card";
    case 3:
      return "Cash & Card";
    case 4:
      return "Bank Transfer";
    case 5:
      return "Cheque";
    case 7:
      return "Credit";
    default:
      return "Not Selected";
  }
};

export const getMonth = (number) => {
  switch (number) {
    case 1:
      return "January";
    case 2:
      return "February";
    case 3:
      return "March";
    case 4:
      return "April";
    case 5:
      return "May";
    case 6:
      return "June";
    case 7:
      return "July";
    case 8:
      return "August";
    case 9:
      return "September";
    case 10:
      return "October";
    case 11:
      return "November";
    case 12:
      return "December";
    default:
      return "Invalid Month";
  }
};

export const getAccountType = (type) => {
  switch (type) {
    case 1:
      return "Current Account";
    case 2:
      return "Savings Account";
    case 3:
      return "Salary Account";
    case 4:
      return "Fixed Deposit Account";
    default:
      return "Not Selected";
  }
};

export const ChartOfAccountType = (type) => {
  switch (type) {
    case 1:
      return "Income";
    case 2:
      return "Payment";
    case 3:
      return "Fixed Assets";
    case 4:
      return "Bank";
    case 5:
      return "Loan";
    case 6:
      return "Credit Card";
    case 7:
      return "Equity";
    default:
      return "N/A";
  }
};


export const getEventType = (type) => {
  switch (type) {
    case 1:
      return "Wedding";
    case 2:
      return "H/C";
    case 3:
      return "Wedding & H/C";
    case 4:
      return "N/D";
    case 5:
      return "P/S";
    case 6:
      return "Outfit Only";
    case 7:
      return "Engagement";
    default:
      return "N/A";
  }
};

export const getBridal = (type) => {
  switch (type) {
    case 1:
      return "Kandyan";
    case 2:
      return "Indian";
    case 3:
      return "Western";
    case 4:
      return "Hindu";
    default:
      return "N/A";
  }
};

export const getLocation = (type) => {
  switch (type) {
    case 1:
      return "Studio";
    case 2:
      return "Away";
    case 3:
      return "Overseas";
    default:
      return "N/A";
  }
};

export const getDressingType = (type) => {
  switch (type) {
    case 1:
      return "Bride";
    case 2:
      return "Maids";
    case 3:
      return "Touch Up";
    case 4:
      return "Touch Up 2";
    case 5:
      return "Going Away";
    case 6:
      return "Home Coming";
    default:
      return "N/A";
  }
};

export const getPreferedTime = (type) => {
  switch (type) {
    case 1:
      return "Morning";
    case 2:
      return "Evening";
    default:
      return "N/A";
  }
};

export const getAppointment = (type) => {
  switch (type) {
    case 1:
      return "First";
    case 2:
      return "Show Saree";
    case 3:
      return "Fabric & Design";
    case 4:
      return "Measurement";
    case 5:
      return "Fiton";
    case 6:
      return "Trial";
    default:
      return "Completed";
  }
};

export const getAppointmentColor = (type) => {
  switch (type) {
    case 1:
      return "#AFDDFF";
    case 2:
      return "#FFD0C7";
    case 3:
      return "#FF9B17";
    case 4:
      return "#D4C9BE";
    case 5:
      return "#A0C878";
    case 6:
      return "#DDA853";
    default:
      return "#ECE852";
  }
};

export const getCashType = (type) => {
  switch (type) {
    case 1:
      return "Cash In";
    case 2:
      return "Cash Out";
    case 3:
      return "Bank";
    default:
      return "N/A";
  }
};

export const getWindowType = (type) => {
  switch (type) {
    case 1:
      return "T-Shirt";
    case 2:
      return "Shirt";
    case 3:
      return "Cap";
    case 4:
      return "Visor";
    case 5:
      return "Hat";
    case 6:
      return "Bag";
    case 7:
      return "Bottom";
    case 8:
      return "Short";
    default:
      return "-";
  }
};

export const getProductionTaskStatus = (type) => {
  switch (type) {
    case 1:
      return "Pending";
    case 2:
      return "In Progress";
    case 3:
      return "Skiped";
    case 4:
      return "Completed";
    case 5:
      return "Paused";
    default:
      return "N/A";
  }
};

export const getStatusColor = (type) => {
  switch (type) {
    case 1:
      return "#D4C9BE";
    case 2:
      return "#AFDDFF";
    case 3:
      return "#FF9B17";
    case 4:
      return "#A0C878";
    case 5:
      return "#DDA853";
    default:
      return "";
  }
};

export const getNationality = (type) => {
  switch (type) {
    case 1:
      return "Sri Lankan";
    case 2:
      return "Other";
    default:
      return "";
  }
};

export const getBookingStatus = (type) => {
  switch (type) {
    case 1:
      return "Reserved";
    case 2:
      return "Completed";
    case 3:
      return "Canceled";
    default:
      return "";
  }
};

export const getBookingPaymentStatus = (type) => {
  switch (type) {
    case 1:
      return "Pending";
    case 2:
      return "Paid";
    default:
      return "";
  }
};



export const projectStatusType = (type) => {
  switch (type) {
    case 1:
      return "Quotation Created";
    case 2:
      return "Quotation Confirmed";
    case 3:
      return "Proforma Invoice Confirmed";
    case 4:
      return "Tech Pack Confirmed";
    case 5:
      return "Sample Confirmed";
    case 6:
      return "Proforma Invoice Rejected";
    case 7:
      return "Tech Pack Rejected";
    case 8:
      return "Sample Rejected";
    case 9:
      return "Quotation Rejected";
    case 10:
      return "Proforma Invoice Created";
    default:
      return "";
  }
};

export const projectStatusColor = (type) => {
  switch (type) {
    case 1:
      return "#FFC107";
    case 2:
      return "#4CAF50";
    case 3:
      return "#2196F3";
    case 4:
      return "#009688";
    case 5:
      return "#8BC34A";
    case 6:
      return "#F44336";
    case 7:
      return "#E53935";
    case 8:
      return "#D32F2F";
    case 9:
      return "#B71C1C";
    case 10:
      return "#2196F3";
    default:
      return "#9E9E9E";
  }
};

