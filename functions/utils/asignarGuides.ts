import type { Cart, Customer, Order } from "@commercetools/platform-sdk"
import { apiRoot } from "../commercetools/client";
import { getValidityData } from "./validity";

interface MapGuides {
    [id: string]: ILineGuide
}

interface ILineGuide {
  sku: string;
  code: string;
  orderSap: string;
  guides?: any[];
}

interface IGuides {
  guide: string;
  QR: string;
}

export const asignGuideToOrder = async (customer: Customer, order: Order): Promise<any> => {
  debugger
  let guias = []
  const ordenToDeleteGuide: any[] = []


  let newJson: MapGuides = {}
  //Filtrar
  for (const item of order.lineItems) {
    guias = []
    const attr = item.variant.attributes?.find(attr => attr.name == "servicio")?.value["label"]
    if (!attr) continue
    const orders = await apiRoot.orders().get({
      queryArgs: {
        sort: "createdAt asc",
        limit: 500,
        where: `customerId in ("${customer.id}") and custom(fields(type-order="service"))`
      }
    }).execute()
  
    //Filtrar las ordenes que son combos
    const combos = orders.body.results.filter(item => item.lineItems.some(line => line.variant.attributes?.find(attr => attr.name == "tipo-paquete")?.value["label"] == "UNIZONA"))
    for (const combo of combos) {
      let count = 0
      if (guias.length >= item.quantity) {
        count = 0
        break
      }
      const service = combo.lineItems.find(line => line.variant.attributes?.find(attr => attr.name == "servicio")?.value["label"] == attr)?.id
      if (!service) continue

      const jsonService = combo.custom?.fields["services"] && JSON.parse(combo?.custom?.fields["services"])
      if (!jsonService) continue
      if (jsonService[service].guides.length <= 0) continue
      for (const guide of jsonService[service].guides) {
        if (guias.length >= item.quantity) break
        //@ts-ignore
        guias.push(guide)
        count++
        const ordenFind = ordenToDeleteGuide.find(orden => orden.id == combo.id)
        if (!ordenFind) ordenToDeleteGuide.push({ id: combo.id, version: combo.version, type: attr, quantity: count })
        else ordenFind.quantity = count
      }
    }
    for (const element of guias) {
      if (!newJson[item.id]) {
        newJson[item.id] = {
          sku: item.variant?.sku ?? "",
          code: "",
          orderSap: "",
          guides: [] // Inicializa guides como un array
        };
      }

      newJson[item.id]?.guides?.push({
        //@ts-ignore
        ...element,
        isItemDimensionsExceeded: item?.custom?.fields["isItemDimensionsExceeded"],
        isItemWeightExceeded: item?.custom?.fields["isItemWeightExceeded"],
        isPackage: item?.custom?.fields["isPackage"],
        isPudo: item?.custom?.fields["isPudo"],
        itemHeight: item?.custom?.fields["itemHeight"],
        itemLength: item?.custom?.fields["itemLength"],
        itemVolumen: item?.custom?.fields["itemVolumen"],
        itemWeight: item?.custom?.fields["itemWeight"],
        itemWidth: item?.custom?.fields["itemWidth"],
        Recoleccion: item?.custom?.fields["Recoleccion"],
        address: JSON.parse(item?.custom?.fields?.["origen-destino"] ?? "{}"),
        ...getValidityData(false, item?.custom?.fields["isPudo"])
      });
    }
    for (const guidesToDelete of ordenToDeleteGuide) {
      const combo = combos.find(combo => combo.id == guidesToDelete.id)
      if (!combo) continue

      const service = combo.lineItems.find(line => line.variant.attributes?.find(attr => attr.name == "servicio")?.value["label"] == attr)?.id
      if (!service) continue
      const jsonService = combo.custom?.fields["services"] && JSON.parse(combo?.custom?.fields["services"])
      if(jsonService[service].guides <= 0 ) continue
      const guides = jsonService[service].guides.slice(item.quantity)

      const newServiceJson = {
        ...jsonService,
        [service]: {
          code: "",
          sku: "",
          orderSap: "",
          guides: [
            ...guides,
          ]
        }
      }
      const order = await apiRoot.orders().withId({ ID: guidesToDelete.id }).get().execute()
      await apiRoot.orders().withId({ ID: guidesToDelete.id }).post({
        body: {
          version: order.body.version,
          actions: [
            {
              action: 'setCustomField',
              name: 'services',
              value: JSON.stringify(newServiceJson)
            }
          ]
        }
      }).execute()
    }
  }

  //Discount
  let guidesTerrestresAvailables = 0
  let guidesDosDiasAvailables = 0
  let guidesDiaSiguienteAvailables = 0
  let guidesDoceTreinteAvailables = 0
  let versionCustomer = customer.version
  for (const line of order.lineItems) {
    let isLegacy = false
    debugger
    const attrService = line.variant.attributes?.find(item => item.name == "servicio")?.value["label"]
    if (!attrService) continue
    if (attrService == "DIA SIGUIENTE") {
      let quantityGuideAvailables = customer.custom?.fields["quantity-guides-dia-siguiente"]
      if (!quantityGuideAvailables || quantityGuideAvailables <= 0) {
        quantityGuideAvailables = customer.custom?.fields["quantity-guides-dia-siguiente-legacy"]
        isLegacy = true
      }
      const quantityNew = quantityGuideAvailables - line.quantity
      const updateQuantityUser = await apiRoot.customers().withId({ ID: customer.id }).post({
        body: {
          version: versionCustomer,
          actions: [
            {
              action: "setCustomField",
              name: !isLegacy ? "quantity-guides-dia-siguiente" : "quantity-guides-dia-siguiente-legacy",
              value: !isLegacy ? quantityNew : String(quantityNew)
            }
          ]
        }
      }).execute()
      versionCustomer = updateQuantityUser.body.version
      guidesDiaSiguienteAvailables = (customer.custom?.fields?.['quantity-guides-dia-siguiente-used'] ?? 0 )+ line.quantity
    }
    else if (attrService == "TERRESTRE") {
      let quantityGuideAvailables = customer.custom?.fields["quantity-guides-terrestres"]
      if (!quantityGuideAvailables || quantityGuideAvailables <= 0) {
        quantityGuideAvailables = customer.custom?.fields["quantity-guides-terrestres-legacy"]
        isLegacy = true
      }
      const quantityNew = quantityGuideAvailables - line.quantity
      const updateQuantityUser = await apiRoot.customers().withId({ ID: customer.id }).post({
        body: {
          version: versionCustomer,
          actions: [
            {
              action: "setCustomField",
              name: !isLegacy ? "quantity-guides-terrestres" : "quantity-guides-terrestres-legacy",
              value: !isLegacy ? quantityNew : String(quantityNew)
            }
          ]
        }
      }).execute()
      versionCustomer = updateQuantityUser.body.version
      guidesTerrestresAvailables = (customer.custom?.fields?.['quantity-guides-terrestres-used'] ?? 0) + line.quantity
    }
    else if (attrService == "DOS DIAS") {
      let quantityGuideAvailables = customer.custom?.fields["quantity-guides-dos-dias"]
      if (!quantityGuideAvailables || quantityGuideAvailables <= 0) {
        quantityGuideAvailables = customer.custom?.fields["quantity-guides-dos-dias-legacy"]
        isLegacy = true
      }
      const quantityNew = quantityGuideAvailables - line.quantity
      const updateQuantityUser = await apiRoot.customers().withId({ ID: customer.id }).post({
        body: {
          version: versionCustomer,
          actions: [
            {
              action: "setCustomField",
              name: !isLegacy ? "quantity-guides-dos-dias" : "quantity-guides-dos-dias-legacy",
              value: !isLegacy ? quantityNew : String(quantityNew)
            }
          ]
        }
      }).execute()
      versionCustomer = updateQuantityUser.body.version
      guidesDosDiasAvailables = (customer.custom?.fields?.['quantity-guides-dos-dias-used'] ?? 0) + line.quantity
    }

    else if (attrService == "12:30") {
      let quantityGuideAvailables = customer.custom?.fields["quantity-guides-doce-treinta"]
      if (!quantityGuideAvailables || quantityGuideAvailables <= 0) {
        quantityGuideAvailables = customer.custom?.fields["quantity-guides-doce-treinta-legacy"]
        isLegacy = true
      }
      const quantityNew = quantityGuideAvailables - line.quantity
      const updateQuantityUser = await apiRoot.customers().withId({ ID: customer.id }).post({
        body: {
          version: versionCustomer,
          actions: [
            {
              action: "setCustomField",
              name: !isLegacy ? "quantity-guides-doce-treinta" : "quantity-guides-doce-treinta-legacy",
              value: !isLegacy ? quantityNew : String(quantityNew)
            }
          ]
        }
      }).execute()
      versionCustomer = updateQuantityUser.body.version
      guidesDoceTreinteAvailables = (customer.custom?.fields?.['quantity-guides-doce-treinta-used'] ?? 0) + line.quantity
    }
  }
  await updateUserWithGuidesAvailables(customer.id, versionCustomer, guidesTerrestresAvailables, guidesDosDiasAvailables, guidesDiaSiguienteAvailables, guidesDoceTreinteAvailables)

  return newJson
}




