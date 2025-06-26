import { Router, Request, Response } from "express";
import { validateToken } from "../../jsonToken/token";
import { apiRoot } from "../../commercetools/client";
import { FormaterDate } from "../../utils/formaterDate";
import axios from "axios";
import { Order } from "@commercetools/platform-sdk";
import { getCustomObjectByQr } from "../../utils/customObjectsFunction";

const router = Router();

router.get(
  "/pdv-services",
  validateToken,
  async (req: Request, res: Response): Promise<any> => {
    const qr = req.headers.qr;
    if (!qr || qr == "") return res.sendStatus(404);
    const order = await apiRoot
      .orders()
      .search()
      .post({
        body: {
          query: {
            fullText: {
              field: "custom.services",
              value: qr,
              customType: "StringType",
            },
          },
        },
      })
      .execute();

    let searchOrder: Order = {} as Order;
    let userId: string = "";
    if (order.body.hits.length <= 0) {
      //@ts-ignore
      const order = await getCustomObjectByQr(qr);
      searchOrder = order.order;
      userId = order.user;
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
    }
    const customer = await apiRoot
      .customers()
      .withId({ ID: userId })
      .get()
      .execute();
    const customObject =
      searchOrder.custom?.fields["services"] &&
      JSON.parse(searchOrder.custom.fields["services"]);
    let servicesFind;
    const lineItems = searchOrder.lineItems.filter(
      (item) => item.variant.attributes?.length ?? 0 > 0,
    );
    try {
      for (const line of lineItems) {
        console.log(customObject[line.id]);
        servicesFind = customObject[line.id].find((item: any) => item.QR == qr);
        if (servicesFind) break;
      }
    } catch (err) {
      for (const line of lineItems) {
        console.log("Id custom", customObject[line.id]);
        servicesFind = customObject[line.id].guides.find(
          (item: any) => item.QR == qr,
        );
        if (servicesFind) break;
      }
    }
    console.log("Servicesfind", servicesFind);
    const { origin, destination } = servicesFind.address;

    const betweenRoadsOrigin = origin?.optionalAddress1?.includes("?")
      ? origin.optionalAddress1.split("?")
      : [origin.optionalAddress1];
    const betweenRoadsDestination = destination?.optionalAddress1?.includes("?")
      ? destination.optionalAddress1.split("?")
      : [destination.optionalAddress1];

    const regex =
      /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\d[ABCEGHJ-NPRSTV-Z]\d$/;

    let destinationZipCode = destination.postalCode;

    if (
      destination.countryCodeAlfa3 === "CAN" &&
      !regex.test(destinationZipCode)
    ) {
      destinationZipCode = "A1A1A1";
    }

    const responseObject = {
      pdvService: {
        storeServiceOrder: searchOrder.id,
        PurchaseOrder:
          searchOrder.orderNumber ??
          searchOrder.custom?.fields?.["pickupNumber"] ??
          "",
        waybill:
          !servicesFind.status || servicesFind.status == "CANCELADO"
            ? ""
            : servicesFind?.guide,
        idcaStoreClient: searchOrder.customerId,
        eMailClient: customer.body.email,
        idcaServiceWarranty: servicesFind.guide[13],
        idcaServiceModality: servicesFind.guide[14],
        isPudo: servicesFind.isPudo ? "1" : "0",
        isPackage: servicesFind.isPackage ? "1" : "0",
        itemLength: servicesFind?.itemLength ?? "",
        itemHeight: servicesFind?.itemHeight ?? "",
        itemWidth: servicesFind?.itemWidth ?? "",
        itemVolumen: servicesFind?.itemVolumen ?? "",
        isItemDimensionsExceeded: servicesFind.isItemDimensionsExceeded
          ? "1"
          : "0",
        itemWeight: servicesFind?.itemWeight ?? "",
        isItemWeightExceeded: servicesFind.isItemWeightExceeded ? "1" : "0",
        statusServiceOrder: servicesFind?.status ?? "DISPONIBLE",
        QRCode: "", // Vacio
        QRCodeMD5: servicesFind.QR,
        TarriffFractionCode: "0",
        consultaId: "99999999", /// Revisarlo con Memo
        createdDate: FormaterDate(searchOrder.createdAt, false),
        availabledDate: `${FormaterDate(new Date(searchOrder.createdAt).toISOString(), false)} - ${FormaterDate(new Date(new Date(searchOrder.createdAt).setDate(new Date(searchOrder.createdAt).getDate() + 30)).toISOString(), false)}`,
        sender: {
          eMailClient: origin.email, //email del remitente
          isPudo: origin.isPudo ? "1" : "0",
          EquivalentCode: "",
          TyoeLocationName: "",
          SpaceOwnerName: "",
          isSender: "1",
          Alias: origin.alias,
          TaxPayer: "",
          CompleteName: `${origin?.firstName ?? ""} ${origin?.lastName ?? ""} ${origin?.middleName ?? ""}`,
          zipCode: origin.postalCode,
          roadTypeCode: "9999",
          roadTypeName: origin.road,
          street: origin.street,
          externalNum: origin.exteriorNumber,
          indoreInformation: origin?.interiorNumber ?? "",
          settlementTypeCode: "999",
          settlementTypeName: origin?.settlement,
          SettlementTypeAbbName: origin?.settlement?.slice(0, 3),
          settlementName: origin.neighborhood,
          twnshipCode: "",
          twnshipName: origin.city,
          stateCode: origin.stateCode,
          stateName: origin.state,
          countryCode: "MX",
          countryCodeAlfa3: "MEX",
          countryName: "México",
          betweenRoadName1:
            betweenRoadsOrigin[0] ??
            (origin?.optionalAddress1 == " y " ? "" : ""),
          betweenRoadName2: betweenRoadsOrigin[1] ?? " ",
          AddressReference: origin?.reference ?? "",
          CountryCodePhone: "",
          LandlinePhone: origin.phone1,
          CellPhone: origin?.phon2 ?? "",
          ContacteMail: origin.email,
          Latitude: 99999.99,
          Longitude: 99999.99,
          IsActive: "True",
          recipient: {
            eMailClient: destination.email, //email del destinatario
            isPudo: servicesFind.isPudo ? "1" : "0",
            EquivalentCode: servicesFind.isPudo
              ? destination?.pudoinfo?.[0]?.EquivalentCode
              : "",
            TyoeLocationName: servicesFind.isPudo
              ? destination?.pudoinfo?.[0]?.SpaceOwnerName
              : "",
            SpaceOwnerName: servicesFind.isPudo
              ? destination?.pudoinfo?.[0]?.OwnerCode
              : "",
            isSender: "0",
            Alias: destination.alias,
            TaxPayer: "",
            CompleteName: `${destination?.firstName ?? ""} ${destination?.lastName ?? ""} ${destination?.middleName ?? ""}`,
            zipCode: destinationZipCode,
            roadTypeCode: "",
            roadTypeName: destination.road,
            street: destination.street,
            externalNum: destination.exteriorNumber,
            indoreInformation: destination?.interiorNumber ?? "",
            settlementTypeCode: "",
            settlementTypeName: destination.settlement,
            SettlementTypeAbbName: destination.settlement.slice(0, 3),
            settlementName: destination.neighborhood,
            twnshipCode: "",
            twnshipName: destination.city,
            stateCode: destination.stateCode,
            stateName: destination.state,
            countryCode: destination.countryCodeAlfa2
              ? destination.countryCodeAlfa2
              : "MX",
            countryCodeAlfa3:
              destination.countryCodeAlfa3 &&
              destination.countryCodeAlfa3 !== ""
                ? destination.countryCodeAlfa3
                : "MEX",
            countryName:
              destination.country && destination.country !== "MX"
                ? destination.country
                : "México",
            betweenRoadName1:
              betweenRoadsDestination[0] ??
              (destination?.optionalAddress1 == " y " ? "" : ""),
            betweenRoadName2: betweenRoadsDestination[1] ?? "",
            AddressReference: destination?.reference ?? "",
            CountryCodePhone: "",
            LandlinePhone: destination.phone1,
            CellPhone: destination?.phon2 ?? "",
            ContacteMail: destination.email,
            Latitude: 99999.99,
            Longitude: 99999.99,
            IsActive: "True",
          },
        },
      },
    };

    res.json({
      statusCode: 200,
      resultCode: 0,
      resultDescription: "",
      body: responseObject,
    });
  },
);

export default router;
