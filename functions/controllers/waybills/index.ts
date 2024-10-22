import { Router, Request, Response } from "express";
import { apiRoot } from "../../commercetools/client";

const router = Router()

const validateWaybillRequest = (waybillService: any) => {
  const isValid = waybillService.every((service: any) => 
    typeof service.storePortalOrder === 'string' &&
    typeof service.storeFolioOrder === 'string' &&
    typeof service.eMailClient === 'string' &&
    typeof service.serviceWarranty === 'string' &&
    typeof service.serviceModality === 'string' &&
    typeof service.waybill === 'string' &&
    typeof service.statusFolioOrder === 'string' &&
    typeof service.usedDate === 'string' &&
    typeof service.IsGenerator === 'boolean'
  );

  return isValid;
}

router.post("/waybills", async (req: Request, res: Response): Promise<any> =>{
  const { WaybillService } = req.body;
  
  const isValid = validateWaybillRequest(WaybillService);

  if (!isValid) {
    return res.status(400).send({ message: 'Invalid WaybillService format.' });
  }
  let resulWaylBill = [] 
  for(const wayBillItem of WaybillService) {

    const order = await apiRoot.orders().search().post({
      body: {
        query: {
          fullText: {
            field: "custom.services",
            value: wayBillItem.qr,
            customType: "StringType"
          }
        }
      }
    }).execute() 
    const searchOrder = await apiRoot.orders().withId({ID: order.body.hits[0].id}).get().execute()
    if(!searchOrder.statusCode || searchOrder.statusCode >= 300) return res.sendStatus(404)
    const customObject = searchOrder.body.custom?.fields["services"] && JSON.parse(searchOrder.body.custom.fields["services"])
    console.log(customObject)
    let servicesFind
    try{
      servicesFind = customObject[searchOrder.body.lineItems[0].id].find((item: any) => item.QR == wayBillItem.qr)
    } catch(err) {
      servicesFind = customObject[searchOrder.body.lineItems[0].id].guides.find((item: any) => item.QR == wayBillItem.qr)
    }
    console.log(servicesFind.status)
    if(!servicesFind.status ||  servicesFind.status == "DISPONIBLE"){
      console.log("Entre")
      servicesFind.status = "EN PROCESO"
      console.log("Cambio")
    } else {
      resulWaylBill.push({
        "resultCode": "1",
        "resultDescription": "El estado actual de la guía es En proceso",
      })
      continue;
    }
    console.log("Response", customObject)
    resulWaylBill.push({
        "resultCode": "0",
        "resultDescription": "Proceso completo",
        "ResultWaybill": servicesFind.guide,
    }) 
    await apiRoot.orders().withId({ID: searchOrder.body.id}).post({
      body: {
        version: searchOrder.body.version,
        actions: [
          {
            action: "setCustomField",
            name: "services",
            value: JSON.stringify(customObject)
          }
        ]
      }
    }).execute()
  }

  //Si esta disonible cambiar a enproceso y retornar datos del waybill
  
  /// Extraer la guia disponible de las ordenes de combo
  /// Asignarla a la orden de servicio conservando la info de la orden de donde se extrajo
  /// Crear la estructura de data.WaybillService

  res.status(200).json(resulWaylBill[0]);
});

router.put("/waybills", async (req: Request, res: Response): Promise<any> =>{
  const { AsignWaybillOrder } = req.body;
  console.log("PUT")
  
  const isValid = validateWaybillRequest(AsignWaybillOrder);

  if (!isValid) {
    return res.status(400).send({ message: 'Invalid WaybillService format.' });
  }

  let resulWaylBill = [] 
  for(const wayBillItem of AsignWaybillOrder) {

    const order = await apiRoot.orders().search().post({
      body: {
        query: {
          fullText: {
            field: "custom.services",
            value: wayBillItem.qr,
            customType: "StringType"
          }
        }
      }
    }).execute() 
    const searchOrder = await apiRoot.orders().withId({ID: order.body.hits[0].id}).get().execute()
    if(!searchOrder.statusCode || searchOrder.statusCode >= 300) return res.sendStatus(404)
    const customObject = searchOrder.body.custom?.fields["services"] && JSON.parse(searchOrder.body.custom.fields["services"])
    let servicesFind
    try{
      servicesFind = customObject[searchOrder.body.lineItems[0].id].find((item: any) => item.QR == wayBillItem.qr)
    } catch(err) {
      servicesFind = customObject[searchOrder.body.lineItems[0].id].guides.find((item: any) => item.QR == wayBillItem.qr)
    }
    if(servicesFind.status){
      switch (wayBillItem.statusFolioOrder) {
        case "UTIL":
          servicesFind.status = "UTILIZADO"
        break;
        case "DISP":
          servicesFind.status = "DISPONIBLE"
        break
        case "CANC":
          servicesFind.status = "CANCELADO"
        break;
        case "ENPR":
          servicesFind.status = "EN PROCESO"
        break;
      }
    }
    resulWaylBill.push({
        "resultCode": 0,
        "resultDescription": "Proceso satisfactorio.",
        "resultAsignWaybill": [
            {
                "resultCode": 0,
                "resultDescription": "Registro actualizado",
                "resultWayBill": servicesFind.guide, 
            }
        ]
    }) 
    await apiRoot.orders().withId({ID: searchOrder.body.id}).post({
      body: {
        version: searchOrder.body.version,
        actions: [
          {
            action: "setCustomField",
            name: "services",
            value: JSON.stringify(customObject)
          }
        ]
      }
    }).execute()
  }

  res.status(200).json(resulWaylBill[0]);
});

export default router
