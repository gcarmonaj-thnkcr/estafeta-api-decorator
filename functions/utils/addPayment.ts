import type { Customer, Order } from "@commercetools/platform-sdk";
import { apiRoot } from "../commercetools/client";
import { ITransactionEvent } from "../interfaces/payment";
import { IMapGuide, IOrderSelected, PickupPackage, PickupRequest } from "../interfaces/pickupModel";
import { getValidityData } from "./validity";
import { newPickUp } from "../estafetaAPI/pickup";
import { WSPurchaseOrder } from "../estafetaAPI/purchaseOrder";
import { CreateFolios } from "../estafetaAPI/folios";
import { ILineGuide, PurchaseOrder } from "../interfaces/purchase";
import { asignGuideToOrder } from "./asignarGuides";

interface IResponse {
  message: string | undefined;
  response: any;
}

export const addPaymentToOrder = async (body: ITransactionEvent): Promise<IResponse> => {
  const order = await apiRoot.orders().withId({ ID: body.transaction.order_id }).get().execute()
  
  if(!order.statusCode || order.statusCode >= 300) return {
    message: "Error al encontrar la orden",
    response: undefined
  }
  
  const customer = await apiRoot.customers().withId({ID: order.body.customerId ?? ""}).get().execute()

  if(!customer.statusCode || customer.statusCode >= 300) return {
    message: "La orden no tiene asignado un customer",
    response: undefined
  }

  const isRecoleccion = order.body.lineItems.some(item => item.variant.attributes?.find(attr => attr.name == "tipo-paquete")?.value["label"] == "RECOLECCION")

  let response: any
  if (isRecoleccion) {
    response = await addPaymentToOrdersRecoleccion(body, order.body, customer.body)
  } else {
    response = await addPaymentToOrders(body, order.body, customer.body)
  }
    
  return {
    message: response.message,
    response
  }
}


