import { Router, type Request, type Response } from "express";
import { handleCotizacion } from "../../estafetaAPI/quote";
import { Quotation } from "../../interfaces/quotes";

const router = Router()

router.post("/quote", async(req: Request, res: Response): Promise<any> => {
  let response 
  console.log(req.body)
  if(req.body.type == "nacional") {
    const services= await handleCotizacion(req.body)
    if(!req.body.IsRecoleccion) {
      for(const service of services.Quotation[0].Service) {
        console.log(service.ListPrice)
        console.log(service)
        service.TotalAmount = parseFloat((service.ListPrice + service['FuelChargeListPrice ']).toFixed(2));
      }
    }
    response = services
  } else if (req.body.type == "unizona"){

  } else if(req.body.type == "internacional") {

  } else {
    return res.sendStatus(404)
  }
  return res.status(200).send(response)
})

export default router
