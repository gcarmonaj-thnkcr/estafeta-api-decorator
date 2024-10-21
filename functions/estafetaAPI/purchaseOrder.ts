import axios from 'axios';
import { authToken } from './auth';
import { Cart, Customer, Order } from '@commercetools/platform-sdk';
import { getCode } from '../utils/codesPurchase';
import { apiRoot } from '../commercetools/client';

export interface ICardPayment {
  cardNumber: string;
  paymentType: string;
}

export interface IPurchaseOrder {
  order: Order;
  code: string;
  idPaymentService: string;
  methodName: string;
  customer: Customer;
  quantityTotalGuides: number;
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

const getTypeCart = (order: Order) => {
  let attrType = order.lineItems.some(item => item.variant.attributes?.find(attr => attr.name == "tipo-paquete")?.value["label"] == "ZONA")
  if(attrType) return "ZONA"
  attrType = order.lineItems.some(item => item.variant.attributes?.find(attr => attr.name == "tipo-paquete")?.value["label"] == "UNIZONA")
  if(attrType) return "UNIZONA"
  return "USO"
}

export const WSPurchaseOrder = async ({ order, code, customer, idPaymentService, methodName, quantityTotalGuides }: IPurchaseOrder) => {
  const typeCart = getTypeCart(order)
  const purchaseLines = createLinePurchase(typeCart, order, code, quantityTotalGuides, customer)

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
            "TicketCode": "43099",
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
        "DiscountCode": "0",
        "DiscouentRate": 0,
        "ValueAddTaxRate": 16,
        "SubtotalOrderAmount": order.totalPrice.centAmount / 100.00,
        "DiscountAmount": 0,
        "ValueAddTaxAmount": 16,
        "TotalOrderAmount": order.totalPrice.centAmount / 100.00,
        "statusOorder": "Pagado"
      }
    ]
  }

  const token = await authToken({ type: 'purchaseOrder' })
  console.log(token)
  const config = {
    method: 'post',
    url: 'https://apimiddlewareinvoiceqa.estafeta.com/TiendaEstafetaAPI/rest/PurchasePortalOrder/Insert',
    headers: {
      APIKEY: '35a7bf4c03f44514b7f100f9bcdfc208',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      Cookie:
        'dd4f03=4xuDehaAsBXfKXHuNYpioX8SAaJ5WeWSH6rsC+LyveY2vvEGjw2weq+6elv8TGL4ooypquxeH7iU3UhM3I6EiJtLDsqT2qGvmBhbKu8FeSwnxDTjsMG/B8KyTXOD9rBIVUftAp9K1nrKTWdSTmQSgJR0WdgomFHUqPjGLAr1nOoFlNbA',
    },
    data: JSON.stringify(data),
  };
  try {
    const response = await axios.request(config);
    debugger
    console.log(response.data)
    return response.data;
  } catch (error: any) {
    debugger
    console.error('Error Response: ', error.response);
    console.error('Error Message: ', error.message);
    throw error;
  }
}

const updatedCustomer = async (idCustomer: string, fieldToUpdated: string) => {
   const customerUpdated = await apiRoot.customers().get({
        queryArgs: {
            where: `id in ("${idCustomer}")`
        }
    }).execute()

    const userUpdate = await apiRoot.customers().withId({ID: customerUpdated.body.results[0].id}).post({
        body: {
            version: customerUpdated.body.results[0].version,
            actions: [
                {
                    action: "setCustomField",
                    name: fieldToUpdated,
                    value: "0"
                }
            ]
        }
    }).execute()
}

