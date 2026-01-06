import React from "react";

export default function ComponentTypes({ type }) {
  const getComponentType = (type) => {
    switch (type) {
      case 1:
        return "Panel";
      case 2:
        return "Peek";
      case 3:
        return "Back";
      case 4:
        return "Ventilation Holes";
      case 7:
        return "Contrast";
      case 8:
        return "Numbers";
      case 9:
        return "Cord Color";
      case 12:
        return "Bottom";
      default:
        return "Unknown";
    }
  };

  return <>{getComponentType(type)}</>;
}
