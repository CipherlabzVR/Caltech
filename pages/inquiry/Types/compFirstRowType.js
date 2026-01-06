import React from "react";

export default function ComponentFirstRowsType({ type }) {
  const getComponentTypeFirstRow = (type) => {
    switch (type) {
      case 1:
        return "3";
      case 2:
        return "5";
      case 3:
        return "6";
      case 4:
        return "Sandwitch";
      case 6:
        return "Velcro";
      case 7:
        return "Adj / Buckle";
      case 10:
        return "Not Selected";
      case 11:
        return "Straight /PKT";
      case 12:
        return "Angle / PKT";
      case 13:
        return "Side Pie Pin";
      case 14:
        return "Side Tape";
      case 0:
        return "";
      default:
        return "Unknown";
    }
  };

  return <>{getComponentTypeFirstRow(type)}</>;
}
