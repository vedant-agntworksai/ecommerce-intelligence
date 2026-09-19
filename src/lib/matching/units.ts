const volumeToFlOz:Record<string,number>={floz:1,fl_oz:1,gallon:128,gal:128,quart:32,qt:32,pint:16,pt:16,liter:33.814,l:33.814,milliliter:0.033814,ml:0.033814};
const weightToOz:Record<string,number>={oz:1,ounce:1,pound:16,lb:16,gram:0.035274,g:0.035274,kilogram:35.274,kg:35.274};

export type NormalizedMeasure={quantity:number;unit:"fl_oz"|"oz"|"count";dimension:"volume"|"weight"|"count"};

export function normalizeMeasure(quantity:number,unit:string):NormalizedMeasure|null{
  const key=unit.toLowerCase().replace(/[.\s-]/g,"_")
    .replace(/fluid_ounces?/,"fl_oz").replace(/ounces?/,"oz").replace(/gallons?/,"gallon")
    .replace(/quarts?/,"quart").replace(/pints?/,"pint").replace(/pounds?/,"pound")
    .replace(/liters?/,"liter").replace(/milliliters?/,"milliliter").replace(/grams?/,"gram")
    .replace(/kilograms?/,"kilogram").replace(/^units?$|^count$|^ct$/,"count");
  if(volumeToFlOz[key]!=null)return{quantity:quantity*volumeToFlOz[key],unit:"fl_oz",dimension:"volume"};
  if(weightToOz[key]!=null)return{quantity:quantity*weightToOz[key],unit:"oz",dimension:"weight"};
  if(key==="count")return{quantity,unit:"count",dimension:"count"};
  return null;
}

export function parseMeasure(text:string|undefined|null):NormalizedMeasure|null{
  if(!text)return null;
  const normalized=text.toLowerCase().replace(/fluid\s*ounces?/g,"fl oz");
  const match=normalized.match(/(\d+(?:\.\d+)?)\s*(fl\s*oz|gallons?|gal|quarts?|qt|pints?|pt|ounces?|oz|pounds?|lbs?|lb|kilograms?|kg|grams?|g|liters?|litres?|l|milliliters?|millilitres?|ml|count|ct|units?)/i);
  if(!match)return null;
  const raw=match[2].replace(/\s+/g,"");
  const aliases:Record<string,string>={"floz":"fl_oz","lbs":"lb","litre":"liter","litres":"liter","millilitre":"milliliter","millilitres":"milliliter","ct":"count"};
  return normalizeMeasure(Number(match[1]),aliases[raw]??raw);
}

export function compatibleMeasures(a:NormalizedMeasure,b:NormalizedMeasure){return a.dimension===b.dimension;}
export function unitPrice(price:number|null|undefined,quantity:number|null|undefined,unit:string|null|undefined){
  if(price==null||quantity==null||!unit||quantity<=0)return null;
  return {value:price/quantity,unit};
}
