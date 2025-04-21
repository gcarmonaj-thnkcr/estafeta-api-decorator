import { Request, Response, Router } from  'express'
import { createReport } from '../../utils/createReport'

const router = Router()

router.post("/report", async (req: Request, res: Response): Promise<any> => {
  const { dateStart, dateEnd } = req.body
  if(!dateStart || !dateEnd) return res.status(400).send({
    message: "Proporciona una fecha inicial o una fecha fin para el reporte"
  })
  const report = await createReport(dateStart, dateEnd)
  if(report.status >= 300) {
    return res.status(report.status).send({message: report.message})
  }
  if(!report.data) {
    return res.status(report.status).send({message: report.message})
  }
  const buffer = await report.data.xlsx.writeBuffer();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="reporte.xlsx"');
  res.end(Buffer.from(buffer));
})

export default router

