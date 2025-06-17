import { schedule } from "@netlify/functions";
import { apiRoot } from "./commercetools/client";
import { Order } from "@commercetools/platform-sdk";

const taskOrders = async () => {
  try {
    console.log("Ejecutando cron job");

    const customOStatus = await apiRoot
      .customObjects()
      .withContainer({ container: "orderStatus" })
      .get()
      .execute();

    if (!customOStatus.statusCode || customOStatus.statusCode >= 300)
      return { statusCode: 500, body: "No hay órdenes a actualizar" };

    if (customOStatus.body.results.length <= 0)
      return { statusCode: 200, body: "Sin órdenes pendientes" };

    console.log(
      "Órdenes a ejecutar encontradas:",
      customOStatus.body.results.length,
    );

    for (const statusOrders of customOStatus.body.results) {
      const dateOrder = new Date(statusOrders.lastModifiedAt);
      const dateNow = new Date();
      const diffInMinutes =
        (dateNow.getTime() - dateOrder.getTime()) / (1000 * 60);

      if (diffInMinutes < 15) {
        console.log("Esta orden aún no tiene los 15 minutos");
        continue;
      }

      const services = JSON.parse(
        statusOrders.value.order.custom.fields["services"],
      );

      for (const item of statusOrders.value.order.lineItems) {
        for (const guide of services[item.id].guides) {
          if (guide.status === "EN PROCESO") guide.status = "DISPONIBLE";
        }
      }

      if (statusOrders.value.isOrdenCustom === "No") {
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
      } else {
        const orders = await apiRoot
          .customObjects()
          .withContainer({ container: "orders" })
          .get({
            queryArgs: {
              where: `value (order (id in ("${statusOrders.value.order.id}")))`,
            },
          })
          .execute();

        for (const order of orders.body.results) {
          const ordenN: Order = {
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

      console.log("Orden procesada y eliminada");
    }

    return { statusCode: 200, body: "Proceso finalizado" };
  } catch (e: any) {
    console.error(e);
    return { statusCode: 500, body: e.message };
  }
};

export const handler = schedule("*/1 * * * *", async () => {
  console.log("Netlify Scheduled Function is running!");
  return { statusCode: 200, body: "Test cron ran" };
});
