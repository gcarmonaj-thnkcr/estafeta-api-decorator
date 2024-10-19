import { Router, Request, Response } from "express"

const router = Router()

router.post("/payment/webhook", async (req: Request, res: Response): Promise<any> => {
    console.log(req.body)
    return res.sendStatus(200)  
})

export default router