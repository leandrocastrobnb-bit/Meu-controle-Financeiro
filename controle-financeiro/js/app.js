const DCATS=["Moradia","Contas da Casa","Alimentação","Transporte","Saúde","Educação","Lazer","Cartão de Crédito","Dívidas e Financiamentos","Assinaturas","Poupança e Investimentos","Outros"];
const PAYS=["Pix","Débito","Crédito","Boleto","Dinheiro","Débito automático"];
const MESES=["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const COLORS=["#3B6FF0","#12A15F","#E58A00","#8E5BD6","#E0443A","#1FA5B8","#D6559B","#7A9B2F","#F0702C","#4F6BD8","#2FA37A","#8794A8"];
const brl=n=>(+n||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const $=s=>document.querySelector(s);
const pad=n=>String(n).padStart(2,"0");
const today=new Date(),todayYM=today.getFullYear()+"-"+pad(today.getMonth()+1),TD=todayYM+"-"+pad(today.getDate());
let S={income:{},entries:[],cats:DCATS.slice()},tab="home",flt="all",fc="",q="",ps="",ym=todayYM,yr=today.getFullYear(),resetArm=false,nome="",email="",uid=null,foto="",emergency={tipo:"Fundo de emergência",meta:0,atual:0,prazo:"",obs:""};

/* A URL e a chave do Supabase ficam em js/config.js */
let sb=null;
try{sb=supabase.createClient(SUPABASE_URL,SUPABASE_KEY)}catch(e){}

const toRow=e=>({data_vencimento:e.date,descricao:e.desc,categoria:e.cat,tipo:e.type,forma_pagamento:e.pay,valor:e.val,valor_pago:e.valPaid||0,status:e.status,data_pagamento:e.paid||null});
const fromRow=r=>({id:r.id,date:r.data_vencimento,desc:r.descricao||"",cat:r.categoria,type:r.tipo||"",pay:r.forma_pagamento||"",val:+r.valor,valPaid:r.valor_pago==null?(r.status==="Pago"?+r.valor:0):+r.valor_pago,status:r.status,paid:r.data_pagamento||""});
function toast(m){const t=$("#toast");t.textContent=m;t.style.display="block";clearTimeout(t._t);t._t=setTimeout(()=>t.style.display="none",2400)}
function ok(r){if(r.error){toast("Erro: "+(r.error.message||"falha"));return false}return true}
const sum=a=>a.reduce((x,e)=>x+e.val,0);
const paidOf=e=>Math.min(e.val,Math.max(0,+e.valPaid||0));
const balanceOf=e=>Math.max(0,Math.round((e.val-paidOf(e))*100)/100);
const sumOpen=a=>a.reduce((x,e)=>x+(e.status==="Pago"?0:balanceOf(e)),0);
const sumPaid=a=>a.reduce((x,e)=>x+paidOf(e),0);
const inMonth=e=>e.date&&e.date.slice(0,7)===ym;
const incOf=k=>{const r=S.income[k]||{};return(+r.v||0)+(+r.x||0)};
const colorOf=c=>COLORS[Math.max(0,S.cats.indexOf(c))%COLORS.length];
const initials=n=>(n.trim().split(/\s+/).slice(0,2).map(w=>w[0]).join("")||"?").toUpperCase();
function nameFrom(u){const n=u.user_metadata&&u.user_metadata.nome;if(n)return n;const e=(u.email||"").split("@")[0].replace(/[._-]+/g," ");return e.replace(/\b\w/g,c=>c.toUpperCase())||"Você"}

const ICONS={
home:'<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
bulb:'<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
cart:'<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>',
car:'<path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11"/><rect x="3" y="11" width="18" height="6" rx="2"/><path d="M6 17v2M18 17v2"/><circle cx="7.5" cy="14" r=".6"/><circle cx="16.5" cy="14" r=".6"/>',
heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>',
cap:'<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5"/><path d="M22 9v6"/>',
ticket:'<path d="M3 9a2 2 0 0 0 0 6v3a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-3a2 2 0 0 0 0-6V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1z"/><path d="M13 6v2M13 11v2M13 16v2"/>',
card:'<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20M6 15h4"/>',
bank:'<path d="M3 10l9-6 9 6"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8"/><path d="M3 21h18"/>',
repeat:'<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>',
trend:'<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
tag:'<path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1"/>'};
function iconKey(c){const n=(c||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  if(/cartao|credito/.test(n))return"card";if(/moradia|aluguel|condominio|imovel/.test(n))return"home";
  if(/conta|luz|energia|agua|internet|telefone/.test(n))return"bulb";if(/aliment|mercado|comida|restaur/.test(n))return"cart";
  if(/transport|carro|combust|uber|onibus|veicul/.test(n))return"car";if(/saude|medic|farmac|hospital/.test(n))return"heart";
  if(/educa|escola|curso|faculd|livro/.test(n))return"cap";if(/lazer|viagem|cinema|divers|jogo/.test(n))return"ticket";
  if(/divida|financ|emprest|banco/.test(n))return"bank";if(/assinatura|stream|mensalidade/.test(n))return"repeat";
  if(/poupan|invest|reserva/.test(n))return"trend";return"tag"}
const catIcon=c=>'<svg class="ci" viewBox="0 0 24 24">'+ICONS[iconKey(c)]+'</svg>';
const avatarInner=()=>foto?`<img src="${foto}" alt="">`:esc(initials(nome||"?"));
function readFoto(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const c=document.createElement("canvas"),n=192;c.width=c.height=n;const m=Math.min(im.width,im.height);c.getContext("2d").drawImage(im,(im.width-m)/2,(im.height-m)/2,m,m,0,0,n,n);res(c.toDataURL("image/jpeg",.85))};im.onerror=rej;im.src=r.result};r.onerror=rej;r.readAsDataURL(file)})}
async function saveFoto(){try{localStorage.setItem("finapp_foto_"+uid,foto)}catch(e){}
  const r=await sb.from("perfis").upsert({user_id:uid,foto});if(r.error)toast("Foto salva só neste aparelho (crie a tabela perfis no Supabase)")}
function loadEmergency(){
  try{const d=JSON.parse(localStorage.getItem("finapp_emergencia")||"{}");
    emergency={tipo:String(d.tipo||"Fundo de emergência"),meta:+d.meta||0,atual:+d.atual||0,prazo:String(d.prazo||""),obs:String(d.obs||"")};
  }catch(e){emergency={tipo:"Fundo de emergência",meta:0,atual:0,prazo:"",obs:""}}
}
function saveEmergency(){try{localStorage.setItem("finapp_emergencia",JSON.stringify(emergency));return true}catch(e){toast("Não foi possível salvar o fundo de emergência neste aparelho.");return false}}

