import { Router, type Request, type Response } from "express";
import { handleCotizacion } from "../../estafetaAPI/quote";
import { Quotation } from "../../interfaces/quotes";
import { argv0 } from "process";

const router = Router()

router.post("/quote", async(req: Request, res: Response): Promise<any> => {
  let response 
  console.log(req.body.type)
  if(req.body.type == "nacional") {
    const services= await handleCotizacion(req.body)
    if(!req.body.IsRecoleccion) {
      for(const service of services.Quotation[0].Service) {
        service.TotalAmount = parseFloat((service.ListPrice + service['FuelChargeListPrice ']).toFixed(2));
      }
    }
    response = services

  } else if (req.body.type == "unizona"){
    const services = await handleCotizacion(req.body)
    if(req.body.IsRecoleccion) {
      for(const service of services.Quotation[0].Service) {
        console.log(service.ListPrice)
        console.log(service)
        service.TotalAmount = parseFloat((service?.OverweightListPrice! + service?.FuelChargeOverweightListPrice! + service.InsuredCost).toFixed(2));
      }
    }
    else {
      for(const service of services.Quotation[0].Service) {
        service.FuelChargeOverweightListPrice = 0
        service.InsuredCost = 0
        service.OverweightListPrice = 0
        service.FuelChargeListPrice = 0
        service.ListPrice = 0
        service['FuelChargeListPrice '] = 0
        service.TotalAmount = 0;
      }
    }
    response = services
  } else if(req.body.type == "internacional") {

  } else {
    return res.sendStatus(404)
  }
  return res.status(200).send(response)
})

export default router
