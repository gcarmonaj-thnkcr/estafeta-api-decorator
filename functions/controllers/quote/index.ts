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
    console.log(req.body)
    const services = await handleCotizacionInternacional(req.body)
    console.log("Respuesta",services)
    if(!req.body.IsRecoleccion) {
      for(const response of services.Response){
        response.Service[0].ServiceCost.InsuredCost = 0
        const vatApplied = response.Service?.[0]?.ServiceCost?.VATApplied ? (response.Service[0].ServiceCost.VATApplied / 100) + 1 : 1.04 
        response.Service[0].ServiceCost.ContingencyChargeListPrice = response.Service?.[0]?.ServiceCost?.ContingencyChargeListPrice ? response.Service?.[0]?.ServiceCost?.ContingencyChargeListPrice * vatApplied : 0
        response.Service[0].ServiceCost.OverweightListPrice = 0
        response.Service[0].ServiceCost.FuelChargeOverweightListPrice = 0
        response.Service[0].ServiceCost.ListPrice = response.Service?.[0]?.ServiceCost?.ListPrice ? response.Service?.[0]?.ServiceCost?.ListPrice * vatApplied : 0
        response.Service[0].ServiceCost["FuelChargeListPrice "] = response.Service?.[0]?.ServiceCost?.["FuelChargeListPrice "] ? response.Service?.[0]?.ServiceCost?.["FuelChargeListPrice "] * vatApplied : 0
        response.Service[0].ServiceCost.TotalAmount = parseFloat((response.Service[0].ServiceCost.ListPrice + response.Service?.[0]?.ServiceCost?.ContingencyChargeListPrice + response.Service[0].ServiceCost["FuelChargeListPrice "]).toFixed(2))
      }
    } else {
      for(const service of services.Response) {
        service.Service[0].ServiceCost.TotalAmount = parseFloat((service.Service[0].ServiceCost.TotalAmount).toFixed(2));
      }
    }
    response = services
  } else {
    return res.sendStatus(404)
  }
  return res.status(200).send(response)
})

export default router
