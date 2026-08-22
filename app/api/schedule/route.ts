import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
const SUNDAY_SERVICE_TIME="19:00";
export const dynamic="force-dynamic";
const SHEET="https://docs.google.com/spreadsheets/d/135jibDGmn0r6prjmQfOwnkRYFIeQ114Zfjdfwaa_F4Q/export?format=xlsx";
const MONTHS=["JANEIRO","FEVEREIRO","MARÇO","ABRIL","MAIO","JUNHO","JULHO","AGOSTO","SETEMBRO","OUTUBRO","NOVEMBRO","DEZEMBRO"];
function subtractMinutes(time:string,minutes:number){
  const [hours,mins]=time.split(":").map(Number);
  const total=(hours*60+mins-minutes+24*60)%(24*60);
  return `${String(Math.floor(total/60)).padStart(2,"0")}:${String(total%60).padStart(2,"0")}`;
}
function timeFor(date:Date,isJA:boolean,values:string[]){
  const allValues=values.join(" ").toUpperCase();
  if(allValues.includes("EVANGELISMO"))return{label:"Evangelismo PNM",time:"A confirmar",arrival:"A confirmar",arrivalLabel:"Chegada"};
  const day=date.getUTCDay();
  const service=isJA
    ?{label:allValues.includes("EIC PNM")?"JA — EIC PNM":"JA",time:"17:00"}
    :day===3
      ?{label:"Quarta-feira",time:"20:00"}
      :day===6
        ?{label:"Sábado de manhã",time:"09:00"}
        :day===0
          ?{label:"Domingo",time:SUNDAY_SERVICE_TIME}
          :{label:"Programação",time:"A confirmar"};
  if(service.time==="A confirmar")return{...service,arrival:"A confirmar",arrivalLabel:"Chegada"};
  const instrumental=values[2]?.trim()||"";
  const isCdCantado=allValues.includes("CD CANTADO");
  if(isCdCantado)return{...service,arrival:subtractMinutes(service.time,15),arrivalLabel:"Chegada"};
  if(instrumental)return{...service,arrival:subtractMinutes(service.time,60),arrivalLabel:"Ensaio"};
  return{...service,arrival:"A confirmar",arrivalLabel:"Chegada"};
}
function parseSheet(ws:XLSX.WorkSheet,key:string){const rows=XLSX.utils.sheet_to_json<(string|number)[]>(ws,{header:1,defval:"",raw:true});const services:any[]=[];let isJA=false;for(const row of rows){const first=String(row[0]??"");if(first.toUpperCase().includes("ESCALA DE MÚSICA J.A")){isJA=true;continue}if(first==="Data"||typeof row[0]!=="number")continue;const date=XLSX.SSF.parse_date_code(row[0] as number);if(!date)continue;const d=new Date(Date.UTC(date.y,date.m-1,date.d)),values=row.slice(1,5).map(v=>String(v).trim()),meta=timeFor(d,isJA,values),songs=values[3].split("/").map(s=>s.trim()).filter(Boolean),note=values.join(" ").toUpperCase().includes("NÃO HAVERÁ")?"Não haverá programação":values.join(" ").toUpperCase().includes("JA EIC PNM")?"Programação EIC PNM":undefined;services.push({id:`${key}-${date.y}-${date.m}-${date.d}-${isJA?"ja":"culto"}-${services.length}`,date:d.toISOString(),day:date.d,monthLabel:MONTHS[date.m-1].slice(0,3),...meta,audiovisual:values[0],singers:values[1],instruments:values[2],songs,note})}return services.sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time))}
export async function GET(){try{const response=await fetch(SHEET,{cache:"no-store"});if(!response.ok)throw new Error("sheet");const book=XLSX.read(await response.arrayBuffer(),{type:"array"});const now=new Date(),current=now.getUTCFullYear()*100+now.getUTCMonth()+1;const sheets=book.SheetNames.map(name=>{const match=name.toUpperCase().match(/^(JANEIRO|FEVEREIRO|MARÇO|MARCO|ABRIL|MAIO|JUNHO|JULHO|AGOSTO|SETEMBRO|OUTUBRO|NOVEMBRO|DEZEMBRO)\s+(\d{2,4})$/);if(!match)return null;const mi=MONTHS.map(m=>m.normalize("NFD").replace(/[\u0300-\u036f]/g,"")).indexOf(match[1].normalize("NFD").replace(/[\u0300-\u036f]/g,""));let year=Number(match[2]);if(year<100)year+=2000;return{name,key:`${year}-${String(mi+1).padStart(2,"0")}`,sort:year*100+mi+1,label:`${MONTHS[mi][0]}${MONTHS[mi].slice(1).toLowerCase()} ${year}`}}).filter(Boolean) as any[];const available=sheets.filter(s=>s.sort>=current).slice(0,4);if(!available.length){const latest=sheets.sort((a,b)=>b.sort-a.sort)[0];if(latest)available.push(latest)}const months=available.sort((a,b)=>a.sort-b.sort).map(s=>({key:s.key,label:s.label,services:parseSheet(book.Sheets[s.name],s.key)}));return NextResponse.json({months,defaultMonth:months.find(m=>m.key===`${now.getUTCFullYear()}-${String(now.getUTCMonth()+1).padStart(2,"0")}`)?.key||months[0]?.key},{headers:{"Cache-Control":"public, max-age=300"}})}catch{return NextResponse.json({error:"Falha ao ler a planilha"},{status:502})}}