function dueInfo(e){
  if(e.status==="Pago")return null;
  const[y,m,d]=e.date.split("-").map(Number),df=Math.round((new Date(y,m-1,d)-new Date(today.getFullYear(),today.getMonth(),today.getDate()))/864e5);
  if(df<0)return{t:"Vencida há "+(-df)+(df===-1?" dia":" dias"),c:"er",df};
  if(df===0)return{t:"Vence hoje",c:"er",df};
  if(df===1)return{t:"Vence amanhã",c:"wa",df};
  if(df<=3)return{t:"Em "+df+" dias",c:"wa",df};
  if(df<=7)return{t:"Em "+df+" dias",c:"in",df};
  return null;
}
const alerts=()=>S.entries.filter(dueInfo).sort((a,b)=>a.date.localeCompare(b.date));

function mnav(){
  const[y,m]=ym.split("-").map(Number),al=alerts();
  const strip=MESES.map((n,i)=>{const k=y+"-"+pad(i+1),has=S.entries.some(e=>e.date&&e.date.slice(0,7)===k),ov=al.some(e=>e.date.slice(0,7)===k&&dueInfo(e).df<0);
    return `<button data-a="setm" data-v="${k}" class="${k===ym?"on ":""}${k===todayYM?"now ":""}${has?"has ":""}${ov?"al":""}">${n.slice(0,3)}<i></i></button>`}).join("");
  return `<div class="mp"><div class="mt"><button class="nv" data-a="shift" data-v="-1" aria-label="Mês anterior">‹</button><div class="tl"><small>PERÍODO</small><b>${MESES[m-1]} ${y}</b></div><button class="nv" data-a="shift" data-v="1" aria-label="Próximo mês">›</button></div><div class="ms">${strip}</div></div>`;
}
const greet=()=>{const h=new Date().getHours();return h<12?"Bom dia":h<18?"Boa tarde":"Boa noite"};
function header(){
  const n=alerts().length,dt=today.toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"});
  return `<div class="hd"><button class="av" data-a="prof" aria-label="Perfil">${avatarInner()}</button><div class="hi"><small>${esc(dt)}</small><b>${greet()}, ${esc(nome.split(" ")[0]||"")}</b></div>
  <button class="bell" data-a="goalert" aria-label="Vencimentos"><svg class="i" viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/></svg>${n?`<i>${n}</i>`:""}</button></div>`;
}
function item(e){
  const d=e.date.split("-").reverse().slice(0,2).join("/"),di=dueInfo(e);
  return `<div class="it"><div class="dot" style="background:${colorOf(e.cat)}">${catIcon(e.cat)}</div>
  <div class="m" data-a="edit" data-id="${e.id}"><b>${esc(e.desc||e.cat)}${di?`<span class="bd ${di.c}">${di.t}</span>`:""}</b><span>${d} · ${esc(e.cat)}${e.pay?" · "+esc(e.pay):""}</span></div>
  <div class="val" title="${e.status==="Pago"?"Valor quitado":"Saldo restante"}">${brl(e.status==="Pago"?e.val:balanceOf(e))}<small>${e.status==="Pago"?"Valor quitado":e.valPaid>0?`Restante · pago ${brl(paidOf(e))} de ${brl(e.val)}`:"Restante"}</small>
  <button class="pill ${e.status==="Pago"?"p":"n"}" data-a="tog" data-id="${e.id}">${e.status}</button>${e.status!=="Pago"?`<button class="pill pay" data-a="pay" data-id="${e.id}">Abater</button>`:""}</div></div>`;
}
function donut(by,tot){
  const C=2*Math.PI*40;let off=0;
  const segs=by.map(([c,v])=>{const l=v/tot*C,s=`<circle r="40" cx="60" cy="60" fill="none" stroke="${colorOf(c)}" stroke-width="16" stroke-dasharray="${l} ${C-l}" stroke-dashoffset="${-off}"/>`;off+=l;return s}).join("");
  return `<svg viewBox="0 0 120 120" width="128" height="128" style="flex:none"><g transform="rotate(-90 60 60)"><circle r="40" cx="60" cy="60" fill="none" stroke="var(--sub)" stroke-width="16"/>${segs}</g><text x="60" y="57" text-anchor="middle" font-size="9" fill="var(--mu)">Categorias</text><text x="60" y="72" text-anchor="middle" font-size="15" font-weight="700" fill="var(--tx)">${by.length}</text></svg>`;
}
const kfmt=v=>{v=Math.round(+v||0);if(v>=1e6)return(v/1e6).toFixed(1).replace(".",",")+"M";if(v>=1e4)return Math.round(v/1e3)+"k";if(v>=1e3)return(v/1e3).toFixed(1).replace(".",",")+"k";return String(v)};
function bars(){
  const ks=[];let[y,m]=ym.split("-").map(Number);
  for(let i=5;i>=0;i--){let mm=m-i,yy=y;while(mm<1){mm+=12;yy--}ks.push(yy+"-"+pad(mm))}
  const data=ks.map(k=>[k,sum(S.entries.filter(e=>e.date.slice(0,7)===k)),incOf(k)]),mx=Math.max(1,...data.map(d=>Math.max(d[1],d[2]))),W=320,H=124,bw=18,sl=W/6,sc=H-16;
  const g=data.map((d,i)=>{const x=sl*i+sl/2,hr=sc*d[2]/mx,hg=sc*d[1]/mx,cur=d[0]===ym;
    return `<g data-a="go" data-v="${d[0]}" style="cursor:pointer"><rect x="${sl*i+2}" y="0" width="${sl-4}" height="${H+22}" fill="${cur?"var(--sub)":"transparent"}" rx="8"/>
    <rect x="${x-bw-1}" y="${H-hr}" width="${bw}" height="${hr}" rx="4" fill="var(--ok)" opacity=".8"/><rect x="${x+1}" y="${H-hg}" width="${bw}" height="${hg}" rx="4" fill="var(--ac)"/>
    ${d[2]>0?`<text x="${x-bw/2-1}" y="${H-hr-3}" text-anchor="middle" font-size="8.5" font-weight="700" fill="var(--ok)">${kfmt(d[2])}</text>`:""}${d[1]>0?`<text x="${x+bw/2+1}" y="${H-hg-3}" text-anchor="middle" font-size="8.5" font-weight="700" fill="var(--ac)">${kfmt(d[1])}</text>`:""}
    <text x="${x}" y="${H+15}" text-anchor="middle" font-size="10" fill="var(--mu)">${MESES[+d[0].slice(5)-1].slice(0,3)}</text></g>`}).join("");
  const rows=data.map(d=>`<tr data-a="go" data-v="${d[0]}"${d[0]===ym?' style="font-weight:700"':""}><td>${MESES[+d[0].slice(5)-1].slice(0,3)}/${d[0].slice(2,4)}</td><td>${brl(d[2])}</td><td>${brl(d[1])}</td><td class="${d[2]-d[1]<0?"er":"ok"}">${brl(d[2]-d[1])}</td></tr>`).join("");
  return `<svg viewBox="0 0 ${W} ${H+22}" width="100%">${g}</svg><div class="note"><span class="ok">■</span> Renda &nbsp; <span style="color:var(--ac)">■</span> Gastos · valores em R$ (k = mil)</div>
  <details class="dt"><summary>Ver valores por mês</summary><table style="margin-top:8px"><tr><th>Mês</th><th>Renda</th><th>Gastos</th><th>Saldo</th></tr>${rows}</table></details>`;
}

