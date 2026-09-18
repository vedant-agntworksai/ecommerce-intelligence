const volumeToFlOz:Record<string,number>={floz:1,fl_oz:1,gallon:128,gal:128,quart:32,qt:32,pint:16,pt:16,liter:33.814,l:33.814,milliliter:0.033814,ml:0.033814};
const weightToOz:Record<string,number>={oz:1,ounce:1,pound:16,lb:16,gram:0.035274,g:0.035274,kilogram:35.274,kg:35.274};
export type NormalizedMeasure={quantity:number;unit:"fl_oz"|"oz"|"count";dimension:"volume"|"weight"|"count"};
export function normalizeMeasure(quantity:number,unit:string):NormalizedMeasure|null{
  const key=unit.toLowerCase().replace(/[.\s-]/g,"_").replace(/fluid_ounces?/,"fl_oz").replace(/ounces?/,"oz").replace(/gallons?/,"gallon").replace(/quarts?/,"quart").replace(/pints?/,"pint").replace(/pounds?/,"pound").replace(/liters?/,"liter").replace(/milliliters?/,"milliliter").replace(/grams?/,"gram").replace(/kilograms?/,"kilogram").replace(/^units?$|^count$/,"count");
  if(volumeToFlOz[key]!=null)return{quantity:quantity*volumeToFlOz[key],unit:"fl_oz",dimension:"volume"};
  if(weightToOz[key]!=null)return{quantity:quantity*weightToOz[key],unit:"oz",dimension:"weight"};
  if(key==="count")return{quantity,unit:"count",dimension:"count"};
  return null;
}
export function compatibleMeasures(a:NormalizedMeasure,b:NormalizedMeasure){return a.dimension===b.dimension;}
