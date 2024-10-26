export interface Quotation {
    Quotation: QuotationDetails[];
}

interface QuotationDetails {
    Service: Service[];
    PackagingType: string;
    DeliveryZone: number;
    Origin: Location;
    Destination: Location;
    Message: string;
}

interface Service {
    ServiceCode: string;
    ServiceName: string;
    Modality: string;
    ListPrice: number;
    VATApplied: number;
    FuelChargeListPrice: number; 
    OverweightListPrice?: number; 
    FuelChargeOverweightListPrice?: number; 
    ForwardingLevelCostListPrice?: number;
    InsuredCost: number;
    TotalAmount: number;
    CoversWarranty: string;
}

interface Location {
    Postalcode: string;
    WarehouseCode: string;
    TownshipName: string;
    StateName: string;
}
