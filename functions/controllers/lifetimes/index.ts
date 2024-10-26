import { Router, Request, Response } from "express";
import { validateToken } from "../../jsonToken/token";
import { apiRoot } from "../../commercetools/client";
import { Order } from "@commercetools/platform-sdk";
import { checkDate } from "../../validateDate/validate";

const router = Router()

interface IOrderToNotify {
  emailClient: string;
  clientName: string;
  folios: string;
  expirationDate: string;
  expirationDays: number;
}

const orderstoNotify: IOrderToNotify[] = [];

const addObject = async (index: any, order: Order, days: number) => {
  try{ 
    const customer = await apiRoot.customers().withId({ID: order.customerId ?? ""}).get().execute()
    if(!customer.statusCode || customer.statusCode >= 300) return 

    const products = []
    for(const item of order.lineItems){
      products.push(`(${item.quantity})${item.name["es-MX"]}`) 
    }
    const date = new Date(order.createdAt)
    date.setDate(date.getDate() + 426)
    
    const opciones = { year: 'numeric', month: 'long', day: 'numeric' };

    // Formatear la fecha 
    // @ts-ignore
    const fechaFormateada = date.toLocaleDateString('es-ES', opciones);
    console.log('Formated date: ',fechaFormateada)
    
    orderstoNotify.push({
      emailClient: customer.body.email,
      clientName: (customer.body?.firstName ?? "") + (customer.body?.lastName ?? "") + (customer.body?.middleName ?? ""),
      folios: products.join(","),
      expirationDate: fechaFormateada,
      expirationDays: days
    });
  } catch(err: any){
    console.log(err.message)
    return 
  }
}

router.get("/lifetimes", validateToken, async (req: Request, res: Response): Promise<any> => {
    const endDate = req.headers.date
    const orders = await apiRoot.orders().get({
      queryArgs: {
        limit: 500,
        sort: "createdAt desc",
        where: 'custom(fields(type-order="service"))',
      }
    }).execute()
    
    if(orders.body.results.length <= 0) return res.sendStatus(204)
    console.log('Orders: ', orders.body.results.length)

    //@ts-ignore
    const ordersCombo = orders.body.results.filter(order => order.lineItems.some(item => item.variant?.attributes.some(attr => attr.name == "tipo-paquete" && attr.value["label"] == "UNIZONA")))

    
    for(const order of ordersCombo) {
      const daysDif = checkDate(order.createdAt, endDate)
      console.log('Days diference: ', daysDif)
      switch(daysDif) {
        case 365: 
          await apiRoot.orders().withId({ ID: order.id}).post({
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
          await addObject(daysDif, order, 90)          
        break;
        case 395: 
          await addObject(daysDif, order, 30)          
        break;
        case 411: 
          await addObject(daysDif, order,15)          
        break; 
        case 417: 
          await addObject(daysDif, order, 7)          
        break;
        case 424: 
          await addObject(daysDif, order, 1)          
        break;
      }
    }    

    return res.status(200).send ({
        statusCode: 200,
        body: orderstoNotify,
    });
});

export default router