function scurve(){
  const cy=today.getFullYear(),cm=yr===cy?today.getMonth()+1:(yr<cy?12:0);
  const mg=MESES.map((m,i)=>sum(S.entries.filter(e=>e.date&&e.date.slice(0,7)===yr+"-"+pad(i+1))));
  if(mg.every(v=>v===0))return '<div class="emp">Sem gastos lançados em '+yr+'.</div>';
  let last=cm;for(let i=11;i>=0;i--)if(mg[i]>0){last=Math.max(last,i+1);break}
  let a=0,b=0;const cg=[],cr=[];
  for(let i=0;i<last;i++){a+=mg[i];b+=incOf(yr+"-"+pad(i+1));cg.push(a);cr.push(b)}
  const showR=b>0,top=Math.max(1,a,showR?b:0),mx=top*1.12,W=340,H=190,L=38,R=14,T=22,B=24,pw=W-L-R,ph=H-T-B,X=i=>L+pw*i/11,Y=v=>T+ph-ph*v/mx;
  const path=arr=>arr.map((v,i)=>{const x=X(i),y=Y(v);if(!i)return"M"+x+" "+y;const px=X(i-1),py=Y(arr[i-1]),c=(px+x)/2;return"C"+c+" "+py+" "+c+" "+y+" "+x+" "+y}).join(" ");
  const grid=[0,1,2,3,4].map(k=>{const v=top*k/4,y=Y(v);return `<line x1="${L}" x2="${W-R}" y1="${y}" y2="${y}" stroke="var(--ln)" stroke-width="1"/><text x="${L-6}" y="${y+3}" text-anchor="end" font-size="8.5" fill="var(--mu)">${kfmt(v)}</text>`}).join("");
  const xl=MESES.map((m,i)=>`<text x="${X(i)}" y="${H-8}" text-anchor="middle" font-size="9" fill="var(--mu)">${m.slice(0,3)}</text>`).join("");
  const area=`<path d="${path(cg)} L${X(last-1)} ${Y(0)} L${X(0)} ${Y(0)} Z" fill="var(--ac)" opacity=".12"/>`;
  const pts=cg.map((v,i)=>`<circle cx="${X(i)}" cy="${Y(v)}" r="3.5" fill="var(--card)" stroke="var(--ac)" stroke-width="2"/><text x="${X(i)}" y="${Y(v)-8}" text-anchor="middle" font-size="8.5" font-weight="${i===last-1?800:600}" fill="var(--tx)">${kfmt(v)}</text>`).join("");
  return `<svg viewBox="0 0 ${W} ${H}" width="100%">${grid}${xl}${area}${showR?`<path d="${path(cr)}" fill="none" stroke="var(--ok)" stroke-width="2" stroke-dasharray="5 4"/>`:""}<path d="${path(cg)}" fill="none" stroke="var(--ac)" stroke-width="3" stroke-linecap="round"/>${pts}</svg>
  <div class="note"><span style="color:var(--ac)">━</span> Gasto acumulado${showR?` &nbsp; <span class="ok">╍</span> Renda acumulada`:""} · valores em R$ (k = mil)</div>
  <div class="row" style="margin-top:10px"><div><div class="k" style="font-size:12px;color:var(--mu)">Acumulado no ano</div><b>${brl(a)}</b></div><div><div class="k" style="font-size:12px;color:var(--mu)">Média mensal</div><b>${brl(a/last)}</b></div></div>`;
}
const STOP=["de","do","da","dos","das","em","no","na","e","a","o"];
const norm=t=>String(t||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
function searchBar(){return `<div class="sb ${ps.trim()?"has":""}"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input id="pq" type="search" placeholder="Buscar mês, ano ou conta (ex.: mar 2026)" value="${esc(ps)}" autocomplete="off"><button data-a="clrq" aria-label="Limpar busca">×</button></div>`}
function pSearch(){
  const raw=ps.trim();if(!raw)return"";
  const MN=MESES.map(norm),months=[],years=[],text=[];
  norm(raw).split(/[\s,;]+/).filter(t=>t&&!STOP.includes(t)).forEach(t=>{
    let m;
    if(/^\d{4}$/.test(t))years.push(+t);
    else if(m=t.match(/^(\d{1,2})[\/\-.](\d{4})$/)){months.push(+m[1]);years.push(+m[2])}
    else if(/^\d{1,2}$/.test(t)&&+t>=1&&+t<=12)months.push(+t);
    else{const ix=t.length>=3?MN.map((n,i)=>n.startsWith(t)?i+1:0).filter(Boolean):[];if(ix.length)months.push(...ix);else text.push(t)}
  });
  const okK=k=>(!months.length||months.includes(+k.slice(5)))&&(!years.length||years.includes(+k.slice(0,4)));
  if(text.length){
    const es=S.entries.filter(e=>e.date&&okK(e.date.slice(0,7))&&text.every(t=>norm(e.desc+" "+e.cat+" "+e.pay).includes(t))).sort((a,b)=>b.date.localeCompare(a.date));
    return `<div class="card"><h2>Contas encontradas<small>${es.length} ${es.length===1?"resultado":"resultados"}</small></h2>${es.length?`<div class="tt"><span class="k" style="color:var(--mu)">Total</span><b>${brl(sum(es))}</b></div>`+es.slice(0,30).map(item).join("")+(es.length>30?'<div class="note">Mostrando as 30 mais recentes.</div>':""):'<div class="emp">Nenhuma conta encontrada.</div>'}</div>`;
  }
  const ys=new Set([today.getFullYear(),yr].concat(years)),ks=new Set();
  S.entries.forEach(e=>e.date&&ks.add(e.date.slice(0,7)));Object.keys(S.income).forEach(k=>ks.add(k));
  ys.forEach(y=>MESES.forEach((m,i)=>ks.add(y+"-"+pad(i+1))));
  const list=[...ks].filter(okK).sort().reverse().slice(0,24);
  return `<div class="card"><h2>Períodos<small>${list.length} ${list.length===1?"encontrado":"encontrados"}</small></h2>${list.length?list.map(k=>{
    const es=S.entries.filter(e=>e.date&&e.date.slice(0,7)===k),g=sum(es),sal=incOf(k)-g,pe=es.filter(e=>e.status!=="Pago").length,ve=es.filter(e=>{const d=dueInfo(e);return d&&d.df<0}).length,m=+k.slice(5);
    return `<div class="mr" data-a="go" data-v="${k}"><div class="mi">${MESES[m-1].slice(0,3).toUpperCase()}<b>${k.slice(2,4)}</b></div><div class="mm"><b>${MESES[m-1]} ${k.slice(0,4)}</b><span>${es.length} ${es.length===1?"conta":"contas"}${pe?" · "+pe+(pe===1?" pendente":" pendentes"):""}${ve?` · <span class="er">${ve} ${ve===1?"vencida":"vencidas"}</span>`:""}</span></div><div class="sv">${brl(g)}<small class="${sal<0?"er":"ok"}">Saldo ${brl(sal)}</small></div></div>`}).join(""):'<div class="emp">Nenhum período encontrado.</div>'}</div>`;
}
const views={
home(){
  const es=S.entries.filter(inMonth),tot=sum(es),r=S.income[ym]||{},rt=incOf(ym),pg=sumPaid(es),sal=rt-tot,pct=rt?Math.min(100,tot/rt*100):0;
  const by=S.cats.map(c=>[c,sum(es.filter(e=>e.cat===c))]).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]);
  const al=alerts(),ven=al.filter(e=>dueInfo(e).df<0).length,pr=al.length-ven,mes=MESES[+ym.slice(5)-1];
  const parts=[];if(ven)parts.push(ven+(ven>1?" vencidas":" vencida"));if(pr)parts.push(pr+(pr>1?" vencem":" vence")+" em até 7 dias");
  return mnav()+searchBar()+'<div id="pres">'+pSearch()+'</div><div id="pdash"'+(ps.trim()?' style="display:none"':"")+">"+
    emergencyCard() +
    (al.length?`<div class="alert ${ven?"er":"wa"}" data-a="goalert"><span>⚠ ${parts.join(" · ")}</span><b>Ver ›</b></div>`:"") +
    `<div class="hero"><div class="k2">Saldo de ${mes}</div><div class="big">${brl(sal)}</div>
     <div class="hrow"><div class="tap" data-a="inc"><span>Renda total ✎</span><b>${brl(rt)}</b><small>Principal ${brl(r.v)} · Extra ${brl(r.x)}</small></div>
     <div><span>Gastos</span><b>${brl(tot)}</b><small>${rt?pct.toFixed(1).replace(".",",")+"% da renda":"defina a renda"}</small></div></div>
     <div class="pb"><i style="width:${pct}%"></i></div></div>
    <div class="row"><button class="kpi" data-a="goflt" data-v="g"><span class="ki okb">✓</span><div><div class="k">Pagos</div><div class="v ok">${brl(pg)}</div></div></button>
    <button class="kpi" data-a="goflt" data-v="p"><span class="ki wab">◷</span><div><div class="k">Pendentes</div><div class="v wa">${brl(sumOpen(es))}</div></div></button></div>
    <div class="card"><h2>Gastos do mês<small>${es.length} ${es.length===1?"conta":"contas"}</small></h2>
     <div class="tt"><span class="k" style="color:var(--mu)">Total</span><b>${brl(tot)}</b></div>
     ${by.length?`<div class="dn">${donut(by,tot)}<div class="lg">${by.map(([c,v])=>`<div class="lr" data-a="gocat" data-v="${esc(c)}"><i style="background:${colorOf(c)}"></i><span>${esc(c)}</span><b>${brl(v)}</b><em>${(v/tot*100).toFixed(0)}%</em></div>`).join("")}</div></div>`:'<div class="emp">Nenhum gasto neste mês.<br>Toque em + para adicionar.</div>'}</div>
    <div class="card"><h2>Renda x gastos<small>últimos 6 meses</small></h2>${bars()}</div>
    <div class="card"><h2>Próximos vencimentos<small>vencidas e até 7 dias</small></h2>${al.length?al.slice(0,6).map(item).join(""):'<div class="emp">Nenhuma conta vencida ou vencendo nos próximos 7 dias.</div>'}</div>`+"</div>";
},
list(){
  const ch=(k,t)=>`<button class="${flt===k?"on":""}" data-a="flt" data-v="${k}">${t}</button>`;
  const base=flt==="a"?alerts():S.entries.filter(inMonth);
  const cs=S.cats.filter(c=>c===fc||base.some(e=>e.cat===c));
  return (flt==="a"?`<div class="alert wa" style="cursor:default"><span>Mostrando contas vencidas e que vencem em até 7 dias (todos os meses)</span></div>`:mnav())+
  `<div class="seg">${ch("all","Todos")}${ch("p","Pendentes")}${ch("g","Pagos")}${ch("a","⚠ Alertas")}</div>
  <div class="chips sm"><button class="${fc?"":"on"}" data-a="cat" data-v="">Todas as categorias</button>${cs.map(c=>`<button class="${fc===c?"on":""}" data-a="cat" data-v="${esc(c)}"><i style="background:${colorOf(c)}"></i>${esc(c)} · ${brl(sum(base.filter(e=>e.cat===c)))}</button>`).join("")}</div>
  <input id="q" type="search" placeholder="Buscar conta" value="${esc(q)}" style="margin-bottom:14px">
  <div class="card" id="res">${resList()}</div>`;
},
year(){
  let ti=0,tg=0;
  const rows=MESES.map((m,i)=>{const k=yr+"-"+pad(i+1),g=sum(S.entries.filter(e=>e.date&&e.date.slice(0,7)===k)),r=incOf(k);ti+=r;tg+=g;
    return `<tr data-a="go" data-v="${k}"><td>${m.slice(0,3)}</td><td>${brl(r)}</td><td>${brl(g)}</td><td class="${r-g<0?"er":""}">${brl(r-g)}</td></tr>`}).join("");
  return `<div class="mp"><div class="mt"><button class="nv" data-a="yshift" data-v="-1" aria-label="Ano anterior">‹</button><div class="tl"><small>PERÍODO · VISÃO ANUAL</small><b>${yr}</b></div><button class="nv" data-a="yshift" data-v="1" aria-label="Próximo ano">›</button></div></div>
  <div class="card"><table><tr><th>Mês</th><th>Renda</th><th>Gastos</th><th>Saldo</th></tr>${rows}
  <tr><td><b>Total</b></td><td><b>${brl(ti)}</b></td><td><b>${brl(tg)}</b></td><td class="${ti-tg<0?"er":"ok"}"><b>${brl(ti-tg)}</b></td></tr></table></div>
  <div class="card"><h2>Curva S de gastos<small>acumulado mês a mês · ${yr}</small></h2>${scurve()}</div>
  <div class="note">Renda inclui a renda extra. Toque num mês para abrir o painel dele.</div>`;
},
more(){
  return `<div class="card"><h2>Perfil</h2><div class="pf"><div class="av big">${avatarInner()}</div><div><b>${esc(nome)}</b><div class="k" style="color:var(--mu)">${esc(email)}</div></div></div><button class="btn s" data-a="prof">Editar nome e foto</button></div>
  <div class="card"><h2>Categorias</h2>${S.cats.map((c,i)=>`<div class="cr"><span style="display:flex;align-items:center;gap:10px"><span class="dot sm" style="background:${colorOf(c)}">${catIcon(c)}</span>${esc(c)}</span><button data-a="delcat" data-v="${i}" aria-label="Remover ${esc(c)}">×</button></div>`).join("")}
   <div class="row" style="margin-top:12px"><input id="nc" placeholder="Nova categoria"><button class="btn s" style="margin:0;flex:0 0 100px" data-a="addcat">Adicionar</button></div></div>
  <div class="card"><h2>Exportar dados</h2><div class="k" style="color:var(--mu)">Baixe um backup completo em JSON para guardar ou importar depois.</div><button class="btn" data-a="exportbackup">Exportar dados</button></div>
  <div class="card"><h2>Importar dados</h2><div class="k" style="color:var(--mu)">Restaure um backup JSON. Os dados atuais da conta serão substituídos.</div><input id="backupFile" type="file" accept=".json,application/json" hidden><button class="btn s" data-a="importbackup">Selecionar backup para importar</button></div>
  <div class="card"><h2>Conta</h2><button class="btn s" data-a="logout" style="margin-top:0">Sair da conta</button><button class="btn d" data-a="reset">${resetArm?"Toque de novo para apagar tudo":"Apagar todos os dados"}</button></div>`;
}};
function resList(){
  let es=flt==="a"?alerts():S.entries.filter(inMonth).sort((a,b)=>a.date.localeCompare(b.date));
  if(flt==="p")es=es.filter(e=>e.status!=="Pago");if(flt==="g")es=es.filter(e=>e.status==="Pago");
  if(fc)es=es.filter(e=>e.cat===fc);
  if(q.trim())es=es.filter(e=>(e.desc+" "+e.cat).toLowerCase().includes(q.trim().toLowerCase()));
  const total=flt==="p"||flt==="a"?sumOpen(es):sum(es);
  return es.length?es.map(item).join("")+`<div class="note">Total listado: <b>${brl(total)}</b></div>`:'<div class="emp">Nada por aqui.</div>';
}
function render(){
  $("#app").innerHTML=header()+views[tab]();
  document.querySelectorAll("nav [data-v]").forEach(b=>b.classList.toggle("on",b.dataset.v===tab));
  try{const o=document.querySelector(".ms .on");if(o&&o.parentNode){const p=o.parentNode;p.scrollLeft=o.offsetLeft-p.offsetLeft-p.clientWidth/2+o.offsetWidth/2}}catch(e){}
}

