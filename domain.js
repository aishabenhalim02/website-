import {Coordinates, CalculationMethod, PrayerTimes, Madhab} from 'adhan';
export const methods = ['MuslimWorldLeague','Egyptian','Karachi','UmmAlQura'];
export function timetable(month, method='MuslimWorldLeague', school='Shafi') {
 if(!/^\d{4}-\d{2}$/.test(month)||!methods.includes(method)||!['Shafi','Hanafi'].includes(school)) throw Error('Invalid month, method or Asr school');
 const [y,m]=month.split('-').map(Number);
 if(y<2020||y>2100||m<1||m>12) throw Error('Month outside supported range');
 const params=CalculationMethod[method](); params.madhab=Madhab[school];
 return Array.from({length:new Date(Date.UTC(y,m,0)).getUTCDate()},(_,i)=>{
  const date=new Date(y,m-1,i+1,12); const p=new PrayerTimes(new Coordinates(35.8992,14.5141),date,params);
  return {date:`${month}-${String(i+1).padStart(2,'0')}`,times:Object.fromEntries(['fajr','sunrise','dhuhr','asr','maghrib','isha'].map(k=>[k,p[k].toISOString()]))};
 });
}
export function assessProduct(p) {
 const ingredients=p.ingredients_text_en||p.ingredients_text||'';
 const concerns=[];
 if(/\b(pork|lard|bacon|porcine)\b/i.test(ingredients)) concerns.push('The ingredient list mentions pork or a pork derivative. Confirm the current packaging with the manufacturer.');
 if(/\b(alcohol|ethanol|wine|beer|rum|gelatin|gelatine|rennet|e471|e472)\b/i.test(ingredients)) concerns.push('Alcohol or an ingredient with potentially variable sourcing appears in the data. Source and processing evidence is required.');
 return {status:'Needs Further Verification',ingredients,concerns:concerns.length?concerns:[ingredients?'No obvious concern was identified by this limited keyword check. It does not verify sourcing, processing or certification.':'Ingredient information is missing.'],explanation:'Open Food Facts is community-maintained. No independently validated, product-specific certification has been established by MMS.'};
}
