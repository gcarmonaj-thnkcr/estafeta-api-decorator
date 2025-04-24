import { Request, Response, Router } from  'express'
import { createReport } from '../../utils/createReport'

const router = Router()

router.post("/report", async (req: Request, res: Response): Promise<any> => {
  const { dateStart, dateEnd } = req.body
  if(!dateStart || !dateEnd) return res.status(400).send({
    message: "Proporciona una fecha inicial o una fecha fin para el reporte"
  })
  try{
    const report = await createReport(dateStart, dateEnd)
    if(report.status >= 300) {
      return res.status(report.status).send({message: report.message})
    }
    if(!report.data) {
      return res.status(report.status).send({message: report.message})
    }
    res.writeHead(200, {
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': 'attachment; filename="reporte.xlsx"',
    'Cache-Control': 'no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
    });
    await report.data.xlsx.write(res);
  
  return res.end();
  } catch(err: any) {
    console.error('Error en generación de reporte:', err);
    return res.status(500).send({
      message: "Error interno al generar el archivo Excel"
    });
  }
})

export default router

