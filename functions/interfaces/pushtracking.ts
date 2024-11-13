export interface IPushTrackingRequest {
    thirdPL: string;
    Item: Array<{
        Code: string;
        DevolutionCode: string;
        Reference: string;
        EstimatedDeliveryDate: string;
        Status: IStatus;
    }>;
}

interface IStatus {
    Code: string;
    Name: string;
    EventCode: string;
    DeliveredItemName: string;
    ReasonCode: string;
    ReasonCodeDescription: string;
    EventDateTime: string;
    DeliveredDateTime: string;
    Township: string;
}