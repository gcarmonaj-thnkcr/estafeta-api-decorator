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
    FuelChargeListPrice: number; // Eliminado espacio en el nombre
    OverweightListPrice?: number; // Puede ser opcional si no siempre está presente
    FuelChargeOverweightListPrice?: number; // Puede ser opcional
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
