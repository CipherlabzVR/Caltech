export const formatCurrency = (value) => {
  const number = parseFloat(value);
  if (isNaN(number)) return "0.00";

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number);
};


export const formatDate = (date) => {
  if (date === null) {
    return "";
  } else {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }
};

export const formatDateWithTime = (dateStr) => {
  const date = new Date(dateStr);

  const options = {
    timeZone: 'Asia/Colombo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  };

  const formatter = new Intl.DateTimeFormat('en-CA', options);
  const parts = formatter.formatToParts(date);

  const yyyy = parts.find(p => p.type === 'year').value;
  const mm = parts.find(p => p.type === 'month').value;
  const dd = parts.find(p => p.type === 'day').value;
  const hour = parts.find(p => p.type === 'hour').value;
  const minute = parts.find(p => p.type === 'minute').value;
  const ampm = parts.find(p => p.type === 'dayPeriod').value.toUpperCase();

  return `${yyyy}-${mm}-${dd}, ${hour}:${minute}${ampm}`;
};

export const convertTo24Hour = (time) => {
  if (!time) return "";

  const [t, modifier] = time.trim().split(" ");
  if (!t || !modifier) return "";

  let [hour, minute] = t.split(":");
  hour = parseInt(hour, 10);

  if (isNaN(hour) || isNaN(parseInt(minute))) return "";

  if (modifier.toUpperCase() === "PM" && hour !== 12) {
    hour += 12;
  } else if (modifier.toUpperCase() === "AM" && hour === 12) {
    hour = 0;
  }

  return `${hour.toString().padStart(2, "0")}:${minute}`;
};

export const convertTo12Hour = (time) => {
  if (!time) return ""; 

  const [hour, minute] = time.split(":");
  const h = parseInt(hour, 10);

  if (isNaN(h)) return "";

  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;

  return `${hour12.toString().padStart(2, "0")}:${minute} ${suffix}`;
};



