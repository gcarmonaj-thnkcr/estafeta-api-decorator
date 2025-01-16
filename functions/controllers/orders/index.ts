import { Router, Request, Response } from "express";
import { apiRoot } from "../../commercetools/client";

const router = Router()

router.get("/ordersExpired/:idCustomer", async (req: Request, res: Response): Promise<any> => {
  let countGuides = 0
  const idCustomer = req.params.idCustomer
  if(!idCustomer) return res.status(400).send({ message: 'idCustomer is required' })
  const orders = await apiRoot.orders().get({
    queryArgs: {
      where: `custom(fields(isExpired=true)) and customerId in ("${idCustomer}")`
    }
  }).execute()
  if(!orders.statusCode || orders.statusCode >= 300) return res.sendStatus(404)
  for(const order of orders.body.results){
    const services = JSON.parse(order.custom?.fields["services"])
    if(!services) continue
    for (const key in services) {
      const service = services[key] || {}
      countGuides = countGuides + services[key].guides.length
    }
  }
  return res.status(200).send({
    message: '',
    ordersToExpired: countGuides
  })
})

router.post("/payment/webhook", async (req: Request, res: Response): Promise<any> => {
  console.log(req.body)
  return res.sendStatus(200)
})

export default router
