export interface PickupPackage {
  PackageType: string;
  Length: number;
  Width: number;
  Height: number;
  Weight: number;
  Quantity: number;
  Description: string;
}

export interface IMapGuide {
  [key: string]: {
    guide: string;
    QR: string;
    Recoleccion?: any
    isPudo: boolean;
    isPackage: boolean;
    isItemDimensionsExceeded: boolean;
    isItemWeightExceeded: boolean;
    itemHeight: string;
    itemWidth: string;
    itemVolumen: string;
    itemWeight: string;
    itemLength: string;
    address: any;
    servicio: string;
  }[];
}

export interface IOrderSelected {
  guia: string;
  qr: string;
  id: string;
  orderId: string;
  typeGuide: string;
  address: any;
}

export interface PickupRequest {
  AccountNumber: string;
  RequesterName: string;
  RequesterEmail: string;
  PickupType: string;
  PickupDayPart: string;
  PickupDate: string;
  PickupAddress: PickupAddress;
  PickupPackageList: PickupPackage[];
  PickupAlert_Primary: PickupAlert;
}

interface PickupAddress {
  ShortName: string;
  Country: string;
  PostalCode: string;
  State: string;
  City: string;
  Neighborhood: string;
  Address1: string;
  ExternalNumber: string;
  InternalNumber: string;
  BetweenStreet1: string;
  ReferenceData: string;
}

interface PickupAlert {
  Name: string;
  EmailAddress: string;
  PhoneNumber: string;
}
