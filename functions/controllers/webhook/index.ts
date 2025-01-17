import { Router, Request, Response } from "express"
import { ITransactionEvent } from "../../interfaces/payment"
import { addPaymentToOrder } from "../../utils/addPayment"
import { IPushTrackingRequest } from "../../interfaces/pushtracking"

const router = Router()

router.post("/payment/webhook", async (req: Request, res: Response): Promise<any> => {
  try{
    console.log(req)
    console.log(req.body)
    return res.status(200)
    const paymentInfo: ITransactionEvent = req.body
    console.log(paymentInfo.transaction)
    if(paymentInfo.transaction.status != "completed") return res.sendStatus(200)
    const responsePayment = await addPaymentToOrder(paymentInfo)   
    if(responsePayment.message) {
      console.log(responsePayment)

      return res.sendStatus(500)
    }
    return res.sendStatus(200)
  } catch(err: any) {
    return res.status(500).send({message: err.message})
  }
})

router.post("/waybills/webhook", async (req: Request, res: Response): Promise<any> => {
  // Post to recive a PUSH notification from estafeta API process
  console.log(req.body)
  const pushTrackingRequest: IPushTrackingRequest = req.body

  // ToDo: Implement the logic to update the waybill status
  return res.sendStatus(200)
})

export default router
