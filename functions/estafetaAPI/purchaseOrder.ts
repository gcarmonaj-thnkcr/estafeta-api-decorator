import axios from 'axios';
import { authToken } from './auth';
import { Cart, Customer, Order } from '@commercetools/platform-sdk';
import { getCode } from '../utils/codesPurchase';
import { apiRoot } from '../commercetools/client';
import { invertPrice } from '../utils/invertTaxes';

export interface ICardPayment {
  cardNumber: string;
  paymentType: string;
}

export interface IPurchaseOrder {
  order: Order | Cart;
  code: string;
  idPaymentService: string;
  methodName: string;
  customer: Customer;
  quantityTotalGuides: number;
  logger?: any;
}

interface IPurchaseLine {
  PurchaseOrderCode: string; // Autoincrementable
  customerCode: string; // Dato fijo
  TicketCode: string;
  MaterialCode: string;
  MaterialName: string;
  MaterialQuantity: number;
  MaterialPrice: number;
  MaterialDiscountAmount: number;
  MaterialTaxAddAmount: number;
  SummaryService: number;
}

const getTypeCart = (order: Order | Cart) => {
  let attrType = order?.lineItems?.some(item => item.variant.attributes?.find(attr => attr.name == "tipo-paquete")?.value["label"] == "ZONA")
  if (attrType) return "ZONA"
  attrType = order?.lineItems?.some(item => item.variant.attributes?.find(attr => attr.name == "tipo-paquete")?.value["label"] == "UNIZONA")
  if (attrType) return "UNIZONA"
  attrType = order?.lineItems?.some(item => item.variant.attributes?.find(attr => attr.name == "tipo-paquete")?.value["label"] == "RECOLECCION")
  if (attrType) return "RECOLECCION"
  attrType = order?.lineItems?.some(item => item.variant.attributes?.find(attr => attr.name == "tipo-paquete")?.value["label"] == "ZONA INTERNACIONAL")
  if (attrType) return "INTERNACIONAL"
  return "USO"
}

let taxAmount = 16

