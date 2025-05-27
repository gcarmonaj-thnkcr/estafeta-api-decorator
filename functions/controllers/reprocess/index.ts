import { Router, Request, Response } from "express";
import { reprocessPayment } from "../../utils/reprocessPayment";

const router = Router()

router.post("/reprocess", async (req: Request, res: Response): Promise<any> => {
  const { id, transactionId } = req.body
  const reprocess = await reprocessPayment(id, transactionId)
  return res.status(reprocess.status).send({
    body: reprocess.response
  })
})

export default router
