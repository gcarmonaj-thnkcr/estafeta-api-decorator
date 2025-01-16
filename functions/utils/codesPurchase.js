"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCode = void 0;
//TODO: Ajustar codigos de servicios correspondientes a prod
const codes = {
    ["12:30"]: { code: "H8" },
    ["reexpedicion"]: { code: "RX" },
    ["seguro-opcional"]: { code: "SG" },
    ["sobrepeso"]: { code: "SP" },
    ["enBio"]: { code: "ENBIO" },
    ["manejo-especial"]: { code: "EI" },
    ["manejo"]: { code: "EI" },
    ["seguro"]: { code: "SG" },
    ["cargo-combustible"]: { code: "CB" },
    ["combustible-por-peso"]: { code: "CBS" },
    ["DIA SIGUIENTE"]: { code: "68" },
    ["DIA SIGUIENTE-cargo"]: { code: "6CB" },
    ["DIA SIGUIENTE-cargo-por-peso"]: { code: "6CBS" },
    ["TERRESTRE"]: { code: "78" },
    ["TERRESTRE-cargo"]: { code: "7CB" },
    ["TERRESTRE-cargo-por-peso"]: { code: "7CBS" },
    ["DOS DIAS"]: { code: "D8" },
    ["DOS DIAS-cargo"]: { code: "DCB" },
    ["DOS DIAS-cargo-por-peso"]: { code: "DCBS" },
    ["SERVICIO GLOBAL EXPRESS PREPAGADO"]: { code: "88" },
    ["USA ECONOMICO PREPAGADO"]: { code: "G8" },
};
const getCode = (name) => codes[name];
exports.getCode = getCode;
