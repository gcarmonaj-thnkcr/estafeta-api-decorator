import { Router, Request, Response } from "express";
import { apiRoot } from "../../commercetools/client";

const router = Router()

router.get("/ordersExpired/:idCustomer", async (req: Request, res: Response): Promise<any> => {
  const idCustomer = req.params.idCustomer
  if(!idCustomer) return res.status(400).send({ message: 'idCustomer is required' })
  const orders = await apiRoot.orders().get({
    queryArgs: {
      where: `custom(fields(isExpired=true)) and customerId in ("${idCustomer}")`
    }
  }).execute()
  if(!orders.statusCode || orders.statusCode >= 300) return res.sendStatus(404)
  return res.status(200).send({
    message: '',
    ordersToExpired: orders.body?.total ?? 0
  })
})

router.post("/payment/webhook", async (req: Request, res: Response): Promise<any> => {
  console.log(req.body)
  return res.sendStatus(200)
})

router.post("/orders/pull", async (req: Request, res: Response): Promise<any> => {
  // Post to recive a PUSH notification from estafeta API process
  console.log(req.body)
  return res.sendStatus(200)
})

export default router
