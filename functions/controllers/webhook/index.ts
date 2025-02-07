import { Router, Request, Response } from "express"
import { ITransactionEvent } from "../../interfaces/payment"
import { addPaymentToOrder } from "../../utils/addPayment"
import { IPushTrackingRequest } from "../../interfaces/pushtracking"

const router = Router()

router.post("/payment/webhook", async (req: Request, res: Response): Promise<any> => {
  try{
    
    const paymentInfo: ITransactionEvent = req.body
    if(paymentInfo.transaction.status != "completed") return res.sendStatus(200)
    if(paymentInfo.transaction.method == "card") return res.sendStatus(200)
    console.log("------------------------")
    console.log(`Openpay webhook body: ${paymentInfo.transaction.id}`)
    console.log("Pagado")
    const responsePayment = await addPaymentToOrder(paymentInfo)   
    if(responsePayment.message) {
      console.log(responsePayment)

      return res.sendStatus(500)
    }
    console.log("Proceso culminado")
    console.log("------------------------")
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