export const WSPurchaseOrder = async ({ order, code, customer, idPaymentService, methodName, quantityTotalGuides, logger }: IPurchaseOrder) => {
  const typeCart = getTypeCart(order)
  idPaymentService = idPaymentService.length > 10 ? idPaymentService.substring(0, 10) : idPaymentService
  const purchaseLines = await createLinePurchase(typeCart, order, code, quantityTotalGuides, customer, idPaymentService)
  if(!taxAmount) taxAmount = 16 
  const data = {
    "purchaseOrder": [
      {
        "SalesOrganizationCode": "87D",
        "code": code,
        "customerMail": customer.email ?? "",
        "ticketCode": "43099",
        "services": purchaseLines,
        "servicesPay": [
          {
            "PurchaseOrderCode": code,
            "CustomerCode": "000200087D",
            "TicketCode": idPaymentService,
            "PaymentMethodName": "Openpay",
            "PaymentTypeName": "Credit",
            "TransactionalCode": "OBA-04",
            "PaymentCardNum": "424242XXXXXX4242",
            "BankTypeName": "VISA",
            "BankReferenceCode": "87D01189",
            "PaymentAmount": order.totalPrice.centAmount / 100.00,
            "PaidDateTime": "2024-07-17 12:11:45",
            "PaymentCode": code
          }
        ],
        "DiscountCode": order?.discountCodes?.[0]?.discountCode?.obj?.code.slice(0, 4) ?? "0",
        "DiscouentRate": order.discountOnTotalPrice?.discountedAmount?.centAmount ? 1 : 0,
        "ValueAddTaxRate": taxAmount,
        "SubtotalOrderAmount": (order.totalPrice.centAmount + (order.discountOnTotalPrice?.discountedAmount?.centAmount ?? 0)) /100.00,
        "DiscountAmount": (order.discountOnTotalPrice?.discountedAmount?.centAmount ?? 0) / 100.00,
        "ValueAddTaxAmount": taxAmount,
        "TotalOrderAmount": (order.totalPrice.centAmount) /100.00,
        "statusOorder": "Pagado"
      }
    ]
  }

  logger.info(`Data purchase: ${JSON.stringify(data)}`)
  const token = await authToken({ type: 'purchaseOrder' })
  const config = {
    method: 'post',
    url: 'https://apimiddlewareinvoice.estafeta.com/TiendaEstafetaAPI/rest/PurchasePortalOrder/Insert',
    headers: {
      APIKEY: '535bdfc24755428aac2d96dca5a158ee',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    data: JSON.stringify(data),
  };
  try {
    const response = await axios.request(config);
    logger.info(JSON.stringify(response.data))
    return response.data;
  } catch (error: any) {
    logger.error(error);
    throw error;
  }
}


const updatedCustomer = async (email: string, fieldToUpdated: string, quantityGuidesLegacy: number, fieldToUpdatedGuides: string, type: string, idCustomer: string) => {
  const customerUpdated = await apiRoot.customers().get({
    queryArgs: {
      where: `email in ("${email}")`
    }
  }).execute()

  const userUpdate = await apiRoot.customers().withId({ ID: customerUpdated.body.results[0].id }).post({
    body: {
      version: customerUpdated.body.results[0].version,
      actions: [
        {
          action: "setCustomField",
          name: fieldToUpdated,
          value: "0"
        },
        {
          action: "setCustomField",
          name: fieldToUpdatedGuides,
          value: quantityGuidesLegacy
        }
      ]
    }
  }).execute()
  const orders = await apiRoot.orders().get({
    queryArgs: {
      where: `customerId in ("${idCustomer}") and custom(fields(isLegacy=true))`
    }
  }).execute()

  debugger

  for(const order of orders.body.results ) {
    debugger
    const itemService = order.lineItems.find(item => item.variant.attributes?.find(attr => attr.name == "servicio")?.value["label"] == type)
    const jsonService = JSON.parse(order.custom?.fields["services"])
    if(!jsonService) return 
    jsonService[itemService?.id ?? ""].guides = []
    const uOrder = await apiRoot.orders().withId({ID: order.id}).post({
      body: {
        version: order.version,
        actions: [
          {
            action: 'setCustomField',
            name: 'services',
            value: JSON.stringify(jsonService)
          }
        ]
      }
    }).execute()
  }
  
}

const createLinePurchase = async (typeCart: string, order: Order | Cart, code: string, quantityTotalGuides: number, customer: Customer, idPaymentService: string): Promise<IPurchaseLine[]> => {
  debugger
  if (typeCart == "UNIZONA") {
    const servicesLines: IPurchaseLine[] = [];
    for (const line of order.lineItems.filter((line) => line.price.value.centAmount > 0)) {
      const type = line?.variant?.attributes?.find(attr => attr.name == "servicio")?.value["label"];
      const quantity = line?.variant?.attributes?.find(attr => attr.name == "quantity-items")?.value ?? 1;
      const nameService = type ?? line.productKey;
      const codeMaterial = getCode(nameService);
      let legacyCount = "0";
      debugger
      if (type == "TERRESTRE") {
        legacyCount = customer.custom?.fields?.["quantity-guides-terrestres-legacy"] ?? "0";
        if (legacyCount != "0") await updatedCustomer(customer.email, "quantity-guides-terrestres-legacy", parseInt(legacyCount), "quantity-guides-terrestres", type, order?.customerId ?? "");
      } else if (type == "DOS DIAS") {
        legacyCount = customer.custom?.fields?.["quantity-guides-dos-dias-legacy"] ?? "0";
        if (legacyCount != "0") await updatedCustomer(customer.email, "quantity-guides-dos-dias-legacy", parseInt(legacyCount), "quantity-guides-dos-dias", type, order?.customerId ?? "");
      } else if (type == "DIA SIGUIENTE") {
        legacyCount = customer.custom?.fields?.["quantity-guides-dia-siguiente-legacy"] ?? "0";
        if (legacyCount != "0") await updatedCustomer(customer.email, "quantity-guides-dia-siguiente-legacy", parseInt(legacyCount), "quantity-guides-dia-siguiente", type, order?.customerId ?? "");
      } else if (type == "DOCE TREINTA") {
        legacyCount = customer.custom?.fields?.["quantity-guides-doce-treinta-legacy"] ?? "0";
        if (legacyCount != "0") await updatedCustomer(customer.email, "quantity-guides-doce-treinta-legacy", parseInt(legacyCount), "quantity-guides-doce-treinta", type, order?.customerId ?? "");
      }

      const quantityTotalGuides = quantity * line.quantity + parseInt(legacyCount);

      const purchaseLine: IPurchaseLine = {
        PurchaseOrderCode: code, // Autoincrementable
        customerCode: "000200087D", // Dato fijo
        TicketCode: idPaymentService,
        MaterialCode: codeMaterial.code,
        MaterialName: line.name["es-MX"],
        MaterialQuantity: quantityTotalGuides,
        MaterialPrice: invertPrice((line.price.value.centAmount) / 100.0, 16),
        MaterialDiscountAmount: !line.price.discounted?.value.centAmount ? (order.discountOnTotalPrice?.discountedAmount?.centAmount ?? 0) / 100.00 : (line.price.discounted?.value.centAmount ?? 0) / 100.00,
        MaterialTaxAddAmount: 1,
        SummaryService: 270.7,
      };

      servicesLines.push(purchaseLine);
    }
    return servicesLines
  };

  let servicesLines: IPurchaseLine[] = []
  for (const line of order.lineItems) {
    const type = line?.variant?.attributes?.find(attr => attr.name == "tipo-paquete")?.value["label"]
    if (!type) continue
    const adicionales = line.custom?.fields["adicionales"] && JSON.parse(line.custom?.fields["adicionales"])
    const sobrepeso = line.custom?.fields["sobrepeso"] && JSON.parse(line.custom?.fields["sobrepeso"])
    const tarifaBase = line.custom?.fields["tarifa_base"] && JSON.parse(line.custom?.fields["tarifa_base"])
    const quantity = line?.variant?.attributes?.find(attr => attr.name == "quantity-items")?.value ?? 1
    const nameService = line?.variant?.attributes?.find(attr => attr.name == "servicio")?.value["label"] ?? line.productKey
    const iva = parseFloat(line.custom?.fields["guia"])
    taxAmount = iva
    debugger
    const codeMaterial = getCode(nameService)
    const indexCodeMaterial = codeMaterial.code.charAt(0)
    quantityTotalGuides = quantity * line.quantity
    let quitAdicionales = 0
    
    if (sobrepeso) {
      Object.keys(sobrepeso).forEach(key => {
        
        const value = sobrepeso[key]
        if (!value || value == "0.00") return
        if (typeof value == "object" && Object.keys(value).length == 0) return
        const finalTotla = parseFloat(sobrepeso[key]) * line.quantity
        quitAdicionales = quitAdicionales + finalTotla
      })
    }
    if (tarifaBase) {
      if (tarifaBase["Cargo por Combustible"] && tarifaBase["Cargo por Combustible"] != "0.00") {
        const finalTotla = parseFloat(tarifaBase["Cargo por Combustible"]) * line.quantity
        quitAdicionales = quitAdicionales + finalTotla
      }
    }
    if (line.totalPrice.centAmount > 0) {
      quitAdicionales = quitAdicionales * 100
      const finalPrice = (line.totalPrice.centAmount - quitAdicionales) | 0
      console.log(codeMaterial.code) 
      if (finalPrice > 0) {
        servicesLines.push({
          PurchaseOrderCode: code, // Autoincrementable
          customerCode: "000200087D", // Dato fijo
          TicketCode: idPaymentService,
          MaterialCode: codeMaterial.code,
          MaterialName: line.name["es-MX"],
          MaterialQuantity: quantity * line.quantity,
          MaterialPrice: invertPrice((finalPrice / 100.00), iva),
          MaterialDiscountAmount: !line.price.discounted?.value.centAmount ? (order.discountOnTotalPrice?.discountedAmount?.centAmount ?? 0) / 100.00 : (line.price.discounted?.value.centAmount ?? 0) / 100.00,
          MaterialTaxAddAmount: 1,
          SummaryService: 270.700000
        })
      }
    }

    console.log(servicesLines)
    
    if (adicionales) {
      const result = adicionales.reduce((acc: any, item: any) => {
        const keys = Object.keys(item);
        keys.forEach(key => {
          if (item[key] !== '') {
            const existing = acc.find((obj: any) => obj.code === key);

            if (existing) {
              existing.count += 1;
            } else {
              acc.push({
                code: key,
                count: 1
              });
            }
          }
        });
        return acc;
      }, []);
      
      for (const res of result) {
        let name = ""
        if (res.code == "enBio") {
          name = "enBio"
        } else if (res.code == "seguro") {
          name = "seguro-opcional"
        } else if (res.code == "manejable") {
          name = "manejo-especial"
        }
        
        const item = order.lineItems.find(item => item.productKey == name)
        if (!item) continue
        const codeMaterial = getCode(item.productKey ?? res.code)
        servicesLines.push({
          PurchaseOrderCode: code, // Autoincrementable
          customerCode: "000200087D", // Dato fijo
          TicketCode: idPaymentService,
          MaterialCode: indexCodeMaterial + codeMaterial.code,
          MaterialName: item.name["es-MX"],
          MaterialQuantity: res.count,
          MaterialPrice: typeCart == "INTERNACIONAL" ? (item.totalPrice.centAmount / 100.00) : invertPrice((item.totalPrice.centAmount / 100.00), iva),
          MaterialDiscountAmount: !line.price.discounted?.value.centAmount ? (order.discountOnTotalPrice?.discountedAmount?.centAmount ?? 0) / 100.00 : (line.price.discounted?.value.centAmount ?? 0) / 100.00,
          MaterialTaxAddAmount: 1,
          SummaryService: 270.700000
        })
      }
    }
    
    if (sobrepeso) {
      Object.keys(sobrepeso).forEach(key => {
        
        const value = sobrepeso[key]
        if (typeof value == "object" && Object.keys(value).length == 0) return
        if (!value || value == "0.00") return
        let codeMaterial: any = {}
        if (key == "Sobrepeso") {
          codeMaterial = getCode("sobrepeso")
        } else if (key == "Reexpedicion") {
          codeMaterial = getCode("reexpedicion")
        } else {
          codeMaterial = getCode("combustible-por-peso")
        }
        servicesLines.push({
          PurchaseOrderCode: code, // Autoincrementable
          customerCode: "000200087D", // Dato fijo
          TicketCode: idPaymentService,
          MaterialCode: indexCodeMaterial + codeMaterial.code,
          MaterialName: key,
          MaterialQuantity: line.quantity,
          MaterialPrice: invertPrice(sobrepeso[key], iva) * line.quantity,
          MaterialDiscountAmount: 0,
          MaterialTaxAddAmount: 1,
          SummaryService: 270.700000
        })
      })
    }
    if (tarifaBase) {
      if (tarifaBase["Cargo por Combustible"] && tarifaBase["Cargo por Combustible"] != "0.00") {
        const codeMaterial = getCode("cargo-combustible")
        servicesLines.push({
          PurchaseOrderCode: code, // Autoincrementable
          customerCode: "000200087D", // Dato fijo
          TicketCode: idPaymentService,
          MaterialCode: indexCodeMaterial + codeMaterial.code,
          MaterialName: "Cargo por Combustible",
          MaterialQuantity: line.quantity,
          MaterialPrice: invertPrice(tarifaBase["Cargo por Combustible"], iva) * line.quantity,
          MaterialDiscountAmount: 0,
          MaterialTaxAddAmount: 1,
          SummaryService: 270.700000
        })
      }
    }
  }
  return servicesLines
}
