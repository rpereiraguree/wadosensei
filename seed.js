// Dados iniciais: configuração dos dois clubes + época 25/26 do Cart (Excel)
const AT=`PS|7217|PEDRO MANUEL SILVA RIBEIRO SAMPAIO|1982-10-01|A|T
FM|17607|FRANCISCO JOSÉ DA SILVA MATOS|2004-01-20|A|
RI|17942|RICARDO EMANUEL DIAS DA CUNHA|2004-03-12|A|T
MS|41083|MIGUEL DE SOUSA|2007-03-22|A|
JM|42391|JOSÉ MIGUEL DE CASTRO CARDOSO|2004-04-12|A|
JT|44351|JOÃO TOMÁS OLIVEIRA FERREIRA|2009-08-18|A|TQ
TL|45482|TOMÁS LOPES NUNES|2008-12-02|A|TQ
LA|45525|LAURA SALOMÃO CASTRO MARQUES|2010-11-10|A|TQ
AR|47798|ARTUR MANUEL SALGADO CASTRO|2011-08-09|A|TQ
MC|55367|MATILDE CUNHA GONÇALVES LIMA DA SILVA|2010-08-29|A|
PA|67143|PEDRO AURÉLIO COSTA ABREU|1975-09-30|A|TQ
IS|68718|ISABEL DE CASTRO CARDOSO|2010-03-16|A|T
LR|69671|LARA BARROSO ALVES|2016-03-30|C|T
RU|72399|RÚBEN CASTRO MOREIRA|2015-10-01|C|TQ
RO|74390|RODRIGO ALEXANDRE DA SILVA MARQUES|2007-10-10|A|TQ
AC|83696|AFONSO CARDOSO DE OLIVEIRA|2018-04-15|C|TQ
BE|87652|BEATRIZ SAAVEDRA DE SOUSA|2012-04-20|C|TQ
MT|87653|MARTIM AFONSO FREITAS SILVA|2015-10-20|C|Q
MA|87655|MANUEL LEITE COSTA|2015-06-20|C|TQ
TM|88283|TOMÁS LEITE MACEDO|2010-04-14|A|
FR|90275|FRANCISCA SAAVEDRA DE SOUSA|2016-03-11|C|TQ
GU|90276|GUSTAVO FREITAS FERNANDES|2018-07-03|C|Q
AB|92567|AFONSO BRAVO DIAS|2019-11-24|C|T
VI|92568|VICENTE FREITAS COSTA MARQUES|2015-12-20|C|TQ
SA|92569|SALVADOR MARTIM FRAGA COSTA|2016-06-20|C|Q
GO|93686|GONÇALO GONÇALVES CARDOSO|2015-07-22|C|Q
ME|57595|MATEUS PEREIRA BARBOSA|2013-08-02|C|T
DA|81632|DANIEL VASCONCELOS RÉDUA DE OLIVEIRA|2017-06-02|C|T
SM|83169|SAMUEL VASCONCELOS RÉDUA DE OLIVEIRA|2020-02-20|C|T`;
const ATT=`01-06 A AR IS JT PA PS RI/LA RO TL
01-06 C AB AC BE FR LR MA RU/VI
01-08 A AR LA PA/RO TM TL
01-08 C AC BE GO MA MT RU SA VI/FR GU
01-13 A AR IS JT LA PA PS RI RO/TL
01-13 C AB AC BE FR LR MA RU VI/
01-15 A LA PA RO/AR TM TL
01-15 C AC BE FR GO MA MT RU SA VI/GU
01-20 A AR IS JT PA PS RI RO/LA TL
01-20 C AB AC BE FR LR MA RU VI/
01-22 A AR PA RO/LA TM TL
01-22 C AC BE FR GO MA MT RU SA VI/GU
01-27 A AR JT PS RI/IS LA PA RO TL
01-27 C AB AC BE FR LR RU VI/MA
01-29 A AR LA PA RO/TM TL
01-29 C AC BE FR GO MA MT RU SA VI/GU
02-03 A IS JT PA RI RO/AR LA PS TL
02-03 C AB BE MA ME RU VI/AC FR LR
02-05 A AR PA RO/LA TM TL
02-05 C AC BE FR GO MA MT RU SA VI/GU
02-10 A AR IS JT LA PA PS RI RO/TL
02-10 C AC BE FR LR MA ME RU VI/AB
02-12 A AR PA RO/LA TM TL
02-12 C AC BE FR GO MA MT RU SA VI/GU
02-19 A AR PA RO/LA TM TL
02-19 C AC BE FR GO MA MT RU SA VI/GU
02-24 A AR IS JT LA PA PS RI RO/TL
02-24 C AB AC BE FR LR MA ME RU/VI
02-26 A AR LA PA RO/TL
02-26 C AC BE FR GO MA MT RU SA VI/GU
03-03 A JT LA PA PS RI RO/AR IS TL
03-03 C AB AC BE FR LR MA ME RU VI/
03-05 A AR JT LA RO/PA TL
03-05 C AC GO MA MT RU SA VI/BE FR GU
03-10 A AR IS JT PA PS RI RO/LA TL
03-10 C AB AC BE FR LR MA RU VI/ME
03-12 A AR JT PA RO/LA TL
03-12 C AC BE FR GO MA MT RU SA/GU VI
03-17 A AR IS JT LA PA RI RO/PS TL
03-17 C AB AC BE FR LR MA RU VI/ME
03-19 A AR JT PA RO/LA TL
03-19 C BE FR GO MA RU/AC GU MT SA VI
03-24 A AR JT LA PA RI RO/IS PS TL
03-24 C AB BE FR LR MA RU VI/AC ME
03-26 A AR LA PA RO/JT TL
03-26 C BE FR MA MT RU SA VI/AC GO GU
03-31 A AR IS JT LA PA RI RO/PS TL
03-31 C BE FR LR MA ME RU/AB AC VI
04-02 A AR PA RO/JT LA TL
04-02 C MA MT RU SA/AC BE FR GO GU VI
04-07 A AR JT LA PA PS/IS RI RO TL
04-07 C AB LR MA RU VI/AC BE FR ME
04-09 A AR JT LA PA RO/TL
04-09 C BE FR GO MA MT RU SA/AC GU VI
04-14 A AR JT LA PA PS RI RO/IS TL
04-14 C AB BE FR LR MA ME RU VI/AC
04-16 A AR JT PA RO/LA TL
04-16 C AC BE FR GO GU MA MT RU SA VI/
04-28 A AR JT PA RO/IS LA PS RI TL
04-28 C AB AC BE LR MA ME RU VI/FR
04-30 A AR PA RO/JT LA TL
04-30 C AC GO MA MT RU SA VI/BE FR GU
05-05 A AR JT PA RI RO/IS LA PS TL
05-05 C AB BE FR LR RU VI/AC MA ME
05-07 A AR PA RO/JT LA TL
05-07 C BE FR GO MA MT RU SA/AC GU VI
05-12 A AR JT PA PS RI RO/IS LA TL
05-12 C DA FR LR MA ME RU SM/AB AC BE VI
05-14 A JT RO/AR LA PA TL
05-14 C FR GO MA MT RU SA VI/AC BE GU
05-26 A AR JT PA PS RI RO/IS LA TL
05-26 C AB BE DA FR LR RU SM VI/AC MA ME
05-28 A AR JT PA RO/LA TL
05-28 C AC BE FR GO MT RU SA VI/GU MA
06-02 A AR LA PA RI RO/IS JT PS TL
06-02 C BE FR MA ME RU VI/AB AC DA LR SM
06-09 A AR JT LA PA RI/IS PS RO TL
06-09 C BE DA FR LR MA ME RU SM VI/AB AC
06-11 A AR JT LA PA RO/TL
06-11 C BE FR GO MA MT RU SA VI/AC GU
06-16 A AR PA PS RI RO/IS JT LA TL
06-16 C AB BE DA FR MA RU SM VI/AC LR ME`;
const PAY={'01':['PS RI JT:20 LA AR IS LR RU RO AC BE MT MA FR AB VI SA GO','TL PA TM GU'],
  '02':['PS RI JT:20 LA AR ME PA IS LR RU RO AC BE MT MA FR AB VI SA GO','TL TM GU'],
  '03':['PS RI JT LA AR ME PA IS LR RU RO AC BE MT MA FR AB VI SA GO','TL GU'],
  '04':['PS RI JT LA AR ME PA LR RU RO:20 AC BE MT MA FR GU AB VI SA GO','TL IS'],
  '05':['PS RI JT AR ME PA LR RU RO AC BE MT MA FR AB VI SA GO','TL LA IS GU'],
  '06':['PS RI LA AR PA LR RU RO BE MT MA FR AB VI SA GO','TL IS AC GU']};
