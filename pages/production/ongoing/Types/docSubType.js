import React from "react";

export default function DocSubType({ type }) {
  const GetSubDocumentType = (type) => {
    switch (type) {
      case 1:
        return "EMBROIDER";
      case 2:
        return "SUBLIMATION";
      case 3:
        return "Screen Print";
      case 4:
        return "DTF";
      case 6:
        return "Option Image";
      default:
        return "Common";
    }
  };

  return <>{GetSubDocumentType(type)}</>;
}
