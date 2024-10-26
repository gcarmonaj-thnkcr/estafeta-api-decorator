import { Router, type Request, type Response } from "express";
import { handleCotizacion, handleCotizacionInternacional } from "../../estafetaAPI/quote";
import { ApiResponse, Quotation } from "../../interfaces/quotes";
import { argv0 } from "process";

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
        service.TotalAmount = parseFloat((service.ListPrice + service['FuelChargeListPrice ']).toFixed(2));
      }
    }
    response = services

  } else if (req.body.type == "unizona"){
    const services= await handleCotizacion(req.body)
    if(req.body.IsRecoleccion) {
      for(const service of services.Quotation[0].Service) {
        service.OverweightListPrice = service.OverweightListPrice ?? 0 
        service.FuelChargeOverweightListPrice = service?.FuelChargeOverweightListPrice ?? 0
        service.ForwardingLevelCostListPrice = service.ForwardingLevelCostListPrice ?? 0
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
        service['FuelChargeListPrice '] = 0
        service.TotalAmount = 0;
      }
    }
    response = services
  } else if(req.body.type == "internacional") {
    console.log(req.body)
    const services: ApiResponse = await handleCotizacionInternacional(req.body)
    console.log("Respuesta",services)
    if(!req.body.IsRecoleccion) {
      for(const response of services.Response){
        response.Service[0].ServiceCost.InsuredCost = 0
        response.Service[0].ServiceCost.VATApplied = 0
        response.Service[0].ServiceCost.ContingencyChargeListPrice = 0
        response.Service[0].ServiceCost.SpecialHandlingListPrice = 0
        response.Service[0].TotalAmount = parseFloat((response.Service[0].ServiceCost.ListPrice + response.Service[0].ServiceCost.FuelChargeListPrice).toFixed(2))
      }
    }
    response = services
  } else {
    return res.sendStatus(404)
  }
  return res.status(200).send(response)
})

export default router
