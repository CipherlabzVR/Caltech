// PurchasingOrderType enum - matches backend ApexflowERP.Domain.Enums.PurchasingOrderType
export const PurchasingOrderType = {
  Local: 1,
  Import: 2,
};

export const PurchasingOrderTypeLabels = {
  [PurchasingOrderType.Local]: "Local",
  [PurchasingOrderType.Import]: "Import",
};

export default PurchasingOrderType;

