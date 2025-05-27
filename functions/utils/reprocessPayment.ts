import { Cart, Customer, Order } from "@commercetools/platform-sdk";
import { apiRoot } from "../commercetools/client";
import { WSPurchaseOrder } from "../estafetaAPI/purchaseOrder";
import { CreateFolios } from "../estafetaAPI/folios";
import { createMapGuide } from "./addPayment";
import { asignGuideToOrder } from "./asignarGuides";
import { logger } from "./logger";
import { getChargeByTransactionId } from "../openpay/charges";
import { Transaction } from "../interfaces/openpay";

interface IResponse {
  status: number;
  response: any;
}

export const reprocessPayment = async (idCart: string, transactionId: string): Promise<IResponse> => {
  const log = logger.child({requestId: transactionId})
  if(!idCart || idCart == "") return { response: "IdCart undefined", status: 500 }   
  let getCart = await apiRoot.carts().withId({ ID: idCart }).get().execute()
  if(!getCart.statusCode || getCart.statusCode >= 300) return { response: 'Cart not found', status: 404 }
  const customer = await apiRoot.customers().withId({ ID: getCart.body?.customerId ?? "" }).get().execute()
  if(!customer.statusCode || customer.statusCode >= 300) return { response: 'Customer not found', status: 404 }
  if(!getCart.body.shippingAddress) {
    getCart = await apiRoot.carts().withId({ ID: idCart }).post({
      body: {
        version: getCart.body.version,
        actions: [
          {
            action: 'setShippingAddress',
            address: customer.body.addresses[0]
          }
        ]
      }
    }).execute() 
  }
  const isRecoleccion = getCart.body.lineItems.some(item => item.variant.attributes?.find(attr => attr.name == "tipo-paquete")?.value["label"] == "RECOLECCION")
  let response: any 
  log.info("-----------------")
  log.info("Iniciando proceso")
  log.info(`cart ${getCart.body.id}`)
  if(isRecoleccion) {

  } else {
    response = await addPaymentToOrders(getCart.body, customer.body, transactionId)
    if(response?.message != "") return { response: response?.message, status: 500 }
  }
  return { response: response.orderId, status: 200 }
}

const generateId = (longitud: number = 20) => {
  const caracteres = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < longitud; i++) {
    id += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return id;
}

