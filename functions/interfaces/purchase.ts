export interface PurchaseOrder {
  Code: string;
  OrderSAP: string;
  SelledDateTime: string;
  BuyedDateTime: string;
  PaidDateTime: string;
  WaybillList: Waybill[];
}

interface Waybill {
  Code: string;
  TrackingCode: string;
}

export interface ILineGuide {
  sku: string;
  code: string;
  orderSap: string;
  guides?: IGuides[];
}

interface IGuides {
  guide: string;
  QR: string;
}
