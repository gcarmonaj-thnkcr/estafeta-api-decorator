import { apiRoot } from "../commercetools/client";

export const getCustomObjectByQr = async (qr: string) => {
  try {
    const customObjectsOrders = await apiRoot.customObjects().withContainerAndKey({
      container: "orders",
      key: qr
    }).get().execute()
    if (!customObjectsOrders.statusCode || customObjectsOrders.statusCode >= 300 || !customObjectsOrders.body) {
      return {}
    }
    customObjectsOrders.body.value.order.createdAt = customObjectsOrders.body.createdAt
    console.log(customObjectsOrders.body.value.order)
    return customObjectsOrders.body.value
  } catch (error: any) {
    return {}
  }
}