const updateUserWithGuidesAvailables = async (idCustomer: string, versionCustomer: number, guidesTerrestresAvailables: number,guidesDosDiasAvailables: number,guidesDiaSiguienteAvailables: number,guidesDoceTreinteAvailables: number ) =>  {
  if(guidesDiaSiguienteAvailables > 0){
    const updateQuantityUser = await apiRoot.customers().withId({ ID: idCustomer }).post({
      body: {
        version: versionCustomer,
        actions: [
          {
            action: "setCustomField",
            name: "quantity-guides-dia-siguiente-used",
            value: guidesDiaSiguienteAvailables
          }
        ]
      }
    }).execute()
    versionCustomer = updateQuantityUser.body.version
  }
  if(guidesDosDiasAvailables > 0){
    const updateQuantityUser = await apiRoot.customers().withId({ ID: idCustomer }).post({
      body: {
        version: versionCustomer,
        actions: [
          {
            action: "setCustomField",
            name: "quantity-guides-dos-dias-used",
            value: guidesDosDiasAvailables
          }
        ]
      }
    }).execute()
    versionCustomer = updateQuantityUser.body.version
  }
  if(guidesDoceTreinteAvailables > 0){
    const updateQuantityUser = await apiRoot.customers().withId({ ID: idCustomer }).post({
      body: {
        version: versionCustomer,
        actions: [
          {
            action: "setCustomField",
            name: "quantity-guides-doce-treinta-used",
            value: guidesDoceTreinteAvailables
          }
        ]
      }
    }).execute()
    versionCustomer = updateQuantityUser.body.version
  }
  if(guidesTerrestresAvailables > 0){
    const updateQuantityUser = await apiRoot.customers().withId({ ID: idCustomer }).post({
      body: {
        version: versionCustomer,
        actions: [
          {
            action: "setCustomField",
            name: "quantity-guides-terrestres-used",
            value: guidesTerrestresAvailables
          }
        ]
      }
    }).execute()
    versionCustomer = updateQuantityUser.body.version
  }
}