/* folhas (bottom sheets) */
function sheet(html){const o=document.createElement("div");o.className="ov";o.innerHTML='<div class="sh">'+html+"</div>";document.body.appendChild(o);return o}
function incSheet(){const r=S.income[ym]||{};
  sheet(`<h2>Renda de ${MESES[+ym.slice(5)-1]}</h2><label>Renda principal (R$)</label><input id="inc" type="number" inputmode="decimal" step="0.01" value="${r.v||""}" placeholder="0,00">
  <label>Renda extra (R$)</label><input id="ext" type="number" inputmode="decimal" step="0.01" value="${r.x||""}" placeholder="0,00"><div class="note">Bicos, comissões, 13º, vendas, etc.</div><button class="btn" data-a="saveinc">Salvar</button>`)}
function profSheet(){sheet(`<h2>Seu perfil</h2><div style="text-align:center;margin:12px 0 2px"><div class="av big" id="pv" style="width:88px;height:88px;font-size:30px;margin:0 auto">${avatarInner()}</div></div>
  <div class="row"><button class="btn s" data-a="pickfoto" style="margin-top:12px">Escolher foto</button>${foto?'<button class="btn s" data-a="delfoto" style="margin-top:12px;color:var(--er)">Remover foto</button>':""}</div>
  <input id="fi" type="file" accept="image/*" hidden><label>Nome</label><input id="pn" value="${esc(nome)}" placeholder="Seu nome"><label>E-mail</label><input value="${esc(email)}" disabled><button class="btn" data-a="saveprof">Salvar</button>`)}
