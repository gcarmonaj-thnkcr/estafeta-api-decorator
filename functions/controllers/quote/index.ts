import { Router, type Request, type Response } from "express";
import { handleCotizacion, handleCotizacionInternacional } from "../../estafetaAPI/quote";

const router = Router()

router.post("/quote", async(req: Request, res: Response): Promise<any> => {
  let response 
  if(req.body.type == "nacional") {
    const services= await handleCotizacion(req.body)
    if(!req.body.IsRecoleccion) {
      for(const service of services.Quotation[0].Service) {
        service.OverweightListPrice = 0
        service.VATApplied = 0
        service.InsuredCost = 0
        service.DeliveryZone = 0
        service.FuelChargeOverweightListPrice = 0
        service.ForwardingLevelCostListPrice = 0
        service.TotalAmount = parseFloat((service.ListPrice + service['FuelChargeListPrice ']).toFixed(2));
      }
    } else {
      for(const service of services.Quotation[0].Service) {
        service.TotalAmount = parseFloat((service.TotalAmount).toFixed(2));
      }
    }
    response = services

  } else if (req.body.type == "unizona"){
    const services= await handleCotizacion(req.body)
    if(req.body.IsRecoleccion) {
      for(const service of services.Quotation[0].Service) {
        service.ListPrice = 0
        service['FuelChargeListPrice '] = 0
        service.OverweightListPrice = service?.OverweightListPrice ?? 0
        service.FuelChargeOverweightListPrice = service?.FuelChargeOverweightListPrice ?? 0
        service.ForwardingLevelCostListPrice = service?.ForwardingLevelCostListPrice ?? 0
        service.InsuredCost = service?.InsuredCost ?? 0
        service.TotalAmount = parseFloat((service.OverweightListPrice + service.FuelChargeOverweightListPrice + service.ForwardingLevelCostListPrice + service.InsuredCost).toFixed(2));
      }
    }
    else {
      for(const service of services.Quotation[0].Service) {
        service.FuelChargeOverweightListPrice = 0
        service.InsuredCost = 0
        service.OverweightListPrice = 0
        service.FuelChargeListPrice = 0
        service.ListPrice = 0
        service.VATApplied = 0
        services.ForwardingLevelCostListPrice = 0
        service['FuelChargeListPrice '] = 0
        service.TotalAmount = 0;
      }
    }
    response = services
  } else if(req.body.type == "internacional") {
    const services = await handleCotizacionInternacional(req.body)
    if(!req.body.IsRecoleccion) {
      for(const response of services.Response){
        response.Service[0].ServiceCost.InsuredCost = 0
        const vatApplied = response.Service?.[0]?.ServiceCost?.VATApplied ? (response.Service[0].ServiceCost.VATApplied / 100) + 1 : 1 
        //const vatApplied = 1 
        response.Service[0].ServiceCost.ContingencyChargeListPrice = response.Service?.[0]?.ServiceCost?.ContingencyChargeListPrice ? response.Service?.[0]?.ServiceCost?.ContingencyChargeListPrice * vatApplied : 0
        response.Service[0].ServiceCost.OverweightListPrice = 0
        response.Service[0].ServiceCost.FuelChargeOverweightListPrice = 0
        response.Service[0].ServiceCost.ListPrice = response.Service?.[0]?.ServiceCost?.ListPrice ? response.Service?.[0]?.ServiceCost?.ListPrice * vatApplied : 0
        response.Service[0].ServiceCost["FuelChargeListPrice "] = response.Service?.[0]?.ServiceCost?.["FuelChargeListPrice "] ? response.Service?.[0]?.ServiceCost?.["FuelChargeListPrice "] * vatApplied : 0
        response.Service[0].ServiceCost.TotalAmount = parseFloat((response.Service[0].ServiceCost.ListPrice + response.Service?.[0]?.ServiceCost?.ContingencyChargeListPrice + response.Service[0].ServiceCost["FuelChargeListPrice "]).toFixed(2))
      }
    } else {
      for(const response of services.Response) {

        const vatApplied = response.Service?.[0]?.ServiceCost?.VATApplied ? (response.Service[0].ServiceCost.VATApplied / 100) + 1 : 1
        //const vatApplied = 1
        let totalAmount = response.Service[0].ServiceCost.TotalAmount - (response.Service?.[0]?.ServiceCost?.ContingencyChargeListPrice ?? 0) - (response.Service?.[0]?.ServiceCost?.ListPrice ?? 0) - (response.Service[0].ServiceCost["FuelChargeListPrice "] ?? 0)

        response.Service[0].ServiceCost.ContingencyChargeListPrice = response.Service?.[0]?.ServiceCost?.ContingencyChargeListPrice ? response.Service?.[0]?.ServiceCost?.ContingencyChargeListPrice * vatApplied : 0

        response.Service[0].ServiceCost.ListPrice = response.Service?.[0]?.ServiceCost?.ListPrice ? response.Service?.[0]?.ServiceCost?.ListPrice * vatApplied : 0

        response.Service[0].ServiceCost["FuelChargeListPrice "] = response.Service?.[0]?.ServiceCost?.["FuelChargeListPrice "] ? response.Service?.[0]?.ServiceCost?.["FuelChargeListPrice "] * vatApplied : 0

        totalAmount = totalAmount + response.Service[0].ServiceCost.ContingencyChargeListPrice + response.Service[0].ServiceCost.ListPrice + response.Service[0].ServiceCost["FuelChargeListPrice "]

        response.Service[0].ServiceCost.TotalAmount = parseFloat((totalAmount).toFixed(2));
      }
    }
    response = services
  } else {
    console.log("")
    return res.sendStatus(404)
  }
  return res.status(200).send(response)
})

export default router
