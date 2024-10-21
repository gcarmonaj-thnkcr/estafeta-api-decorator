import { Router, Request, Response } from "express"
import { ITransactionEvent } from "../../interfaces/payment"
import { addPaymentToOrder } from "../../utils/addPayment"

const router = Router()

router.post("/payment/webhook", async (req: Request, res: Response): Promise<any> => {
  try{
    console.log("llegue")
    const paymentInfo: ITransactionEvent = req.body
    console.log(paymentInfo.transaction)
    if(paymentInfo.transaction.status != "completed") return res.sendStatus(400)
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

export default router