export const addPaymentToOrders = async (cart: Cart, customer: Customer, transactionId: string) => {
  const loggerC = logger.child({requestId: transactionId})
  const quantityTotalGuides = 0
  let versionCart = cart.version
  const orders = await apiRoot.orders().get({
    queryArgs: {
      sort: `createdAt desc`,
      where: `orderNumber is defined`
    }
  }).execute()
  if (!orders.body.results[0].orderNumber) return
  const orderSplit = orders.body.results[0].orderNumber.split('D')
  let newOrder = `${orderSplit[0]}D${String(parseInt(orderSplit[1]) + 1).padStart(6, "0")}`
  const isZONA = cart.lineItems.some(item => item.variant.attributes?.find(attr => attr.name == "tipo-paquete")?.value["label"] == "ZONA")
  const isUNIZONA = cart.lineItems.some(item => item.variant.attributes?.find(attr => attr.name == "tipo-paquete")?.value["label"] == "UNIZONA")
  const isInternational = cart.lineItems.some(item => item.variant.attributes?.find(attr => attr.name == "tipo-paquete")?.value["label"] == "ZONA INTERNACIONAL")
  console.log("Registrando pago en ct")
  const payments = await apiRoot.payments().get({
    queryArgs: {
      where: `key in ("${transactionId}")`
    }
  }).execute()
  let idPayment = payments.body.results.length <= 0 ? "" : payments.body.results[0].id
  let idTransaction = transactionId
  if(payments.body.results.length <=0){
    idTransaction = generateId()
    const createPayment = await apiRoot.payments().post({
      body: {
        key: idTransaction,
        interfaceId: idTransaction,
        amountPlanned: {
          currencyCode: "MXN",
          centAmount:  cart.totalPrice.centAmount | 0
        },
        paymentMethodInfo: {
          paymentInterface: "OPENPAY",
          method: "Tarjeta",
          name: {
            "es-MX": "Tarjeta de Crédito"
          }
        },
        transactions: [
          {
            interactionId: idTransaction,
            type: "Charge",
            amount: {
            currencyCode: "MXN",
              centAmount: cart.totalPrice.centAmount | 0,
            },
            state: "Success"
          }
        ]
      }
    }).execute()
    idPayment = createPayment.body.id
  }
  
  console.log("Pago registrado", idPayment) 
  const { card }: Transaction = await getChargeByTransactionId(transactionId)
  let transactionalCode = "OBA-04"

  if(card.brand != "Aplazo" || card.brand != "Aplazo") {
    switch (card.type) {
      case "credit": 
        transactionalCode = `OBA${card.card_number.slice(-4)}-04`
      break;
      case "debit":
        transactionalCode = `OBA${card.card_number.slice(-4)}-28`
      break;
      default: 
        transactionalCode = `AME${card.card_number.slice(-4)}-04`
      break
    }
  }
  const createPurchaseOrder = async (): Promise<any> => {
    const purchaseOrder = await WSPurchaseOrder(
      { 
        order: cart, 
        code: newOrder, 
        idPaymentService: idPayment, 
        methodName: "Openpay", 
        customer, 
        quantityTotalGuides, 
        infoPayment: {
          typePayment: card.type,
          bankTypeName: card.brand.toUpperCase(),
          transactionalCode: transactionalCode
        },
        logger: loggerC
      })
    
    if (purchaseOrder.result.Code > 0) {
      if (purchaseOrder.result.Description.includes("REPEATED_TICKET")) {
        const orderSplit = newOrder.split('D')
        newOrder = `${orderSplit[0]}D${String(parseInt(orderSplit[1]) + 1).padStart(6, "0")}`
        return await createPurchaseOrder();
      }
      return {
        purchaseOrder: undefined,
        orderId: '',
        message: purchaseOrder.result.Description
      }
    }
    return {
      purchaseOrder: purchaseOrder,
      orderId: '',
      message: purchaseOrder.result.Description
    }
  }
  console.log("Insertando en purchase")
  const purchaseResult = await createPurchaseOrder()
  
  if (!purchaseResult.purchaseOrder) return {
    message: purchaseResult.message,
    orderId: "",
    isRecoleccion: false,
    isUso: false

  }
  console.log("Purchase registrado")
  const purchaseOrder = purchaseResult.purchaseOrder

  const codes = purchaseOrder.resultPurchaseOrder
  let mapGuides: any
  if (codes?.[0]?.WaybillList?.length > 0) {
    const folios = await CreateFolios(codes?.[0]?.WaybillList?.length, loggerC)
    mapGuides = createMapGuide(codes, cart, folios.data.folioResult)
  }

  console.log("Folios registrados", mapGuides)

  // const setGuidesLines = await apiRoot.carts().withId({ ID: cart.body.id }).post({
  //   body: {
  //     version: versionCart,
  //     actions: [
  //       {
  //         action: "setLineItemCustomField",
  //         lineItemId: cart.body.lineItems.find(item => item.variant.attributes?.find(attr => attr.name == "tipo-paquete")?.value["label"] == "ZONA" || item.variant.attributes?.find(attr => attr.name == "tipo-paquete")?.value["label"] == "UNIZONA")?.id,
  //         name: "guia",
  //         value: JSON.stringify({codes})
  //       }
  //     ]
  //   }
  // }).execute()
  const userUpdated = await apiRoot.customers().get({
    queryArgs: {
      where: `email in ("${customer.email}")`
    }
  }).execute()
  let versionCustomer = userUpdated.body.results[0].version
  let objectCustomer = userUpdated.body.results[0]
  console.log("Actualizando info de usuario")
  //Esto es para agregar items
  for (const line of cart.lineItems) {
    const attrType = line.variant.attributes?.find(item => item.name == "tipo-paquete")?.value["label"]
    if (attrType != "UNIZONA") continue
    const attrQuantity = line.variant.attributes?.find(item => item.name == "quantity-items")?.value ?? 1
    const attrService = line.variant.attributes?.find(item => item.name == "servicio")?.value["label"]
    debugger
    if (attrService == "DIA SIGUIENTE") {
      const quantityGuideAvailables = objectCustomer.custom?.fields?.["quantity-guides-dia-siguiente"] ?? 0
      const updateQuantityUser = await apiRoot.customers().withId({ ID: customer.id }).post({
        body: {
          version: versionCustomer,
          actions: [
            {
              action: "setCustomField",
              name: "quantity-guides-dia-siguiente",
              value: quantityGuideAvailables  + (attrQuantity * line.quantity)
            }
          ]
        }
      }).execute()
      versionCustomer = updateQuantityUser.body.version
      objectCustomer = updateQuantityUser.body
    }
    else if (attrService == "TERRESTRE") {
      const quantityGuideAvailables = objectCustomer.custom?.fields?.["quantity-guides-terrestres"] ?? 0
      const updateQuantityUser = await apiRoot.customers().withId({ ID: customer.id }).post({
        body: {
          version: versionCustomer,
          actions: [
            {
              action: "setCustomField",
              name: "quantity-guides-terrestres",
              value: quantityGuideAvailables + (attrQuantity * line.quantity)
            }
          ]
        }
      }).execute()
      versionCustomer = updateQuantityUser.body.version
      objectCustomer = updateQuantityUser.body
    }
    else if (attrService == "DOS DIAS") {
      const quantityGuideAvailables = objectCustomer.custom?.fields?.["quantity-guides-dos-dias"] ?? 0
      const updateQuantityUser = await apiRoot.customers().withId({ ID: customer.id }).post({
        body: {
          version: versionCustomer,
          actions: [
            {
              action: "setCustomField",
              name: "quantity-guides-dos-dias",
              value: quantityGuideAvailables + (attrQuantity * line.quantity)
            }
          ]
        }
      }).execute()
      versionCustomer = updateQuantityUser.body.version
      objectCustomer = updateQuantityUser.body
    }

    else if (attrService == "12:30") {
      const quantityGuideAvailables = objectCustomer.custom?.fields?.["quantity-guides-doce-treinta"] ?? 0
      const updateQuantityUser = await apiRoot.customers().withId({ ID: customer.id }).post({
        body: {
          version: versionCustomer,
          actions: [
            {
              action: "setCustomField",
              name: "quantity-guides-doce-treinta",
              value: quantityGuideAvailables  + (attrQuantity * line.quantity)
            }
          ]
        }
      }).execute()
      versionCustomer = updateQuantityUser.body.version
      objectCustomer = updateQuantityUser.body
    }
  }

  let order: Order = {} as Order 
  console.log("Creando orden")
  if (isUNIZONA || isZONA || isInternational) {
    const mapToObject = (map: Map<any, any>) => {
      const obj: any = {};
      for (let [key, value] of map) {
        obj[key] = value;
      }
      return obj;
    };

    const plainObjectGuides = mapToObject(mapGuides);

    const createOrder = await apiRoot.orders().post({
      body: {
        version: versionCart,
        id: cart.id,
        orderNumber: newOrder,
        custom: {
          type: {
            typeId: 'type',
            key: "type-order"
          },
          fields: {
            "type-order": "service",
            "services": JSON.stringify(plainObjectGuides),
            "ordenSap": codes[0].OrderSAP,
            "isCombo": isUNIZONA ? true : false,
            "invoice": "No Facturada"
          }
        }
      }
    }).execute()

    order = createOrder.body
  } else {
    const asignarGuias = await asignGuideToOrder(customer, cart)
    const createOrder = await apiRoot.orders().post({
      body: {
        version: versionCart,
        id: cart.id,
        orderNumber: newOrder,
        custom: {
          type: {
            typeId: 'type',
            key: "type-order"
          },
          fields: {
            "services": JSON.stringify(asignarGuias),
            "ordenSap": codes?.[0]?.OrderSAP ?? "",
            "type-order": "bundle",
            "invoice": "No Facturada"
          }
        }
      }
    }).execute()
    order = createOrder.body
  }
  console.log("Anexando pago a orden", order.orderNumber)

  const addPaymentToOrder = await apiRoot.orders().withId({ ID: order.id }).post({
    body: {
      version: order.version,
      actions: [
        {
          action: "addPayment",
          payment: {
            id: idPayment,
            typeId: "payment"
          }
        },
        {
          action: "changePaymentState",
          paymentState: "Paid"
        }
      ]
    }
  }).execute()
  
  console.log("Proceso terminado")
  return {
    orderId: addPaymentToOrder.body.id,
    message: "",
    isUso: false,
    isRecoleccion: false,
  }
}
