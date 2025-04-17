import ExcelJs from 'exceljs'
import { Order } from "@commercetools/platform-sdk";
import { apiRoot } from "../commercetools/client";

interface IResponse {
  status: number;
  message: string;
  data?: ExcelJs.Workbook
}

export const createReport = async (dateState: string, dateEnd: string): Promise<IResponse> => {
  const convertDateState = new Date(dateState).toISOString()
  const convertDateEnd = new Date(dateEnd).toISOString()
  console.log(convertDateEnd, convertDateState)
  const orders = await apiRoot.orders().get({
    queryArgs: {
      expand: "paymentInfo.payments[*]",
      limit: 500,
      sort: "createdAt desc",
      where:  `createdAt >= "${convertDateState}" and createdAt <= "${convertDateEnd}"`
    }
  }).execute()
  if(!orders.statusCode || orders.statusCode >= 300) return { status: orders?.statusCode ?? 404, message: "Orders not found" }
  if(orders.body.results.length <= 0) return { status: 404, message: "Orders not found" }
  const workBookFormat = await mapReportExcel(orders.body.results)
  return {
    status: 200,
    message: "",
    data: workBookFormat
  }
} 

const mapReportExcel = async(orders: Order[]) => {
  const workBook = new ExcelJs.Workbook()
  const workSheet = workBook.addWorksheet("Reporte")

  workSheet.columns = [
    { header: 'Order Number', key: 'orderNumber', width: 10 },
    { header: 'Customer Name', key: 'customerName', width: 32 },
    { header: 'No of Order lines', key: 'ordersLines', width: 32 },
    { header: 'Total Quantity of Items', key: 'totalItems', width: 32 },
    { header: 'Payment Status', key: 'paymentStatus', width: 32 },
    { header: 'Shipment Status', key: 'shipmentStatus', width: 32 },
    { header: 'Email', key: 'email', width: 32 },
    { header: 'Date Created', key: 'dateCreated', width: 32 },
    { header: 'Date Modified', key: 'dateModified', width: 32 },
    { header: 'Transaction Id', key: 'transactionId', width: 32 },
  ];

  for(const order of orders){
    const customer = await apiRoot.customers().withId({ID: order?.customerId ?? ""}).get().execute()

    const quantityItems = order.lineItems.reduce((acc, item) => acc + item.quantity, 0)
    workSheet.addRow({
      orderNumber: order?.orderNumber ?? "", 
      customerName: `${customer.body.firstName} ${customer.body.lastName}`,
      ordersLines: order.lineItems.length,
      totalItems: quantityItems,
      paymentStatus: order.paymentState,
      shipmentStatus: order.shipmentState,
      email: customer.body.email,
      dateCreated: order.createdAt,
      dateModified: order.lastModifiedAt,
      transactionId: order.paymentInfo?.payments[0].obj?.interfaceId
    })
  }

  return workBook
}
