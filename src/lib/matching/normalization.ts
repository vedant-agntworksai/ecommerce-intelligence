export const normalizeText=(value:string|undefined|null)=>(value??"").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g," ").trim();
export const normalizeIdentifier=(value:string|undefined|null)=>(value??"").replace(/[^A-Za-z0-9]/g,"").toUpperCase()||null;
