export const invertPrice  = (price: number, vatAppliend: number): number => {
    if(vatAppliend == 0) return price
    if(!vatAppliend) vatAppliend = 16
    const iva = 1 + (vatAppliend / 100)
    const newPrice = price / iva 
    return parseFloat(newPrice.toFixed(6))
}