const months=(from,n)=>{const o=[];let[y,m]=from.split('-').map(Number);for(let i=0;i<n;i++){o.push(`${y}-${String(m).padStart(2,'0')}`);m++;if(m>12){m=1;y++}}return o};

export function seedMeta(){const z={inf:0,norm:0,redInf:0,redNorm:0};const q=()=>({fed:{...z},ass:{...z},seg:{inf:0,norm:0}});
  return{v:1,quotas:{'2026':q(),'2027':q()},
    awardTypes:[{id:'comp',nome:'Comportamento exemplar',pts:5},{id:'desemp',nome:'Desempenho',pts:5},{id:'equipa',nome:'Espírito de equipa',pts:5},{id:'evol',nome:'Maior evolução',pts:10},{id:'prova',nome:'Destaque em prova',pts:10}],
    assidTiers:[{min:90,pts:10},{min:75,pts:5},{min:60,pts:2}],
    tests:[{id:'zz',nome:'Corrida em zig-zag',un:'s',melhor:'min',tent:2,dec:2,crono:true,prot:'Percurso em zig-zag, por tempo'},
      {id:'salto',nome:'Salto em comprimento',un:'cm',melhor:'max',tent:3,dec:0,prot:'Pés juntos, distância alcançada'},
      {id:'coxo',nome:'Amplitude coxo-femoral',un:'°',melhor:'max',tent:1,dec:0,prot:'Medida com transferidor'},
      {id:'pike',nome:'Alcance no pike',un:'cm',melhor:'max',tent:1,dec:0,prot:'A partir da planta dos pés (negativo se não chega)'}],
    graus:['Branco','Amarelo','Laranja','Verde','Azul','Roxo','Castanho','1º Dan','2º Dan'],
    msgs:{pag:'Olá! Confirmamos o pagamento {mens} de {detalhe} do(a) {nome}. Obrigado! — Rodrigo, {clube}',
      lemb:'Olá! Lembrete: está em falta o pagamento {mens} de {detalhe} do(a) {nome}. Obrigado! — Rodrigo, {clube}',
      quota:'Olá! Confirmamos o pagamento de {detalhe} do(a) {nome}. Obrigado! — Rodrigo, {clube}',
      parab:'Muitos parabéns, {nome}! 🥋🎉 Votos de um ano cheio de conquistas. Um abraço do Sensei Rodrigo'}}}