function entrySheet(id){
  const e=id?S.entries.find(x=>x.id===id):null,dflt=ym+"-"+(ym===todayYM?pad(today.getDate()):"10");
  const opt=(a,v)=>a.map(x=>`<option${x===v?" selected":""}>${esc(x)}</option>`).join("");
  sheet(`<h2>${e?"Editar conta":"Nova conta"}</h2><input type="hidden" id="f_id" value="${e?e.id:""}">
  <label>Valor (R$)</label><input id="f_v" type="number" inputmode="decimal" step="0.01" value="${e?e.val:""}" placeholder="0,00">
  <label>Descrição</label><input id="f_d" value="${e?esc(e.desc):""}" placeholder="Ex.: Aluguel, Luz, Mercado">
  <label>Categoria</label><select id="f_c">${opt(S.cats,e&&e.cat)}</select>
  <label>Data de vencimento</label><input id="f_t" type="date" value="${e?e.date:dflt}">
  <div class="row"><div><label>Tipo</label><select id="f_y">${opt(["Fixa","Variável"],e&&e.type)}</select></div>
  <div><label>Pagamento</label><select id="f_p">${opt(PAYS,e&&e.pay)}</select></div></div>
  <label>Status</label><select id="f_s">${opt(["Pendente","Pago"],e&&e.status)}</select>
  ${e?"":'<label>Repetir nos próximos meses (0 a 11)</label><input id="f_r" type="number" inputmode="numeric" min="0" max="11" value="0">'}
  <button class="btn" data-a="save">Salvar</button>${e?'<button class="btn s" data-a="dup" data-id="'+e.id+'">Duplicar para o mês seguinte</button><button class="btn d" data-a="del" data-id="'+e.id+'">Excluir</button>':""}`);
}
function emergencyCard(){
  const falta=Math.max(0,emergency.meta-emergency.atual),pct=emergency.meta?Math.min(100,Math.max(0,(emergency.atual/emergency.meta)*100)):0;
  return `<div class="card"><h2>Fundo de emergência<small>${emergency.meta?"meta e progresso":"defina a sua meta"}</small></h2>
    <div class="emerg-wrap">
      <div class="emerg-head"><span>${esc(emergency.tipo)}</span><button class="btn s mini" data-a="emerg">Editar</button></div>
      <div class="emerg-values">
        <div><small>Guardado</small><b>${brl(emergency.atual)}</b></div>
        <div><small>Meta</small><b>${brl(emergency.meta)}</b></div>
        <div><small>Falta</small><b class="${falta>0?"wa":"ok"}">${brl(falta)}</b></div>
      </div>
      <button class="btn s" style="margin:0" data-a="depositemerg">+ Adicionar valor guardado</button>
      ${emergency.prazo?`<div class="emerg-meta">Prazo: ${esc(emergency.prazo)}</div>`:""}
      ${emergency.obs?`<div class="emerg-meta">${esc(emergency.obs)}</div>`:""}
      <div class="emerg-progress"><i style="width:${pct}%"></i></div>
    </div>
  </div>`;
}
function emergencySheet(){
  sheet(`<h2>Fundo de emergência</h2>
  <label>Nome / destaque</label><input id="emg_t" value="${esc(emergency.tipo)}" placeholder="Ex.: Reserva para emergência">
  <label>Meta total (R$)</label><input id="emg_m" type="number" inputmode="decimal" step="0.01" value="${emergency.meta}" placeholder="0,00">
  <label>Já guardado (R$)</label><input id="emg_a" type="number" inputmode="decimal" step="0.01" value="${emergency.atual}" placeholder="0,00">
  <label>Prazo / objetivo</label><input id="emg_p" value="${esc(emergency.prazo)}" placeholder="Ex.: em 12 meses">
  <label>Observações</label><textarea id="emg_o" rows="3" placeholder="Ex.: manter para imprevistos, manutenção e viagem">${esc(emergency.obs)}</textarea>
  <button class="btn" data-a="saveemerg">Salvar</button>`);
}
function emergencyDepositSheet(){
  sheet(`<h2>Adicionar ao fundo</h2>
  <div class="note">Valor guardado atualmente: ${brl(emergency.atual)}</div>
  <label>Valor a adicionar (R$)</label><input id="emg_deposit" type="number" inputmode="decimal" min="0.01" step="0.01" placeholder="0,00">
  <button class="btn" data-a="saveemergdeposit">Adicionar valor</button>`);
}
function paymentSheet(id){
  const e=S.entries.find(x=>x.id===id);if(!e||e.status==="Pago")return;
  sheet(`<h2>Abater pagamento</h2><div><b>${esc(e.desc||e.cat)}</b></div>
  <div class="note">Valor total: ${brl(e.val)} · Já pago: ${brl(paidOf(e))} · Falta: ${brl(balanceOf(e))}</div>
  <label>Valor pago agora (R$)</label><input id="pay_v" type="number" inputmode="decimal" min="0.01" max="${balanceOf(e).toFixed(2)}" step="0.01" placeholder="0,00">
  <button class="btn" data-a="savepay" data-id="${e.id}">Registrar pagamento</button>`);
}

