import { Router, Request, Response } from "express";
import { reprocessPayment } from "../../utils/reprocessPayment";

const router = Router()

router.post("/reprocess", async (req: Request, res: Response): Promise<any> => {
  const { id } = req.body
  const reprocess = await reprocessPayment(id)
  return res.status(reprocess.status).send({
    body: reprocess.response
  })
})

export default router
