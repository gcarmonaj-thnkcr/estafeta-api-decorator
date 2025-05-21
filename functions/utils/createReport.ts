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

  const addOneDay = new Date(convertDateEnd)
  addOneDay.setDate(addOneDay.getDate() + 1)
  const convertDateEndPlusOne = addOneDay.toISOString()

  const orders: Order[] = []

  const queryOrder = await apiRoot.orders().get({
    queryArgs: {
      expand: "paymentInfo.payments[*]",
      offset: 0,
      limit: 500,
      sort: "createdAt desc",
      where:  `createdAt >= "${convertDateState}" and createdAt <= "${convertDateEndPlusOne}"`
    }
  }).execute()


  if(!queryOrder.statusCode || queryOrder.statusCode >= 300) return { status: queryOrder?.statusCode ?? 404, message: "Orders not found" }
  if(queryOrder.body.results.length <= 0) return { status: 404, message: "Orders not found" }

  orders.push(...queryOrder.body.results)
  let offset = 500
  let hasNext = true

  while(hasNext){
    const queryOrder = await apiRoot.orders().get({
      queryArgs: {
        expand: "paymentInfo.payments[*]",
        offset: offset,
        limit: 500,
        sort: "createdAt desc",
        where:  `createdAt >= "${convertDateState}" and createdAt <= "${convertDateEndPlusOne}"`
      }
    }).execute()
    if(!queryOrder.statusCode || queryOrder.statusCode >= 300) return { status: queryOrder?.statusCode ?? 404, message: "Orders not found" }
    if(queryOrder.body.results.length <= 0) hasNext = false
    orders.push(...queryOrder.body.results)
    offset += 500
    if(offset >= 10000) hasNext = false
    console.log("offset", offset)
  }
  
  console.log("orders length", orders.length)

  const workBookFormat = await processOrdersInBatches(orders, 10)
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
    { header: 'Motor de Pago', key: 'motorPago', width: 32 },
    { header: 'Total a Pagar', key: 'totalAmount', width: 32 },
  ];

  for(const order of orders){
    const customer = await apiRoot.customers().withId({ID: order?.customerId ?? ""}).get().execute()

    const quantityItems = order.lineItems.reduce((acc, item) => acc + item.quantity, 0)
    workSheet.addRow({
      orderNumber: order?.orderNumber ?? "", 
      customerName: `${customer.body.firstName} ${customer?.body?.lastName ?? ""}`,
      ordersLines: order.lineItems.length,
      totalItems: quantityItems,
      paymentStatus: order.paymentState,
      shipmentStatus: order?.shipmentState ?? "",
      email: customer.body.email,
      dateCreated: order.createdAt,
      dateModified: order.lastModifiedAt,
      transactionId: order.paymentInfo?.payments[0].obj?.interfaceId ?? "",
      motorPago: order.paymentInfo?.payments[0].obj?.paymentMethodInfo.paymentInterface,
      totalAmount: order.totalPrice.centAmount / 100
    })
  }

  return workBook
}


async function processOrdersInBatches(orders: Order[], batchSize = 10) {
  const batches = [];

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
    { header: 'Motor de Pago', key: 'motorPago', width: 32 },
    { header: 'Total a Pagar', key: 'totalAmount', width: 32 },
  ];
  
  for (let i = 0; i < orders.length; i += batchSize) {
    batches.push(orders.slice(i, i + batchSize));
  }
  console.log("batches", batches)
  for (const batch of batches) {
    console.log(batch)
    const customerPromises = batch.map(order => 
      apiRoot.customers().withId({ID: order?.customerId ?? ""}).get().execute()
        .catch(() => ({ body: { firstName: '', lastName: '', email: '' } }))
    );
    
    const customers = await Promise.all(customerPromises);
    

    batch.forEach((order, index) => {
      console.log(order.id)
      const customer = customers[index];
      const quantityItems = order.lineItems.reduce((acc, item) => acc + item.quantity, 0);
      workSheet.addRow({
        orderNumber: order?.orderNumber ?? "", 
        customerName: `${customer.body.firstName} ${customer?.body?.lastName ?? ""}`,
        ordersLines: order.lineItems.length,
        totalItems: quantityItems,
        paymentStatus: order.paymentState,
        shipmentStatus: order?.shipmentState ?? "",
        email: customer.body.email,
        dateCreated: order.createdAt,
        dateModified: order.lastModifiedAt,
        transactionId: order.paymentInfo?.payments[0].obj?.interfaceId ?? "",
        motorPago: order.paymentInfo?.payments[0].obj?.paymentMethodInfo.paymentInterface,
        totalAmount: order.totalPrice.centAmount / 100
      });
    });
  }

  return workBook
}
