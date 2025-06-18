import { Router } from "express";
import { apiRoot } from "../../commercetools/client";

const router = Router();

router.post("/order", async (request, reply): Promise<any> => {
  const { order, qr, user, idOrden } = request.body;
  if (!order || !qr || !user) {
    return reply.status(400).send({ error: "Faltan datos requeridos" });
  }
  const customObjectOrder = await apiRoot
    .customObjects()
    .post({
      body: {
        container: "orders",
        key: qr,
        value: {
          order,
          qr,
          user,
          idOrden,
        },
      },
    })
    .execute();
  reply.status(201).send({ id: customObjectOrder.body.id });
});

router.put("/order", async (request, reply): Promise<any> => {
  const { order, qr, user, idOrden } = request.body;
  if (!order || !qr || !user || !idOrden) {
    return reply.status(400).send({ error: "Faltan datos requeridos" });
  }
  const customObjectOrder = await apiRoot
    .customObjects()
    .post({
      body: {
        container: "orders",
        key: qr,
        value: {
          order,
          qr,
          user,
          idOrden,
        },
      },
    })
    .execute();
  reply.status(200).send({ id: customObjectOrder.body.id });
  return;
});

router.get("/order/:id", async (request, reply): Promise<any> => {
  try {
    console.log(request.params.id);
    const order = await apiRoot
      .customObjects()
      .get({
        queryArgs: {
          where: `value (order ( id in ("${request.params.id}")))`,
        },
      })
      .execute();
    if (
      !order.statusCode ||
      order.statusCode >= 300 ||
      order.body.results.length <= 0
    ) {
      return reply.status(404).send({ error: "Orden no encontrada" });
    }
    order.body.results[0].value.order.createdAt =
      order.body.results[0].createdAt;
    reply.send(order.body.results[0].value);
  } catch (error: any) {
    reply.status(400).send({ error: error.message });
  }
});

router.get("/orders/:id", async (request, reply): Promise<any> => {
  try {
    console.log(request.params.id);
    const customObjectsOrders = await apiRoot
      .customObjects()
      .get({
        queryArgs: {
          where: `value (idOrden in ("${request.params.id}"))`,
        },
      })
      .execute();
    if (
      !customObjectsOrders.statusCode ||
      customObjectsOrders.statusCode >= 300 ||
      customObjectsOrders.body.results.length <= 0
    ) {
      return reply.status(404).send({ error: "Orden no encontrada" });
    }
    const orders = [];
    for (const order of customObjectsOrders.body.results) {
      order.value.order.createdAt = order.createdAt;
      orders.push(order.value);
    }
    reply.send(orders);
  } catch (error: any) {
    reply.status(400).send({ error: error.message });
  }
});

router.get("/order/qr/:qr", async (request, reply): Promise<any> => {
  try {
    const customObjectsOrders = await apiRoot
      .customObjects()
      .withContainerAndKey({
        container: "orders",
        key: request.params.qr,
      })
      .get()
      .execute();
    if (
      !customObjectsOrders.statusCode ||
      customObjectsOrders.statusCode >= 300 ||
      !customObjectsOrders.body
    ) {
      return reply.status(404).send({ error: "Orden no encontrada" });
    }
    customObjectsOrders.body.value.order.createdAt =
      customObjectsOrders.body.createdAt;
    console.log(customObjectsOrders.body.value.order);
    reply.send(customObjectsOrders.body.value);
  } catch (error: any) {
    reply.status(400).send({ error: error.message });
  }
});

router.get("/order/user/:id", async (request, reply): Promise<any> => {
  try {
    const customObjectsOrders = await apiRoot
      .customObjects()
      .get({
        queryArgs: {
          where: `value (user in ("${request.params.id}"))`,
        },
      })
      .execute();
    if (
      !customObjectsOrders.statusCode ||
      customObjectsOrders.statusCode >= 300 ||
      customObjectsOrders.body.results.length <= 0
    ) {
      return reply.status(404).send({ error: "Orden no encontrada" });
    }
    const orders = [];
    for (const order of customObjectsOrders.body.results) {
      order.value.order.createdAt = order.createdAt;
      orders.push(order.value);
    }
    const orderItems = Object.values(
      orders.reduce((acc, item) => {
        if (!acc[item.idOrden]) acc[item.idOrden] = item;
        return acc;
      }, {}),
    );
    reply.send(orderItems);
  } catch (error: any) {
    reply.status(400).send({ error: error.message });
  }
});

export default router;
