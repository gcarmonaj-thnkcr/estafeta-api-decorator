"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.newPickUp = void 0;
const axios_1 = __importDefault(require("axios"));
const auth_1 = require("./auth");
const newPickUp = (pickupOrder) => __awaiter(void 0, void 0, void 0, function* () {
    const token = yield (0, auth_1.authToken)({ type: "newPickUp" });
    const data = JSON.stringify(pickupOrder);
    const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://wspickup.estafeta.com/v2/MiEstafetaServices/rest/PickupAPI/NewPickup',
        headers: {
            'apikey': 'l706a9c7720e524ad2a0296b300db7955b',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        data: data
    };
    try {
        const request = yield axios_1.default.request(config);
        console.log("Request pickups", request);
        debugger;
        return request.data;
    }
    catch (err) {
        console.error("Error in pickup", err);
        return err.message;
    }
});
exports.newPickUp = newPickUp;
