import type { Cart, Customer, Order } from "@commercetools/platform-sdk"
import { apiRoot } from "../commercetools/client";

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
    const orders = await apiRoot.orders().get({
        queryArgs: {
            sort: "createdAt asc",
            limit: 500,
            where: `customerId in ("${customer.id}") and custom(fields(type-order="service"))`
        }
    }).execute()

    //Filtrar las ordenes que son combos
    const combos = orders.body.results.filter(item => item.lineItems.some(line => line.variant.attributes?.find(attr => attr.name == "tipo-paquete")?.value["label"] == "UNIZONA"))
    const guias = []
    const ordenToDeleteGuide: any[] = []


    let newJson: MapGuides = {}
    //Filtrar
    for(const item of order.lineItems) {
        const attr = item.variant.attributes?.find(attr => attr.name == "servicio")?.value["label"]
        if(!attr) continue
        for(const combo of combos) {
            let count = 0
            if(guias.length >= item.quantity) {
                count = 0
                break
            }
            const service = combo.lineItems.find(line => line.variant.attributes?.find(attr => attr.name == "servicio")?.value["label"] == attr)?.id
            if(!service) continue
        debugger
            const jsonService = combo.custom?.fields["services"] && JSON.parse(combo?.custom?.fields["services"])
            if(!jsonService) continue
            if(jsonService[service].guides.length <= 0) continue
            for(const guide of jsonService[service].guides) {
                if(guias.length >= item.quantity) break
                //@ts-ignore
                guias.push(guide)
                count ++
                const ordenFind = ordenToDeleteGuide.find(orden => orden.id == combo.id)
                if(!ordenFind) ordenToDeleteGuide.push({id: combo.id, version: combo.version, type: attr, quantity: count })
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
            });
        }
        for(const guidesToDelete of ordenToDeleteGuide){
            const combo = combos.find(combo => combo.id == guidesToDelete.id)
            if(!combo) continue
            debugger
            const service = combo.lineItems.find(line => line.variant.attributes?.find(attr => attr.name == "servicio")?.value["label"] == attr)?.id
            if(!service) continue
            const jsonService = combo.custom?.fields["services"] && JSON.parse(combo?.custom?.fields["services"])
            const guides = jsonService[service].guides.slice(item.quantity)
            const newServiceJson = {
                [service]: {
                    code: "",
                    sku: "",
                    orderSap: "",
                    guides: [
                        ...guides,
                    ]
                }
            }
            await apiRoot.orders().withId({ID: guidesToDelete.id}).post({
            body: {
                version: guidesToDelete.version,
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
        const attrService = line.variant.attributes?.find(item => item.name == "servicio")?.value["label"]
        if (attrService == "DIA SIGUIENTE") {
          const quantityGuideAvailables = customer.custom?.fields["quantity-guides-dia-siguiente"]
          const quantityNew = quantityGuideAvailables - line.quantity
          const updateQuantityUser = await apiRoot.customers().withId({ ID: customer.id }).post({
            body: {
              version: versionCustomer,
              actions: [
                {
                  action: "setCustomField",
                  name: "quantity-guides-dia-siguiente",
                  value: quantityNew
                }
              ]
            }
          }).execute()
          versionCustomer = updateQuantityUser.body.version
          guidesDiaSiguienteAvailables = customer.custom?.fields['quantity-guides-dia-siguiente-used'] + 1
        }
        else if (attrService == "TERRESTRE") {
          const quantityGuideAvailables = customer.custom?.fields["quantity-guides-terrestres"]
          const quantityNew = quantityGuideAvailables - line.quantity
          const updateQuantityUser = await apiRoot.customers().withId({ ID: customer.id }).post({
            body: {
              version: versionCustomer,
              actions: [
                {
                  action: "setCustomField",
                  name: "quantity-guides-terrestres",
                  value: quantityNew
                }
              ]
            }
          }).execute()
          versionCustomer = updateQuantityUser.body.version
          guidesTerrestresAvailables = customer.custom?.fields['quantity-guides-terrestres-used'] + line.quantity
        }
        else if (attrService == "DOS DIAS") {
          const quantityGuideAvailables = customer.custom?.fields["quantity-guides-dos-dias"]
          const quantityNew = quantityGuideAvailables - line.quantity
          const updateQuantityUser = await apiRoot.customers().withId({ ID: customer.id }).post({
            body: {
              version: versionCustomer,
              actions: [
                {
                  action: "setCustomField",
                  name: "quantity-guides-dos-dias",
                  value: quantityNew
                }
              ]
            }
          }).execute()
          versionCustomer = updateQuantityUser.body.version
          guidesDosDiasAvailables = customer.custom?.fields['quantity-guides-dos-dias-used'] + line.quantity
        }
  
        else if (attrService == "12:30") {
          const quantityGuideAvailables = customer.custom?.fields["quantity-guides-doce-treinta"]
          const quantityNew = quantityGuideAvailables - line.quantity
          const updateQuantityUser = await apiRoot.customers().withId({ ID: customer.id }).post({
            body: {
              version: versionCustomer,
              actions: [
                {
                  action: "setCustomField",
                  name: "quantity-guides-doce-treinta",
                  value: quantityNew
                }
              ]
            }
          }).execute()
          versionCustomer = updateQuantityUser.body.version
          guidesDoceTreinteAvailables = customer.custom?.fields['quantity-guides-doce-treinta-used'] + line.quantity 
        }
      }

      await updateUserWithGuidesAvailables(customer.id, versionCustomer, guidesTerrestresAvailables, guidesDosDiasAvailables, guidesDiaSiguienteAvailables, guidesDoceTreinteAvailables)
    debugger
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
