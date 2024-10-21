import { Router, Request, Response } from "express"
import { ITransactionEvent } from "../../interfaces/payment"
import { addPaymentToOrder } from "../../utils/addPayment"

const router = Router()

router.post("/payment/webhook", async (req: Request, res: Response): Promise<any> => {
    console.log(req.body)
    const paymentInfo: ITransactionEvent = req.body
    if(paymentInfo.transaction.status != "completed") return res.sendStatus(400)
    const responsePayment = await addPaymentToOrder(paymentInfo)   
    if(responsePayment.message) {
      console.log(responsePayment)
      return res.sendStatus(500)
    }
    return res.sendStatus(200)  
})

export default router
