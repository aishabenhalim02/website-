import test from 'node:test';
import assert from 'node:assert/strict';
import {timetable, assessProduct} from '../domain.js';
test('Malta month contains ordered prayers and leap years',()=>{
 const days=timetable('2028-02');assert.equal(days.length,29);assert.equal(days[28].date,'2028-02-29');
 for(const d of days){const t=Object.values(d.times).map(x=>new Date(x).getTime());assert.ok(t.every((v,i)=>i===0||v>t[i-1]));}
});
test('Malta timezone respects the March daylight saving transition',()=>{
 const d=timetable('2026-03');const fmt=x=>new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Malta',hour:'2-digit',hourCycle:'h23'}).format(new Date(x));
 const before=Number(fmt(d[27].times.dhuhr)),after=Number(fmt(d[28].times.dhuhr));assert.equal(after,before+1);
});
test('Hanafi Asr is later and invalid configuration is rejected',()=>{
 assert.ok(new Date(timetable('2026-11','MuslimWorldLeague','Hanafi')[0].times.asr)>new Date(timetable('2026-11')[0].times.asr));
 for(const month of ['2026-13','2026-00','bad','2019-11'])assert.throws(()=>timetable(month));assert.throws(()=>timetable('2026-11','unknown'));
});
test('Incomplete ingredients and database labels never establish certification',()=>{
 for(const p of [{},{ingredients_text:'Sugar, milk',labels:'halal'},{ingredients_text:'Pork gelatin, E471, wine'}])assert.equal(assessProduct(p).status,'Needs Further Verification');
 assert.match(assessProduct({ingredients_text:'Pork gelatin'}).concerns.join(' '),/pork/i);
});