function buildBackup(){
  return JSON.stringify({app:"controle-financeiro",version:1,exportedAt:new Date().toISOString(),entries:S.entries.map(e=>({date:e.date,desc:e.desc||"",cat:e.cat,type:e.type||"",pay:e.pay||"",val:e.val,valPaid:paidOf(e),status:e.status,paid:e.paid||""})),income:S.income,categories:S.cats,emergency},null,2);
}
function exportBackup(){
  const b=new Blob([buildBackup()],{type:"application/json"}),u=URL.createObjectURL(b),a=document.createElement("a");
  a.href=u;a.download="controle_financeiro_backup_"+TD+".json";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);toast("Backup exportado");
}
function validateBackup(d){
  if(!d||d.app!=="controle-financeiro"||d.version!==1||!Array.isArray(d.entries)||!d.income||typeof d.income!=="object"||!Array.isArray(d.categories)||!d.emergency)return"Arquivo inválido ou versão de backup não suportada.";
  if(!d.categories.length||d.categories.some(c=>typeof c!=="string"||!c.trim())||new Set(d.categories).size!==d.categories.length)return"Categorias inválidas no backup.";
  for(const e of d.entries){
    if(!e||typeof e.date!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(e.date)||isNaN(Date.parse(e.date+"T00:00:00"))||typeof e.cat!=="string"||!e.cat.trim()||!d.categories.includes(e.cat)||!["Pago","Pendente"].includes(e.status)||!Number.isFinite(+e.val)||+e.val<=0||!Number.isFinite(+e.valPaid)||+e.valPaid<0||+e.valPaid>+e.val)return"Há uma conta inválida no backup.";
  }
  for(const[k,r]of Object.entries(d.income))if(!/^\d{4}-\d{2}$/.test(k)||!r||!Number.isFinite(+r.v)||+r.v<0||!Number.isFinite(+r.x)||+r.x<0)return"Há uma renda inválida no backup.";
  if(typeof d.emergency.tipo!=="string"||!Number.isFinite(+d.emergency.meta)||+d.emergency.meta<0||!Number.isFinite(+d.emergency.atual)||+d.emergency.atual<0||typeof d.emergency.prazo!=="string"||typeof d.emergency.obs!=="string")return"Os dados do fundo de emergência são inválidos.";
  return"";
}
async function restoreBackup(d){
  for(const t of ["lancamentos","rendas","categorias"]){const r=await sb.from(t).delete().eq("user_id",uid);if(!ok(r))return}
  const cr=await sb.from("categorias").insert(d.categories.map(nome=>({user_id:uid,nome})));if(!ok(cr))return;
  if(d.entries.length){const r=await sb.from("lancamentos").insert(d.entries.map(e=>Object.assign(toRow(e),{user_id:uid}))).select();if(!ok(r))return;S.entries=r.data.map(fromRow)}else S.entries=[];
  const incomeRows=Object.entries(d.income).map(([mes,r])=>({user_id:uid,mes,valor:+r.v,valor_extra:+r.x}));
  if(incomeRows.length){const r=await sb.from("rendas").insert(incomeRows);if(!ok(r))return}
  S.income=Object.fromEntries(Object.entries(d.income).map(([mes,r])=>[mes,{v:+r.v,x:+r.x}]));
  S.cats=d.categories.slice();emergency={tipo:d.emergency.tipo,meta:+d.emergency.meta,atual:+d.emergency.atual,prazo:d.emergency.prazo,obs:d.emergency.obs};saveEmergency();render();toast("Backup importado");
}

