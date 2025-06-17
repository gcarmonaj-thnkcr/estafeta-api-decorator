import { Router, Request, Response } from "express";
import { apiRoot } from "../../commercetools/client";
import { totalmem } from "os";
import { Order } from "@commercetools/platform-sdk";
import { getCustomObjectByQr } from "../../utils/customObjectsFunction";

const router = Router();

const validateWaybillRequest = (waybillService: any) => {
  const isValid = waybillService.every(
    (service: any) =>
      typeof service.storePortalOrder === "string" &&
      typeof service.storeFolioOrder === "string" &&
      typeof service.eMailClient === "string" &&
      typeof service.serviceWarranty === "string" &&
      typeof service.serviceModality === "string" &&
      typeof service.waybill === "string" &&
      typeof service.statusFolioOrder === "string" &&
      typeof service.usedDate === "string" &&
      typeof service.IsGenerator === "boolean",
  );

  return isValid;
};

router.post("/waybills", async (req: Request, res: Response): Promise<any> => {
  const { WaybillService } = req.body;

  const isValid = validateWaybillRequest(WaybillService);

  if (!isValid) {
    return res.status(400).send({ message: "Invalid WaybillService format." });
  }
  let resulWaylBill = [];
  for (const wayBillItem of WaybillService) {
    const order = await apiRoot
      .orders()
      .search()
      .post({
        body: {
          query: {
            fullText: {
              field: "custom.services",
              value: wayBillItem.qr,
              customType: "StringType",
            },
          },
        },
      })
      .execute();

    let searchOrder: Order = {} as Order;
    let userId: string = "";
    let idOrder: string = "";

    if (order.body.hits.length <= 0) {
      //@ts-ignore
      const order = await getCustomObjectByQr(wayBillItem.qr);
      searchOrder = order.order;
      userId = order.user;
      idOrder = order.order.id;
    } else {
      const getOrder = await apiRoot
        .orders()
        .withId({ ID: order.body.hits[0].id })
        .get()
        .execute();
      if (!getOrder.statusCode || getOrder.statusCode >= 300)
        return res.sendStatus(404);
      searchOrder = getOrder.body;
      userId = searchOrder?.customerId ?? "";
      idOrder = searchOrder.id;
    }

    console.log(searchOrder);
    const customObject =
      searchOrder.custom?.fields["services"] &&
      JSON.parse(searchOrder.custom.fields["services"]);
    let servicesFind;
    let idItem = "";
    try {
      for (const id in customObject) {
        servicesFind = customObject[id].find(
          (item: any) => item.QR == wayBillItem.qr,
        );
        if (!servicesFind) continue;
        idItem = id;
        break;
      }
    } catch (err) {
      for (const id in customObject) {
        servicesFind = customObject[id].guides.find(
          (item: any) => item.QR == wayBillItem.qr,
        );
        if (!servicesFind) continue;
        idItem = id;
        break;
      }
    }
    console.log("Esto actualizare", servicesFind);
    if (!servicesFind?.status || servicesFind?.status == "DISPONIBLE") {
      servicesFind.status = "EN PROCESO";
    } else {
      resulWaylBill.push({
        resultCode: "1",
        resultDescription: "El estado actual de la guía es En proceso",
      });
      continue;
    }
    console.log("Actualizado", customObject[idItem].guides);
    console.log(customObject);
    resulWaylBill.push({
      resultCode: "0",
      resultDescription: "Proceso completo",
      ResultWaybill: servicesFind.guide,
    });

    try {
      let ordenN: Order = {
        ...searchOrder,
        custom: {
          type: {
            id: searchOrder.custom?.type?.id ?? "",
            typeId: searchOrder.custom?.type?.typeId ?? "type",
          },
          fields: {
            ...searchOrder.custom?.fields,
            services: JSON.stringify(customObject),
          },
        },
      };

      await apiRoot
        .orders()
        .withId({ ID: searchOrder.id })
        .post({
          body: {
            version: searchOrder.version,
            actions: [
              {
                action: "setCustomField",
                name: "services",
                value: JSON.stringify(customObject),
              },
            ],
          },
        })
        .execute();

      await apiRoot
        .customObjects()
        .post({
          body: {
            container: "orderStatus",
            key: wayBillItem.qr,
            value: {
              order: ordenN,
              qr: wayBillItem.qr,
              user: userId,
              idOrden: idOrder,
              isOrdenCustom: "Si",
            },
          },
        })
        .execute();
    } catch (_) {
      const order = await apiRoot
        .customObjects()
        .get({
          queryArgs: {
            where: `value (order (id in ("${idOrder}")))`,
          },
        })
        .execute();

      let ordenN: Order = {
        ...searchOrder,
        custom: {
          type: {
            id: searchOrder.custom?.type?.id ?? "",
            typeId: searchOrder.custom?.type?.typeId ?? "type",
          },
          fields: {
            ...searchOrder.custom?.fields,
            services: JSON.stringify(customObject),
          },
        },
      };

      await apiRoot
        .customObjects()
        .post({
          body: {
            container: "orderStatus",
            key: wayBillItem.qr,
            value: {
              order: ordenN,
              qr: wayBillItem.qr,
              user: userId,
              idOrden: idOrder,
              isOrdenCustom: "No",
            },
          },
        })
        .execute();

      for (const orden of order.body.results) {
        await apiRoot
          .customObjects()
          .post({
            body: {
              container: "orders",
              key: orden.value.qr,
              value: {
                order: ordenN,
                qr: orden.value.qr,
                user: orden.value.user,
                idOrden: orden.value.orderId,
              },
            },
          })
          .execute();
      }
    }
  }

  //Si esta disonible cambiar a enproceso y retornar datos del waybill

  /// Extraer la guia disponible de las ordenes de combo
  /// Asignarla a la orden de servicio conservando la info de la orden de donde se extrajo
  /// Crear la estructura de data.WaybillService

  res.status(200).json(resulWaylBill[0]);
});

