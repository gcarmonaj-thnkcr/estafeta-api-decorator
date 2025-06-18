import cron from "node-cron";
import { apiRoot } from "../commercetools/client";
import { Order } from "@commercetools/platform-sdk";

export const validateStatus = cron.schedule("*/1 * * * *", async () => {
  console.log("Ejecutando cron job");
  const customOStatus = await apiRoot
    .customObjects()
    .withContainer({ container: "orderStatus" })
    .get({
      queryArgs: {
        limit: 500,
      },
    })
    .execute();
  if (!customOStatus.statusCode || customOStatus.statusCode >= 300)
    return console.error("No hay ordenes a actualizar");
  if (customOStatus.body.results.length <= 0)
    return console.error("No hay ordenes a actualizar");
  console.log(
    "Ordenes a ejecutar encontradas:",
    customOStatus.body.results.length,
  );
  for (const statusOrders of customOStatus.body.results) {
    const dateOrder = new Date(statusOrders.lastModifiedAt);
    const dateNow = new Date();
    const diffInMilliseconds: number = dateNow.getTime() - dateOrder.getTime();

    const diffInMinutes = diffInMilliseconds / (1000 * 60);

    if (diffInMinutes < 15) {
      console.log("Esta orden aun no tiene los 15 minutos");
      continue;
    }
    const services = JSON.parse(
      statusOrders.value.order.custom.fields["services"],
    );
    for (const item of statusOrders.value.order.lineItems) {
      for (const guide of services[item.id].guides) {
        if (guide.status == "EN PROCESO") guide.status = "DISPONIBLE";
      }
    }
    try {
      const orden = await apiRoot
        .orders()
        .withId({ ID: statusOrders.value.order.id })
        .get()
        .execute();

      await apiRoot
        .orders()
        .withId({ ID: orden.body.id })
        .post({
          body: {
            version: orden.body.version,
            actions: [
              {
                action: "setCustomField",
                name: "services",
                value: JSON.stringify(services),
              },
            ],
          },
        })
        .execute();
    } catch (_) {
      console.log("Llegue");
      const orders = await apiRoot
        .customObjects()
        .withContainer({ container: "orders" })
        .get({
          queryArgs: {
            where: `value (order (id in ("${statusOrders.value.order.id}")))`,
          },
        })
        .execute();
      console.log(orders.body.results.length);
      for (const order of orders.body.results) {
        let ordenN: Order = {
          ...order.value.order,
          custom: {
            type: {
              id: order.value.order.custom?.type?.id ?? "",
              typeId: order.value.order.custom?.type?.typeId ?? "type",
            },
            fields: {
              ...order.value.order.custom?.fields,
              services: JSON.stringify(services),
            },
          },
        };

        await apiRoot
          .customObjects()
          .post({
            body: {
              container: "orders",
              key: order.key,
              value: {
                order: ordenN,
                qr: order.key,
                user: order.value.user,
                idOrden: order.value.idOrden,
                isOrdenCustom: order.value.isOrdenCustom,
              },
            },
          })
          .execute();
      }
    }
    await apiRoot
      .customObjects()
      .withContainerAndKey({
        container: "orderStatus",
        key: statusOrders.key,
      })
      .delete({
        queryArgs: {
          version: statusOrders.version,
        },
      })
      .execute();
    console.log("Eliminado");
  }
});
