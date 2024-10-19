import { Router, Request, Response } from "express";
import { validateToken } from "../../jsonToken/token";
import { apiRoot } from "../../commercetools/client";
import { FormaterDate } from "../../utils/formaterDate";

const router = Router()

router.get("/pdv-services", validateToken, async (req: Request, res: Response): Promise<any> =>{
    const qr = req.headers.qr
    if(!qr || qr == '') return res.sendStatus(404)
    const order = await apiRoot.orders().search().post({
      body: {
        query: {
          fullText: {
            field: "custom.services",
            value: qr,
            customType: "StringType"
          }
        }
      }
    }).execute()

    console.log(order.body.hits)
    
    if(order.body.hits.length <= 0) return res.sendStatus(404)
    
    const searchOrder = await apiRoot.orders().withId({ID: order.body.hits[0].id}).get().execute()
    if(!searchOrder.statusCode || searchOrder.statusCode >= 300) return res.sendStatus(404)
    const customer = await apiRoot.customers().withId({ID: searchOrder.body?.customerId ?? ""}).get().execute()
    const customObject = searchOrder.body.custom?.fields["services"] && JSON.parse(searchOrder.body.custom.fields["services"])
    let servicesFind;
    try{
      servicesFind = customObject[searchOrder.body.lineItems[0].id].find((item: any) => item.QR == qr)
    } catch(err) {
      servicesFind = customObject[searchOrder.body.lineItems[0].id].guides.find((item: any) => item.QR == qr)
    }
    console.log(servicesFind) 
    const { origin, destination } = servicesFind.address

    const responseObject = {
      "pdvService": {
        "storeServiceOrder": searchOrder.body.id,
        "PurchaseOrder": searchOrder.body.orderNumber ?? searchOrder.body.custom?.fields?.["pickupNumber"] ?? "",
        "waybill": !servicesFind.status || servicesFind.status == "CANCELADO" ? "" : servicesFind?.guide,
        "idcaStoreClient": searchOrder.body.customerId,
        "eMailClient": customer.body.email,
        "idcaServiceWarranty": servicesFind.guide[13],
        "idcaServiceModality": servicesFind.guide[14],
        "isPudo": servicesFind.isPudo ? "1" : "0",
        "isPackage": servicesFind.isPackage? "1" : "0",
        "itemLength": servicesFind?.itemLength ?? "",
        "itemHeight": servicesFind?.itemHeight ?? "",
        "itemWidth": servicesFind?.itemWidth ?? "",
        "itemVolumen": servicesFind?.itemVolumen ?? "",
        "isItemDimensionsExceeded": servicesFind.isItemDimensionsExceeded ? "1" : "0",
        "itemWeight": servicesFind?.itemWeight ?? "",
        "isItemWeightExceeded": servicesFind.isItemWeightExceeded ? "1" : "0",
        "statusServiceOrder": servicesFind?.status ?? "DISPONIBLE",
        "QRCode": "", // Vacio
        "QRCodeMD5": servicesFind.QR,
        "TarriffFractionCode": "0",
        "consultaId": "99999999", /// Revisarlo con Memo
        "createdDate": FormaterDate(searchOrder.body.createdAt, false),
        "availabledDate": `${FormaterDate(searchOrder.body.createdAt, false)} - ${FormaterDate(searchOrder.body.createdAt,false)}`,
        "sender": {
            "eMailClient": origin.email, //email del remitente
            "isPudo": "0",
            "EquivalentCode": "123",
            "TyoeLocationName": "Nombre del Pudo",
            "SpaceOwnerName": "Tipo de pudo",
            "isSender": "0",
            "Alias": "",
            "TaxPayer": "",
            "CompleteName": origin?.firstName ?? "" +" " + origin?.lastName ?? ""+ " " + origin?.middleName ?? "",
            "zipCode": origin.postalCode,
            "roadTypeCode": "9999",
            "roadTypeName": origin.road,
            "street": origin.street,
            "externalNum": origin.exteriorNumber,
            "indoreInformation": origin?.interiorNumber ?? "",
            "settlementTypeCode": "999",
            "settlementTypeName": origin.settlement,
            "SettlementTypeAbbName": origin.settlement.slice(0, 3),
            "settlementName": "La Patera Vallejo",
            "twnshipCode": "999",
            "twnshipName": "Gustavo A Madero",
            "stateCode": origin.postalCode,
            "stateName": origin.state,
            "countryCode": "999",
            "countryCodeAlfa3": "MEX",
            "countryName": origin.country,
            "betweenRoadName1": origin?.optionalAddress1 ?? "",
            "betweenRoadName2": "y"+" "+origin?.optionalAddress2,
            "AddressReference": origin?.reference ?? "",
            "CountryCodePhone": "999",
            "LandlinePhone": origin.phone1,
            "CellPhone": origin?.phon2 ?? "",
            "ContacteMail": origin.email,
            "Latitude": 99999.99,
            "Longitude": 99999.99,
            "IsActive": "True",
            "recipient": {
              "eMailClient": destination.email, //email del destinatario
              "isPudo": "0",
              "EquivalentCode": "123",
              "TyoeLocationName": "Nombre del Pudo",
              "SpaceOwnerName": "Tipo de pudo",
              "isSender": "0",
              "Alias": "",
              "TaxPayer": "",
              "CompleteName": destination?.firstName ?? ""+" " + destination?.lastName?? ""+ " " + destination?.middleName ?? "",
              "zipCode": destination.postalCode,
              "roadTypeCode": "9999",
              "roadTypeName": destination.road,
              "street": destination.street,
              "externalNum": destination.exteriorNumber,
              "indoreInformation": destination?.interiorNumber ?? "",
              "settlementTypeCode": "999",
              "settlementTypeName": destination.settlement,
              "SettlementTypeAbbName": destination.settlement.slice(0, 3),
              "settlementName": "La Patera Vallejo",
              "twnshipCode": "999",
              "twnshipName": "Gustavo A Madero",
              "stateCode": destination.postalCode,
              "stateName": destination.state,
              "countryCode": "999",
              "countryCodeAlfa3": "MEX",
              "countryName": destination.country,
              "betweenRoadName1": destination?.optionalAddress1 ?? "",
              "betweenRoadName2": "y"+" "+destination?.optionalAddress2,
              "AddressReference": destination?.reference ?? "",
              "CountryCodePhone": "999",
              "LandlinePhone": destination.phone1,
              "CellPhone": destination?.phon2 ?? "",
              "ContacteMail": destination.email,
              "Latitude": 99999.99,
              "Longitude": 99999.99,
              "IsActive": "True",
            }
        }
      }
    }

    res.json ({
      statusCode: 200,
      resultCode: 0,
      resultDescription: "",
      body: responseObject,
    });
});

export default router