export function seedClubs(){
  const turmas=pre=>[{id:'C',nome:'Crianças',pre:pre+'C'},{id:'A',nome:'Adultos',pre:pre+'A'}];
  const cart={id:'cart',nome:'Cart Wado Karaté',modelo:'gestao',turmas:turmas('C'),
    horarios:[{desde:'2026-01-01',slots:[{t:'C',wd:2,ini:'18:45',fim:'19:45'},{t:'A',wd:2,ini:'19:50',fim:'20:50'},{t:'C',wd:4,ini:'18:45',fim:'19:45'},{t:'A',wd:4,ini:'19:50',fim:'20:50'}]},
      {desde:'2026-09-28',slots:[{t:'C',wd:1,ini:'18:45',fim:'19:45'},{t:'A',wd:1,ini:'19:50',fim:'20:50'},{t:'C',wd:4,ini:'18:45',fim:'19:45'},{t:'A',wd:4,ini:'19:50',fim:'20:50'}]}],
    epocas:{'2025':{inicio:'2026-01-05',fim:'2026-06-30',meses:months('2026-01',6),poupInicial:80},'2026':{inicio:'2026-09-01',fim:'2027-07-31',meses:months('2026-09',11),poupInicial:200}},
    cfg:{valores:[{desde:'2025-09',1:20,2:28}],pctEspaco:[{desde:'2025-09',v:40}],poupMensal:[{desde:'2025-09',v:20}],poupShare:50,entNome:'Cart',poupNome:'Poupança CWK',
      descontos:[{tipo:'irmao',desde:'2025-09',v1:2.5,v2:5.5},{tipo:'irmao',desde:'2026-11',v1:5,v2:5},{tipo:'irmaoOutra',desde:'2026-11',v1:5,v2:5},{tipo:'amigo',desde:'2026-11',v1:5,v2:5,meses:3}],
      descMax:10,pesoJ:0.2},icsExp:[]};
  const flex={id:'flexgym',nome:'Flexgym',modelo:'professor',turmas:turmas('G'),
    horarios:[{desde:'2026-10-02',slots:[{t:'C',wd:2,ini:'18:30',fim:'19:30'},{t:'C',wd:5,ini:'18:30',fim:'19:30'},{t:'A',wd:5,ini:'18:30',fim:'20:00'}]}],
    epocas:{'2026':{inicio:'2026-10-02',fim:'2027-07-31',meses:months('2026-10',10),poupInicial:0}},
    cfg:{valorAluno:14,valorAula:13,modeloPag:'aluno',pesoJ:0.2},icsExp:[]};
  // atletas e dados 25/26 do Cart
  const athletes={},sessions={},payments={},ID={};
  AT.split('\n').forEach(l=>{const[c,f,n,b,t,d]=l.split('|');const id='a'+f;ID[c]=id;const dias=[...(d.includes('T')?[2]:[]),...(d.includes('Q')?[4]:[])];
    athletes[id]={id,fnkp:f,nome:n,nasc:b,curto:'',enc:'',tel:'',canal:'wa',notas:'',grau:'',irmaos:'',irmaoOutra:false,trazidoPor:'',
      insc:{'2025':{turma:t,dias,freq:[{desde:'2025-09',n:dias.length||1}],isento:c==='TL'||!d,desde:c==='ME'?'2026-02':(c==='DA'||c==='SM')?'2026-05':'2026-01',ate:'',manual:[]}}}});
  ['BE','FR'].forEach(c=>athletes[ID[c]].irmaos='Saavedra de Sousa');['DA','SM'].forEach(c=>athletes[ID[c]].irmaos='Vasconcelos Rédua');
  ATT.split('\n').forEach(l=>{const m=l.match(/^(\S+) (\S) (.*)$/);const[p,f]=m[3].split('/');const pres={};
    p.split(' ').filter(Boolean).forEach(c=>pres[ID[c]]='P');(f||'').split(' ').filter(Boolean).forEach(c=>pres[ID[c]]='F');
    const id=`2026-${m[1]}_${m[2]}`;sessions[id]={id,data:`2026-${m[1]}`,turma:m[2],ini:m[2]==='C'?'18:45':'19:50',fim:m[2]==='C'?'19:45':'20:50',tipo:'normal',estado:'dada',plano:'',nota:'',pres}});
  for(const mo in PAY){const k='2026-'+mo,o={};
    PAY[mo][0].split(' ').forEach(x=>{const[c,v]=x.split(':');const a=athletes[ID[c]];const e=a.insc['2025'];const f=e.dias.length||1;
      const base=f===1?20:28;const sib=a.irmaos?(f===1?2.5:5.5):0;o[ID[c]]={s:'P',v:v?+v:base-sib,d:''}});
    PAY[mo][1].split(' ').forEach(c=>{o[ID[c]]={s:'I'}});payments[k]=o}
  return{cart:{doc:cart,athletes,sessions,payments},flexgym:{doc:flex}}}
