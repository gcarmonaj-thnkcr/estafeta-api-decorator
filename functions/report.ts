import { createReport } from './utils/createReport';

export async function handler(event: any) {
  try {
    const { dateStart, dateEnd } = JSON.parse(event.body || '{}');

    if (!dateStart || !dateEnd) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Fechas requeridas" })
      };
    }

    const report = await createReport(dateStart, dateEnd);
    if (report.status >= 300 || !report.data) {
      return {
        statusCode: report.status,
        body: JSON.stringify({ message: report.message })
      };
    }

    const buffer = await report.data.xlsx.writeBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="reporte.xlsx"',
      },
      body: base64,
      isBase64Encoded: true
    };
  } catch (err) {
    console.error("Error al generar Excel:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error interno" })
    };
  }
}