export const addPaymentToOrdersRecoleccion = async (data: ITransactionEvent, order: Order, customer: Customer) => {
  let customerCopy = customer
  let orderVersion = order.version
  
  const createPayment = await apiRoot.payments().post({
    body: {
      key: data.transaction.id,
      interfaceId: data.transaction.id,
      amountPlanned: {
        currencyCode: "MXN",
        centAmount: data.transaction.amount * 100 | 0
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
          interactionId: data.transaction.id,
          type: "Charge",
          amount: {
            currencyCode: "MXN",
            centAmount: data.transaction.amount * 100 | 0,
          },
          state: "Success"
        }
      ]
    }
  }).execute()

  const pickupPackage: PickupPackage[] = []
  const mapGuide: IMapGuide  = {}

  const guides: IOrderSelected[] = JSON.parse(order.lineItems[0].custom?.fields["guia"])
  const date = order.lineItems[0].custom?.fields["adicionales"]
  
  for (const guide of guides) {
    // const guide = items.custom?.fields["guia"]
    // const QR = items.custom?.fields["folio_md5"]
    // date = items.custom?.fields["adicionales"]
    const orden = await apiRoot.orders().withId({ ID: guide.orderId }).get().execute()
    const product = orden.body.lineItems.find(item => item.id == guide.id)
    if (!mapGuide[order.lineItems[0].id]) {
      mapGuide[order.lineItems[0].id] = [];
    }
    mapGuide[order.lineItems[0].id].push({
      guide: guide.guia,
      QR: guide.qr,
      isItemDimensionsExceeded: product?.custom?.fields["isItemDimensionsExceeded"],
      isItemWeightExceeded: product?.custom?.fields["isItemWeightExceeded"],
      isPackage: product?.custom?.fields["isPackage"],
      isPudo: product?.custom?.fields["isPudo"],
      itemHeight: product?.custom?.fields["itemHeight"],
      itemLength: product?.custom?.fields["itemLength"],
      itemVolumen: product?.custom?.fields["itemVolumen"],
      itemWeight: product?.custom?.fields["itemWeight"],
      itemWidth: product?.custom?.fields["itemWidth"],
      Recoleccion: product?.custom?.fields["Recoleccion"],
      address: guide.address,
      servicio: guide.typeGuide,
      ...getValidityData(true)
    })

    const servicio = JSON.parse(orden.body.custom?.fields["services"])
    servicio[guide.id].guides = servicio[guide.id].guides.filter((item: any) => item.guide != guide.guia)

    //Actualizamos la orden

    await apiRoot.orders().withId({ ID: guide.orderId }).post({
      body: {
        version: orden.body.version,
        actions: [
          {
            action: "setCustomField",
            name: "services",
            value: JSON.stringify(servicio)
          }
        ]
      }
    }).execute()


    const packagesItems: PickupPackage = {
      PackageType: "PKG",
      Length: 46.5,
      Width: 36.5,
      Height: 40,
      Weight: 8,
      Quantity: 300,
      Description: "PAQUETES"
    }
    pickupPackage.push(packagesItems)
  }

  const newPickUpModel: PickupRequest = {
    AccountNumber: "8605960",
    RequesterName: order.shippingAddress?.firstName ?? "" + order.shippingAddress?.lastName ?? "",
    RequesterEmail: order.shippingAddress?.email ?? "",
    PickupType: "MP",
    PickupDayPart: "PM",
    PickupDate: date,
    PickupAddress: {
      ShortName: "Domicilio",
      Country: "Mexico",
      PostalCode: order.shippingAddress?.postalCode ?? "",
      State: order.shippingAddress?.state ?? "",
      City: order.shippingAddress?.city ?? "",
      Neighborhood: order.shippingAddress?.department ?? "",
      Address1: order.shippingAddress?.streetName ?? "",
      ExternalNumber: order.shippingAddress?.streetNumber ?? "",
      InternalNumber: order.shippingAddress?.apartment ?? "",
      BetweenStreet1: order.shippingAddress?.additionalStreetInfo ?? "",
      ReferenceData: order.shippingAddress?.additionalAddressInfo ?? "",
    },
    PickupAlert_Primary: {
      Name: order.shippingAddress?.firstName ?? "" + order.shippingAddress?.lastName ?? "",
      EmailAddress: order.shippingAddress?.email ?? "",
      PhoneNumber: order.shippingAddress?.phone ?? "",
    },
    PickupPackageList: pickupPackage
  }
  const requestPickup = await newPickUp(newPickUpModel)
  if (!requestPickup.Success) {
    return {
      orderId: "",
      message: requestPickup.ErrorList.join(",")
      ,
      isRecoleccion: false,
      isUso: false
    }
  }


  //Descontamos guias
  let versionCustomer = customer.version
  let quantityGuideAvailablesSiguiente = customerCopy.custom?.fields["quantity-guides-dia-siguiente"]
  let quantityGuideAvailablesTerrestre = customer.custom?.fields["quantity-guides-terrestres"]
  let quantityGuideAvailablesDosDias = customer.custom?.fields["quantity-guides-dos-dias"]
  let quantityGuideAvailablesDoce = customer.custom?.fields["quantity-guides-doce-treinta"]

  for (const guide of guides) {

    if (guide.typeGuide == "DIA SIGUIENTE") {
      quantityGuideAvailablesSiguiente = quantityGuideAvailablesSiguiente - 1
      try {
        const updateQuantityUser = await apiRoot.customers().withId({ ID: customer.id }).post({
          body: {
            version: versionCustomer,
            actions: [
              {
                action: "setCustomField",
                name: "quantity-guides-dia-siguiente",
                value: quantityGuideAvailablesSiguiente
              }
            ]
          }
        }).execute()
        versionCustomer = updateQuantityUser.body.version
      } catch (err: any) {
        console.log(err.message)
      }
    }
    else if (guide.typeGuide == "TERRESTRE") {
      quantityGuideAvailablesTerrestre = quantityGuideAvailablesTerrestre - 1
      try {
        const updateQuantityUser = await apiRoot.customers().withId({ ID: customer.id }).post({
          body: {
            version: versionCustomer,
            actions: [
              {
                action: "setCustomField",
                name: "quantity-guides-terrestres",
                value: quantityGuideAvailablesTerrestre
              }
            ]
          }
        }).execute()
        versionCustomer = updateQuantityUser.body.version
      } catch (err: any) {
        console.log(err.message)
      }
    }
    else if (guide.typeGuide == "DOS DIAS") {
      quantityGuideAvailablesDosDias = quantityGuideAvailablesDosDias - 1
      const updateQuantityUser = await apiRoot.customers().withId({ ID: customer.id }).post({
        body: {
          version: versionCustomer,
          actions: [
            {
              action: "setCustomField",
              name: "quantity-guides-dos-dias",
              value: quantityGuideAvailablesDosDias
            }
          ]
        }
      }).execute()
      versionCustomer = updateQuantityUser.body.version
    }

    else if (guide.typeGuide == "12:30") {
      quantityGuideAvailablesDoce = quantityGuideAvailablesDoce - 1
      const updateQuantityUser = await apiRoot.customers().withId({ ID: customer.id }).post({
        body: {
          version: versionCustomer,
          actions: [
            {
              action: "setCustomField",
              name: "quantity-guides-doce-treinta",
              value: quantityGuideAvailablesDoce
            }
          ]
        }
      }).execute()
      versionCustomer = updateQuantityUser.body.version
    }
  }

  const addPaymentToOrder = await apiRoot.orders().withId({ ID: order.id }).post({
    body: {
      version: order.version,
      actions: [
        {
          action: "addPayment",
          payment: {
            id: createPayment.body.id,
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
  return {
    orderId: addPaymentToOrder.body.id,
    message: undefined,
    isRecoleccion: false,
    isUso: false
  }
}

export const addPaymentToOrders = async (data: ITransactionEvent, order: Order, customer: Customer) => {
  const quantityTotalGuides = 0

  const orders = await apiRoot.orders().get({
    queryArgs: {
      sort: `createdAt desc`,
      where: `orderNumber is defined`
    }
  }).execute()

  if (!orders.body.results[0].orderNumber) return
  const orderSplit = orders.body.results[0].orderNumber.split('D')
  let newOrder = `${orderSplit[0]}D${parseInt(orderSplit[1]) + 1}`

  const createPayment = await apiRoot.payments().post({
    body: {
      key: data.transaction.id,
      interfaceId: data.transaction.id,
      amountPlanned: {
        currencyCode: "MXN",
        centAmount: data.transaction.amount * 100 | 0
      },
      paymentMethodInfo: {
        paymentInterface: "OPENPAY",
        method: "Transferencia",
        name: {
          "es-MX": data.transaction.description
        }
      },
      transactions: [
        {
          interactionId: data.transaction.id,
          type: "Charge",
          amount: {
            currencyCode: "MXN",
            centAmount: data.transaction.amount * 100 | 0,
          },
          state: "Success"
        }
      ]
    }
  }).execute()

  const createPurchaseOrder = async (): Promise<any> => {
    const purchaseOrder = await WSPurchaseOrder({ order: order, code: newOrder, idPaymentService: data.transaction.id, methodName: "Openpay", customer, quantityTotalGuides })
    if (purchaseOrder.result.Code > 0) {
      if (purchaseOrder.result.Description.includes("REPEATED_TICKET")) {
        const orderSplit = newOrder.split('D')
        newOrder = `${orderSplit[0]}D${parseInt(orderSplit[1]) + 1}`
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

  const purchaseResult = await createPurchaseOrder()

  if (!purchaseResult.purchaseOrder) return {
    message: purchaseResult.message,
    orderId: "",
  }

  const purchaseOrder = purchaseResult.purchaseOrder

  const codes = purchaseOrder.resultPurchaseOrder
  let mapGuides: any
  if (codes?.[0]?.WaybillList?.length > 0) {
    const folios = await CreateFolios(codes?.[0]?.WaybillList?.length)
    mapGuides = createMapGuide(codes, order, folios.data.folioResult)
  }

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

  let versionCustomer = customer.version
  //Esto es para agregar items
  for (const line of order.lineItems) {
    const attrType = line.variant.attributes?.find(item => item.name == "tipo-paquete")?.value["label"]
    if (attrType != "UNIZONA") continue
    const attrQuantity = line.variant.attributes?.find(item => item.name == "quantity-items")?.value ?? 1
    const attrService = line.variant.attributes?.find(item => item.name == "servicio")?.value["label"]
    if (attrService == "DIA SIGUIENTE") {
      const quantityGuideAvailables = customer.custom?.fields["quantity-guides-dia-siguiente"]
      const updateQuantityUser = await apiRoot.customers().withId({ ID: customer.id }).post({
        body: {
          version: versionCustomer,
          actions: [
            {
              action: "setCustomField",
              name: "quantity-guides-dia-siguiente",
              value: quantityGuideAvailables + (attrQuantity * line.quantity)
            }
          ]
        }
      }).execute()
      versionCustomer = updateQuantityUser.body.version
    }
    else if (attrService == "TERRESTRE") {
      const quantityGuideAvailables = customer.custom?.fields["quantity-guides-terrestres"]
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
    }
    else if (attrService == "DOS DIAS") {
      const quantityGuideAvailables = customer.custom?.fields["quantity-guides-dos-dias"]
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
    }

    else if (attrService == "12:30") {
      const quantityGuideAvailables = customer.custom?.fields["quantity-guides-doce-treinta"]
      const updateQuantityUser = await apiRoot.customers().withId({ ID: customer.id }).post({
        body: {
          version: versionCustomer,
          actions: [
            {
              action: "setCustomField",
              name: "quantity-guides-doce-treinta",
              value: quantityGuideAvailables + (attrQuantity * line.quantity)
            }
          ]
        }
      }).execute()
      versionCustomer = updateQuantityUser.body.version
    }
  }
  const isZONA = order.lineItems.some(item => item.variant.attributes?.find(attr => attr.name == "tipo-paquete")?.value["label"] == "ZONA")
  const isUNIZONA = order.lineItems.some(item => item.variant.attributes?.find(attr => attr.name == "tipo-paquete")?.value["label"] == "UNIZONA")
  const isInternational = order.lineItems.some(item => item.variant.attributes?.find(attr => attr.name == "tipo-paquete")?.value["label"] == "ZONA INTERNACIONAL")

  if (isUNIZONA || isZONA || isInternational) {
    const mapToObject = (map: Map<any, any>) => {
      const obj: any = {};
      for (let [key, value] of map) {
        obj[key] = value;
      }
      return obj;
    };

    const plainObjectGuides = mapToObject(mapGuides);

    const addPaymentToOrder = await apiRoot.orders().withId({ ID: order.id }).post({
    body: {
      version: order.version,
      actions: [
        {
          action: "addPayment",
          payment: {
            id: createPayment.body.id,
            typeId: "payment"
          }
        },
        {
          action: "changePaymentState",
          paymentState: "Paid"
        },
        {
          action: "setCustomField",
          name: "services",
          value: JSON.stringify(plainObjectGuides)
        },
        {
          action: "setCustomField",
          name: "ordenSap",
          value: codes[0].OrderSAP,
        },
        {
          action: "setOrderNumber",
          orderNumber: newOrder
        }
      ]
    }
  }).execute()
  
  return {
    orderId: addPaymentToOrder.body.id,
    message: "",
    isUso: false,
    isRecoleccion: false,
  }

    
    /*
    const createOrder = await apiRoot.orders().post({
      body: {
        version: versionCart,
        id: cart.body.id,
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
            "invoice": "No Facturada"
          }
        }
      }
    }).execute()

    order = createOrder.body
    */
  } else {
    const asignarGuias = await asignGuideToOrder(customer, order)
    const addPaymentToOrder = await apiRoot.orders().withId({ ID: order.id }).post({
    body: {
      version: order.version,
      actions: [
        {
          action: "addPayment",
          payment: {
            id: createPayment.body.id,
            typeId: "payment"
          }
        },
        {
          action: "changePaymentState",
          paymentState: "Paid"
        },
        {
          action: "setCustomField",
          name: "services",
          value: JSON.stringify(asignarGuias)
        },
        {
          action: "setCustomField",
          name: "ordenSap",
          value: codes[0].OrderSAP,
        },
        {
          action: "setOrderNumber",
          orderNumber: newOrder
        }
      ]
    }
  }).execute()
  
  return {
    orderId: addPaymentToOrder.body.id,
    message: "",
    isUso: false,
    isRecoleccion: false,
  }
    /*
    const createOrder = await apiRoot.orders().post({
      body: {
        version: versionCart,
        id: cart.body.id,
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
    */
  }
}


const createMapGuide = (guides: PurchaseOrder[], order: Order, folios: any[]) => {
  const lineGuides = new Map<string, ILineGuide>();
  const typeService = new Map<string, string>();

  if (!order.lineItems || order.lineItems?.length <= 0) return lineGuides;

  // Primer bucle para inicializar lineGuides y typeService
  for (const line of order.lineItems) {
    if (line.price.value.centAmount <= 0) continue;

    const type = line?.variant?.attributes?.find(attr => attr.name == "tipo-paquete")?.value["label"];
    const services = line?.variant?.attributes?.find(attr => attr.name == "servicio")?.value["label"];

    if (!type) continue;

    // Crear objeto ILineGuide y asignar guides como array vacío
    const guidesItems: ILineGuide = {
      sku: line?.variant?.sku ?? "",
      code: guides[0].Code,
      orderSap: guides[0].OrderSAP,
      guides: [], // Inicializar guides como un array vacío
    };

    lineGuides.set(line.id, guidesItems);
    typeService.set(services, line.id);
  }

  // Segundo bucle para asignar guías basadas en el tipo de servicio
  for (const guia of guides[0].WaybillList) {
    const index = guia.Code.charAt(13);
    let id: string | undefined;

    if (index == "6") {
      id = typeService.get("DIA SIGUIENTE");
    } else if (index == "D") {
      id = typeService.get("DOS DIAS");
    } else if (index == "7") {
      id = typeService.get("TERRESTRE");
    } else if (index == "H") {
      id = typeService.get("12:30");
    }

    if (id) {
      const lineGuide = lineGuides.get(id);
      if (!lineGuide) continue;
      const origenDestino = order.lineItems.find(item => item.id == id)
      // Asegurarse de que guides esté inicializado antes de hacer push
      lineGuide.guides?.push({
        guide: guia.Code,
        QR: folios?.[0]?.folioMD5 ? `Q3SQR${folios[0].folioMD5}` : "0",
        isItemDimensionsExceeded: origenDestino?.custom?.fields["isItemDimensionsExceeded"],
        isItemWeightExceeded: origenDestino?.custom?.fields["isItemWeightExceeded"],
        isPackage: origenDestino?.custom?.fields["isPackage"],
        isPudo: origenDestino?.custom?.fields["isPudo"],
        itemHeight: origenDestino?.custom?.fields["itemHeight"],
        itemLength: origenDestino?.custom?.fields["itemLength"],
        itemVolumen: origenDestino?.custom?.fields["itemVolumen"],
        itemWeight: origenDestino?.custom?.fields["itemWeight"],
        itemWidth: origenDestino?.custom?.fields["itemWidth"],
        Recoleccion: origenDestino?.custom?.fields["Recoleccion"],
        address: JSON.parse(origenDestino?.custom?.fields?.["origen-destino"] ?? "{}"),
        ...getValidityData()
      });
    }

    if (folios?.length > 0) {
      folios.shift();
    }
  }
  return lineGuides;
}
