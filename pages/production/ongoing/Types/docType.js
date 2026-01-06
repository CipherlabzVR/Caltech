import React from "react";

export default function DocType({ type }) {
  const GetDocumentType = (type) => {
    switch (type) {
      case 1:
        return "Front";
      case 2:
        return "Back";
      case 3:
        return "Back Inside";
      case 4:
        return "L Sleeve";
      case 5:
        return "R Sleeve";
      case 7:
        return "L Side";
      case 8:
        return "R Side";
      case 9:
        return "Back L";
      case 10:
        return "Back R";
      case 11:
        return "Front L";
      case 12:
        return "Front R";
      case 13:
        return "Front LR";
      case 14:
        return "Option";
      case 15:
        return "Not Selected";
      default:
        return "Common";
    }
  };

  return <>{GetDocumentType(type)}</>;
}