const createLinePurchase = (typeCart: string, order: Order, code: string, quantityTotalGuides: number, customer: Customer): IPurchaseLine[] => {
  debugger
  if(typeCart == "UNIZONA"){
    const servicesLines: IPurchaseLine[] = order.lineItems
    .filter(line => line.price.value.centAmount > 0)
    .map(line => {
      const type = line?.variant?.attributes?.find(attr => attr.name == "servicio")?.value["label"]
      const quantity = line?.variant?.attributes?.find(attr => attr.name == "quantity-items")?.value ?? 1
      const nameService = type ?? line.productKey
      const codeMaterial = getCode(nameService)
      let legacyCount = "0"
      debugger
      if(type == "TERRESTRE") {
        legacyCount = customer.custom?.fields?.["quantity-guides-terrestres-legacy"] ?? "0"
        if(legacyCount != "0") updatedCustomer(customer.id, "quantity-guides-terrestres-legacy")
      } else if(type == "DOS DIAS"){
        legacyCount = customer.custom?.fields?.["quantity-dos-dias-legacy"] ?? "0"
        if(legacyCount != "0") updatedCustomer(customer.id, "quantity-guides-dos-dias-legacy")
      } else if(type == "DIA SIGUIENTE"){
        legacyCount = customer.custom?.fields?.["quantity-guides-dia-siguiente-legacy"] ?? "0"
        if(legacyCount != "0") updatedCustomer(customer.id, "quantity-guides-dia-siguiente-legacy")
      } else if(type == "DOCE TREINTA"){
        legacyCount = customer.custom?.fields?.["quantity-guides-doce-treinta-legacy"] ?? "0"
        if(legacyCount != "0") updatedCustomer(customer.id, "quantity-guides-doce-treinta-legacy")
      }
      debugger
      quantityTotalGuides = quantity * line.quantity + parseInt(legacyCount)

      const purchaseLine: IPurchaseLine = {
        PurchaseOrderCode: code, // Autoincrementable
        customerCode: "000200087D", // Dato fijo
        TicketCode: "43099",
        MaterialCode: codeMaterial.code,
        MaterialName: line.name["es-MX"],
        MaterialQuantity: quantityTotalGuides,
        MaterialPrice: line.price.value.centAmount / 100.00,
        MaterialDiscountAmount: 0,
        MaterialTaxAddAmount: 1,
        SummaryService: 270.700000
      }

      return purchaseLine
    });

    return servicesLines
  }
  let servicesLines: IPurchaseLine[] = []
  /*
  if(typeCart == "USO") {
    for(const line of cart.lineItems){
        const type = line?.variant?.attributes?.find(attr => attr.name == "tipo-paquete")?.value["label"]
        if(type) continue
        const codeMaterial = getCode(line.productKey ?? "")
        servicesLines.push({
            PurchaseOrderCode: code, // Autoincrementable
            customerCode: "000200087D", // Dato fijo
            TicketCode: "43099",
            MaterialCode: codeMaterial.code,
            MaterialName: line.name["es-MX"],
            MaterialQuantity: line.quantity,
            MaterialPrice: line.price.value.centAmount / 100.00,
            MaterialDiscountAmount: 0,
            MaterialTaxAddAmount: 1,
            SummaryService: 270.700000
        })
    }
  }
    */

  for(const line of order.lineItems) {
    const type = line?.variant?.attributes?.find(attr => attr.name == "tipo-paquete")?.value["label"]
    if(!type) continue
    const adicionales = line.custom?.fields["adicionales"] && JSON.parse(line.custom?.fields["adicionales"])
    const quantity = line?.variant?.attributes?.find(attr => attr.name == "quantity-items")?.value ?? 1
    const nameService = line?.variant?.attributes?.find(attr => attr.name == "servicio")?.value["label"] ?? line.productKey
    debugger
    const codeMaterial = getCode(nameService)
    const indexCodeMaterial = codeMaterial.code.charAt(0)
    quantityTotalGuides = quantity * line.quantity
    if(line.price.value.centAmount > 0){
      servicesLines.push({
        PurchaseOrderCode: code, // Autoincrementable
        customerCode: "000200087D", // Dato fijo
        TicketCode: "43099",
        MaterialCode: codeMaterial.code,
        MaterialName: line.name["es-MX"],
        MaterialQuantity: quantity * line.quantity,
        MaterialPrice: line.price.value.centAmount / 100.00,
        MaterialDiscountAmount: 0,
        MaterialTaxAddAmount: 1,
        SummaryService: 270.700000
      })
    }
    debugger
    if(adicionales) {
        const result = adicionales.reduce((acc: any, item: any) => {
        const keys = Object.keys(item);
        keys.forEach(key => {
    if (item[key] !== '') {
      // Buscar si el código ya existe en el acumulador
      const existing = acc.find((obj: any) => obj.code === key);

      if (existing) {
        // Si existe, incrementamos el count
        existing.count += 1;
      } else {
        // Si no existe, lo inicializamos
        acc.push({
          code: key,
          count: 1
        });
      }
        }
        });
        return acc;
      }, []);
      debugger
      for(const res of result) {
        let name = ""
        if(res.code == "enBio") {
            name = "enBio"
        } else if(res.code == "seguro") {
            name = "seguro-opcional"
            continue
        } else if(res.code == "manejable") {
            name = "manejo-especial"
            continue
        }
                debugger
        const item = order.lineItems.find(item => item.productKey == name)
        if(!item) continue
        const codeMaterial = getCode(item.productKey ?? res.code)
        servicesLines.push({
          PurchaseOrderCode: code, // Autoincrementable
          customerCode: "000200087D", // Dato fijo
          TicketCode: "43099",
          MaterialCode: indexCodeMaterial+codeMaterial.code,
          MaterialName: item.name["es-MX"],
          MaterialQuantity: res.count,
          MaterialPrice: item.price.value.centAmount / 100.00,
          MaterialDiscountAmount: 0,
          MaterialTaxAddAmount: 1,
          SummaryService: 270.700000
        })
      }
    }
  }
  return servicesLines
}