/* dados e acesso */
async function loadAll(){
  const[a,b,c]=await Promise.all([sb.from("lancamentos").select("*").order("data_vencimento"),sb.from("rendas").select("*"),sb.from("categorias").select("nome").order("nome")]);
  if(!ok(a)||!ok(b)||!ok(c))return false;
  S.entries=a.data.map(fromRow);S.income={};b.data.forEach(r=>S.income[r.mes]={v:+r.valor||0,x:+r.valor_extra||0});S.cats=c.data.map(r=>r.nome);
  if(!S.cats.length){const r=await sb.from("categorias").insert(DCATS.map(nome=>({nome})));if(ok(r))S.cats=DCATS.slice()}
  try{const pf=await sb.from("perfis").select("foto").eq("user_id",uid);if(!pf.error&&pf.data&&pf.data[0])foto=pf.data[0].foto||"";else foto=localStorage.getItem("finapp_foto_"+uid)||""}catch(e){}
  return true;
}
function setUser(u){uid=u.id;email=u.email||"";nome=nameFrom(u)}
loadEmergency();
function showLogin(msg){
  $("nav").style.display="none";
  $("#app").innerHTML='<div style="padding-top:8vh"><div class="hero" style="text-align:center"><div class="big" style="font-size:26px;margin:0">Meu Controle Financeiro</div><div class="k2">Entre para ver suas contas</div></div><div class="card"><label>E-mail</label><input id="em" type="email" autocomplete="username"><label>Senha</label><input id="pw" type="password" autocomplete="current-password"><button class="btn" data-a="login">Entrar</button><div class="note er" id="lm">'+esc(msg||"")+'</div></div></div>';
}
async function boot(){
  $("nav").style.display="";$("#app").innerHTML='<div class="emp">Carregando…</div>';
  if(await loadAll())render();else $("#app").innerHTML='<div class="emp">Não foi possível carregar os dados. Confira as tabelas e o login no Supabase.<br><br><button class="btn s" data-a="logout">Sair</button></div>';
}
async function doLogin(){
  const r=await sb.auth.signInWithPassword({email:$("#em").value.trim(),password:$("#pw").value});
  if(r.error){$("#lm").textContent="E-mail ou senha incorretos.";return}
  setUser(r.data.user);boot();
}

