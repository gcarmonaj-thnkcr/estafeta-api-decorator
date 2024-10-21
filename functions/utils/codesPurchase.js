"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCode = void 0;
const codes = {
    ["12:30"]: { code: "H8" },
    ["reexpedicion"]: { code: "RX" },
    ["seguro-opcional"]: { code: "SG" },
    ["sobrepeso"]: { code: "SP" },
    ["enBio"]: { code: "ENBIO" },
    ["manejo-especial"]: { code: "EI" },
    ["manejo"]: { code: "EI" },
    ["seguro"]: { code: "SG" },
    ["12:30-cargo"]: { code: "HCB" },
    ["12:30-combustible-por-peso"]: { code: "HCBS" },
    ["DIA SIGUIENTE"]: { code: "62" },
    ["DIA SIGUIENTE-cargo"]: { code: "6CB" },
    ["DIA SIGUIENTE-cargo-por-peso"]: { code: "6CBS" },
    ["TERRESTRE"]: { code: "72" },
    ["TERRESTRE-cargo"]: { code: "7CB" },
    ["TERRESTRE-cargo-por-peso"]: { code: "7CBS" },
    ["DOS DIAS"]: { code: "D2" },
    ["DOS DIAS-cargo"]: { code: "DCB" },
    ["DOS DIAS-cargo-por-peso"]: { code: "DCBS" },
    ["SERVICIO GLOBAL EXPRESS PREPAGADO"]: { code: "88" },
    ["USA ECONOMICO PREPAGADO"]: { code: "G8" },
};
const getCode = (name) => codes[name];
exports.getCode = getCode;
