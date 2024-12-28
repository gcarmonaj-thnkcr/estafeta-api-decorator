import { Router, Request, Response } from "express";
import { validateToken } from "../../jsonToken/token";
import { apiRoot } from "../../commercetools/client";
import { Order } from "@commercetools/platform-sdk";
import { checkDate } from "../../validateDate/validate";
import { Console } from "console";
import { off } from "process";

const router = Router()

interface IOrderToNotify {
  emailClient: string;
  clientName: string;
  folios: string;
  expirationDate: string;
  expirationDays: number;
}

let orderstoNotify: IOrderToNotify[] = [];

const addObject = async (index: any, order: Order, days: number, daysDif: number) => {
  try {
    const customer = await apiRoot.customers().withId({ ID: order.customerId ?? "" }).get().execute()
    if (!customer.statusCode || customer.statusCode >= 300) return

    const products = []
    for (const item of order.lineItems) {
      console.log(`${item.name["es-MX"] ?? item.name["en"]} `)
      products.push(`(${item.quantity})${item.name["es-MX"] ?? item.name["en"]} ${item.variant.attributes?.find(item => item.name == "servicio")?.value["key"].replace('-', " ")}`)
    }

    const date = new Date(order.createdAt)
    date.setDate(date.getDate() + 455)

    const opciones = { year: 'numeric', month: 'long', day: 'numeric' };

    // Formatear la fecha 
    // @ts-ignore
    const fechaFormateada = date.toLocaleDateString('es-ES', opciones);
    console.log("Formated date: ", fechaFormateada)

    orderstoNotify.push({
      emailClient: customer.body.email,
      clientName: (customer.body?.firstName ?? "") + (customer.body?.lastName ?? "") + (customer.body?.middleName ?? ""),
      folios: products.join(","),
      expirationDate: fechaFormateada,
      expirationDays: days
    });
  } catch (err: any) {
    console.log(err.message)
    return
  }
}

router.get("/lifetimes", validateToken, async (req: Request, res: Response): Promise<any> => {
  console.log("Lifetimes called")
  let orders: Order[] = []
  const endDate = req.headers.date
  const limit = parseInt(req.headers.limit as string) || 20
  const offset = parseInt(req.headers.offset as string) || 0

  const orders_bundle = await apiRoot.orders().get({
    queryArgs: {
      limit: limit,
      offset: offset,
      sort: "createdAt desc",
      where: 'custom(fields(isCombo=true)) and createdAt >= "2023-10-26T00:00:00Z"',
    }
  }).execute()
  console.log(orders_bundle.body.count, orders_bundle.body.total)
  orders = orders_bundle.body.results

  if (orders_bundle.body.results.length <= 0) return res.sendStatus(204)
  
  console.log("Orders length: ", orders_bundle.body.results.length)

  const order_count = (orders_bundle.body.total ?? 0) - 500
  /*
  console.log("Order count: ", order_count)
  for (let i = 501; i < order_count; i += 500) {
    console.log("Offset: ", i)
    const orders_bundle = await apiRoot.orders().get({
      queryArgs: {
        limit: 500,
        offset: i,
        sort: "createdAt desc",
        where: 'custom(fields(type-order="service"))',
      }
    }).execute()
    if (orders_bundle.body.results.length <= 0) return res.sendStatus(204)
    orders = [...orders, ...orders_bundle.body.results]
  }
  */

  console.log("Orders: ", orders.length)
  //@ts-ignore
  //const ordersCombo = orders.filter(order => order.lineItems.some(item => item.variant?.attributes.some(attr => attr.name == "tipo-paquete" && attr.value["label"] == "UNIZONA")))

  orderstoNotify = []
  console.log(orderstoNotify)
  for (const order of orders) {
    console.log('-----------------')
    console.log(order.customerEmail)
    console.log(order.orderNumber ?? "")
    const daysDif = checkDate(order.createdAt, endDate)
    console.log("Days diference: ", daysDif)
    switch (daysDif) {
      case 365:
        await apiRoot.orders().withId({ ID: order.id }).post({
          body: {
            version: order.version,
            actions: [
              {
                action: 'setCustomField',
                name: 'isExpired',
                value: true,
              }
            ]
          }
        }).execute()
        await addObject(daysDif, order, 90, daysDif)
        break;
      case 425:
        await addObject(daysDif, order, 30, daysDif)
        break;
      // case 442:
      case 440:
        await addObject(daysDif, order, 15, daysDif)
        break;
      case 448:
        await addObject(daysDif, order, 7, daysDif)
        break;
      case 452:
        await addObject(daysDif, order, 1, daysDif)
        break;
    }
  }

  return res.status(200).send({
    limit: limit,
    offset: offset,
    count: orders_bundle.body.count,
    total: orders_bundle.body.total,
    statusCode: 200,
    body: orderstoNotify,
  });
});

export default router