/* eventos (delegação, sem handlers inline) */
document.addEventListener("click",async ev=>{
  const ov=ev.target.closest(".ov");
  if(ov&&ev.target===ov){ov.remove();return}
  const el=ev.target.closest("[data-a]");if(!el)return;
  const a=el.dataset.a,v=el.dataset.v,id=el.dataset.id,close=()=>{const o=el.closest(".ov");if(o)o.remove()},up=()=>scrollTo(0,0);
  if(a==="login")doLogin();
  else if(a==="logout"){await sb.auth.signOut();uid=null;S={income:{},entries:[],cats:DCATS.slice()};showLogin()}
  else if(a==="tab"){tab=v;resetArm=false;if(v!=="list"&&flt==="a")flt="all";render();up()}
  else if(a==="new")entrySheet();
  else if(a==="edit")entrySheet(id);
  else if(a==="emerg")emergencySheet();
  else if(a==="depositemerg")emergencyDepositSheet();
  else if(a==="saveemergdeposit"){
    const amountCents=Math.round((parseFloat($("#emg_deposit").value)||0)*100);
    if(amountCents<=0){toast("Informe um valor maior que zero");return}
    const previous=emergency.atual;emergency.atual=(Math.round(previous*100)+amountCents)/100;
    if(!saveEmergency()){emergency.atual=previous;return}
    close();render();toast("Valor adicionado ao fundo");
  }
  else if(a==="saveemerg"){emergency.tipo=$("#emg_t").value.trim()||"Fundo de emergência"; emergency.meta=Math.max(0,parseFloat($("#emg_m").value)||0); emergency.atual=Math.max(0,parseFloat($("#emg_a").value)||0); emergency.prazo=$("#emg_p").value.trim(); emergency.obs=$("#emg_o").value.trim(); if(!saveEmergency())return; close(); render(); toast("Fundo de emergência salvo");}
  else if(a==="pay")paymentSheet(id);
  else if(a==="prof")profSheet();
  else if(a==="pickfoto"){const f=$("#fi");if(f)f.click()}
  else if(a==="delfoto"){foto="";await saveFoto();close();render();toast("Foto removida")}
  else if(a==="saveprof"){const n=$("#pn").value.trim();if(!n)return;const r=await sb.auth.updateUser({data:{nome:n}});if(!ok(r))return;nome=n;close();render();toast("Nome atualizado")}
  else if(a==="shift"){let[y,m]=ym.split("-").map(Number);m+=+v;if(m<1){m=12;y--}if(m>12){m=1;y++}ym=y+"-"+pad(m);yr=y;render()}
  else if(a==="yshift"){yr+=+v;render()}
  else if(a==="clrq"){ps="";render()}
  else if(a==="setm"){ps="";ym=v;yr=+v.slice(0,4);render()}
  else if(a==="go"){ps="";ym=v;yr=+v.slice(0,4);tab="home";render();up()}
  else if(a==="flt"){flt=v;render()}
  else if(a==="cat"){fc=v;render()}
  else if(a==="goalert"){flt="a";fc="";q="";tab="list";render();up()}
  else if(a==="goflt"){flt=v;fc="";q="";tab="list";render();up()}
  else if(a==="gocat"){fc=v;flt="all";q="";tab="list";render();up()}
  else if(a==="inc")incSheet();
  else if(a==="saveinc"){const vv=parseFloat($("#inc").value)||0,xx=parseFloat($("#ext").value)||0;
    const r=await sb.from("rendas").upsert({user_id:uid,mes:ym,valor:vv,valor_extra:xx});if(!ok(r))return;S.income[ym]={v:vv,x:xx};close();render();toast("Renda salva")}
  else if(a==="tog"){const e=S.entries.find(x=>x.id===id);if(!e)return;const st=e.status==="Pago"?"Pendente":"Pago",pd=st==="Pago"?TD:"",valPaid=st==="Pago"?e.val:0;
    const r=await sb.from("lancamentos").update({status:st,valor_pago:valPaid,data_pagamento:pd||null}).eq("id",id);if(!ok(r))return;e.status=st;e.valPaid=valPaid;e.paid=pd;render()}
  else if(a==="savepay"){
    const e=S.entries.find(x=>x.id===id);if(!e||e.status==="Pago")return;
    const paymentCents=Math.round((parseFloat($("#pay_v").value)||0)*100),balanceCents=Math.round(balanceOf(e)*100);
    if(paymentCents<=0||paymentCents>balanceCents){toast("Informe um pagamento válido, até o saldo restante");return}
    const valPaid=Math.round(paidOf(e)*100+paymentCents)/100,st=valPaid>=e.val?"Pago":"Pendente",pd=st==="Pago"?TD:"";
    const r=await sb.from("lancamentos").update({valor_pago:valPaid,status:st,data_pagamento:pd||null}).eq("id",id);if(!ok(r))return;
    e.valPaid=valPaid;e.status=st;e.paid=pd;close();render();toast(st==="Pago"?"Conta quitada":"Pagamento registrado");
  }
  else if(a==="save"){
    const val=parseFloat($("#f_v").value),date=$("#f_t").value,eid=$("#f_id").value;
    if(!(val>0)||!date){toast("Informe valor e data");return}
    const st=$("#f_s").value,base={val,desc:$("#f_d").value.trim(),cat:$("#f_c").value,date,type:$("#f_y").value,pay:$("#f_p").value,status:st};
    if(eid){const e=S.entries.find(x=>x.id===eid),valPaid=st==="Pago"?val:e.status==="Pago"?0:Math.min(paidOf(e),val),status=valPaid>=val?"Pago":"Pendente",nw=Object.assign({},e,base,{valPaid,status,paid:status==="Pago"?(e.paid||TD):""});
      const r=await sb.from("lancamentos").update(toRow(nw)).eq("id",eid);if(!ok(r))return;Object.assign(e,nw)}
    else{
      const n=Math.max(0,Math.min(11,parseInt($("#f_r").value)||0)),[y,m,d]=date.split("-").map(Number),list=[];
      for(let i=0;i<=n;i++){const dt=new Date(y,m-1+i,1),last=new Date(dt.getFullYear(),dt.getMonth()+1,0).getDate();
        list.push(Object.assign({},base,{status:i?"Pendente":st,valPaid:st==="Pago"&&i===0?val:0,paid:st==="Pago"&&i===0?TD:"",date:dt.getFullYear()+"-"+pad(dt.getMonth()+1)+"-"+pad(Math.min(d,last))}))}
      const r=await sb.from("lancamentos").insert(list.map(toRow)).select();if(!ok(r))return;r.data.forEach(x=>S.entries.push(fromRow(x)));
    }
    ym=date.slice(0,7);yr=+date.slice(0,4);close();render();toast("Conta salva");
  }
  else if(a==="dup"){const e=S.entries.find(x=>x.id===id),[y,m,d]=e.date.split("-").map(Number),dt=new Date(y,m,1),last=new Date(y,m+1,0).getDate();
    const c=Object.assign({},e,{status:"Pendente",valPaid:0,paid:"",date:dt.getFullYear()+"-"+pad(dt.getMonth()+1)+"-"+pad(Math.min(d,last))});
    const r=await sb.from("lancamentos").insert(toRow(c)).select();if(!ok(r))return;S.entries.push(fromRow(r.data[0]));close();render();toast("Duplicada para o mês seguinte")}
  else if(a==="del"){const r=await sb.from("lancamentos").delete().eq("id",id);if(!ok(r))return;S.entries=S.entries.filter(x=>x.id!==id);close();render();toast("Conta excluída")}
  else if(a==="addcat"){const n=$("#nc").value.trim();if(!n)return;if(S.cats.includes(n))return toast("Categoria já existe");
    const r=await sb.from("categorias").insert({nome:n});if(!ok(r))return;S.cats.push(n);render();toast("Categoria adicionada")}
  else if(a==="delcat"){const c=S.cats[+v];if(S.entries.some(e=>e.cat===c))return toast("Categoria em uso, não pode remover");if(S.cats.length<2)return;
    const r=await sb.from("categorias").delete().eq("nome",c);if(!ok(r))return;S.cats.splice(+v,1);render()}
  else if(a==="exportbackup")exportBackup();
  else if(a==="importbackup"){const input=$("#backupFile");if(input)input.click()}
  else if(a==="reset"){
    if(!resetArm){resetArm=true;render();setTimeout(()=>{resetArm=false;if(tab==="more")render()},4000);return}
    resetArm=false;
    for(const t of ["lancamentos","rendas","categorias"]){const r=await sb.from(t).delete().eq("user_id",uid);if(!ok(r))return}
    const r2=await sb.from("categorias").insert(DCATS.map(nome=>({nome})));if(!ok(r2))return;
    S={income:{},entries:[],cats:DCATS.slice()};render();toast("Dados apagados");
  }
});
document.addEventListener("input",ev=>{
  if(ev.target.id==="q"){q=ev.target.value;$("#res").innerHTML=resList()}
  else if(ev.target.id==="pq"){ps=ev.target.value;$("#pres").innerHTML=pSearch();$("#pdash").style.display=ps.trim()?"none":"";$(".sb").classList.toggle("has",!!ps.trim())}
});
document.addEventListener("change",async ev=>{
  if(ev.target.id==="backupFile"&&ev.target.files&&ev.target.files[0]){
    const input=ev.target,file=input.files[0];let text;
    try{text=await file.text()}catch(e){toast("Não foi possível ler o arquivo selecionado.");input.value="";return}
    let data;try{data=JSON.parse(text)}catch(e){toast("O arquivo não contém um backup JSON válido.");input.value="";return}
    const error=validateBackup(data);if(error){toast(error);input.value="";return}
    if(confirm("Importar este backup substituirá todas as contas, rendas e categorias atuais. Deseja continuar?"))await restoreBackup(data);
    input.value="";
  }
  if(ev.target.id==="fi"&&ev.target.files[0]){try{foto=await readFoto(ev.target.files[0]);const pv=$("#pv");if(pv)pv.innerHTML=avatarInner();render();await saveFoto();toast("Foto atualizada")}catch(e){toast("Não foi possível usar essa imagem")}}
});
document.addEventListener("keydown",ev=>{if(ev.key==="Enter"&&ev.target.id==="pw")doLogin()});

/* início */
(async()=>{
  if(!sb||SUPABASE_URL.includes("SEU-PROJETO")){
    $("nav").style.display="none";
    $("#app").innerHTML='<h1>Configuração necessária</h1><div class="card">Abra o arquivo no editor de texto e preencha <b>SUPABASE_URL</b> e <b>SUPABASE_KEY</b> no começo do script.</div>';return;
  }
  try{
    const{data}=await sb.auth.getSession();
    if(data.session){setUser(data.session.user);boot()}else showLogin();
  }catch(e){showLogin("Falha ao conectar ao Supabase.")}
})();