router.put("/waybills", async (req: Request, res: Response): Promise<any> => {
  const { AsignWaybillOrder } = req.body;

  const isValid = validateWaybillRequest(AsignWaybillOrder);

  if (!isValid) {
    return res.status(400).send({ message: "Invalid WaybillService format." });
  }

  let resulWaylBill = [];
  for (const wayBillItem of AsignWaybillOrder) {
    const order = await apiRoot
      .orders()
      .search()
      .post({
        body: {
          query: {
            fullText: {
              field: "custom.services",
              value: wayBillItem.qr,
              customType: "StringType",
            },
          },
        },
      })
      .execute();

    let searchOrder: Order = {} as Order;
    let userId: string = "";
    let idOrder: string = "";

    if (order.body.hits.length <= 0) {
      //@ts-ignore
      const order = await getCustomObjectByQr(wayBillItem.qr);
      searchOrder = order.order;
      userId = order.user;
      idOrder = order.order.id;
    } else {
      const getOrder = await apiRoot
        .orders()
        .withId({ ID: order.body.hits[0].id })
        .get()
        .execute();
      if (!getOrder.statusCode || getOrder.statusCode >= 300)
        return res.sendStatus(404);
      searchOrder = getOrder.body;
      userId = searchOrder?.customerId ?? "";
      idOrder = searchOrder.id;
    }

    const customObject =
      searchOrder.custom?.fields["services"] &&
      JSON.parse(searchOrder.custom.fields["services"]);
    let servicesFind;
    try {
      for (const id in customObject) {
        servicesFind = customObject[id].find(
          (item: any) => item.QR == wayBillItem.qr,
        );
        if (!servicesFind) continue;
      }
    } catch (err) {
      for (const id in customObject) {
        servicesFind = customObject[id].guides.find(
          (item: any) => item.QR == wayBillItem.qr,
        );
        if (!servicesFind) continue;
      }
    }
    if (servicesFind.status) {
      switch (wayBillItem.statusFolioOrder) {
        case "UTIL":
          servicesFind.status = "UTILIZADO";
          break;
        case "DISP":
          servicesFind.status = "DISPONIBLE";
          break;
        case "CANC":
          servicesFind.status = "CANCELADO";
          break;
        case "ENPR":
          servicesFind.status = "EN PROCESO";
          break;
      }
    }
    resulWaylBill.push({
      resultCode: 0,
      resultDescription: "Proceso satisfactorio.",
      resultAsignWaybill: [
        {
          resultCode: 0,
          resultDescription: "Registro actualizado",
          resultWayBill: servicesFind.guide,
        },
      ],
    });

    try {
      let ordenN: Order = {
        ...searchOrder,
        custom: {
          type: {
            id: searchOrder.custom?.type?.id ?? "",
            typeId: searchOrder.custom?.type?.typeId ?? "type",
          },
          fields: {
            ...searchOrder.custom?.fields,
            services: JSON.stringify(customObject),
          },
        },
      };

      await apiRoot
        .customObjects()
        .post({
          body: {
            container: "orderStatus",
            key: wayBillItem.qr,
            value: {
              order: ordenN,
              qr: wayBillItem.qr,
              user: userId,
              idOrden: idOrder,
              isOrdenCustom: "No",
            },
          },
        })
        .execute();
      await apiRoot
        .orders()
        .withId({ ID: searchOrder.id })
        .post({
          body: {
            version: searchOrder.version,
            actions: [
              {
                action: "setCustomField",
                name: "services",
                value: JSON.stringify(customObject),
              },
            ],
          },
        })
        .execute();
    } catch (_) {
      const order = await apiRoot
        .customObjects()
        .withContainer({ container: "orders" })
        .get({
          queryArgs: {
            where: `value (order (id in ("${idOrder}")))`,
          },
        })
        .execute();
      await apiRoot
        .customObjects()
        .withContainer({ container: "orderStatus" })
        .get({
          queryArgs: {
            where: `key in ("${wayBillItem.qr}")`,
          },
        })
        .execute();
      let ordenN: Order = {
        ...searchOrder,
        custom: {
          type: {
            id: searchOrder.custom?.type?.id ?? "",
            typeId: searchOrder.custom?.type?.typeId ?? "type",
          },
          fields: {
            ...searchOrder.custom?.fields,
            services: JSON.stringify(customObject),
          },
        },
      };

      try {
        const statusO = await apiRoot
          .customObjects()
          .withContainer({ container: "orderStatus" })
          .get({
            queryArgs: {
              where: `value (order (id in ("${idOrder}")))`,
            },
          })
          .execute();
        await apiRoot
          .customObjects()
          .withContainerAndKey({
            container: "orderStatus",
            key: wayBillItem.key,
          })
          .delete({
            queryArgs: {
              version: statusO.body.results[0].version,
            },
          })
          .execute();
      } catch (_) {}

      for (const orden of order.body.results) {
        await apiRoot
          .customObjects()
          .post({
            body: {
              container: "orders",
              key: orden.value.qr,
              value: {
                order: ordenN,
                qr: orden.value.qr,
                user: orden.value.user,
                idOrden: orden.value.orderId,
              },
            },
          })
          .execute();
      }
    }
  }

  res.status(200).json(resulWaylBill[0]);
});

export default router;
