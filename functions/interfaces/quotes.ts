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

//INTERNACIONAL
//
interface ServiceCost {
    ListPrice: number;
    VATApplied?: number; // Este campo es opcional, ya que no está en todos los servicios
    FuelChargeListPrice: number;
    ContingencyChargeListPrice: number;
    SpecialHandlingListPrice: number;
    InsuredCost: number;
    TotalAmount: number;
    OverweightListPrice?: number;
    FuelChargeOverweightListPrice?: number;
}

interface Service {
    ServiceCode: string;
    ServiceName: string;
    Modality: string;
    ServiceCost: ServiceCost;
    DeliveryZone: number;
}

interface Destination {
    ZipCode: string;
    TownshipName: string;
    StateName: string;
}

interface ResponseItem {
    Service: Service[];
    DeliveryZone: number;
    Destination: Destination;
    Message: string;
}

export interface ApiResponse {
    Response: ResponseItem[];
}
