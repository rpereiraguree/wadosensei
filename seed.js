// Dados iniciais: configuração dos dois clubes (sem dados pessoais)
// Os dados pessoais dos atletas NÃO estão aqui (o código é público): importam-se do ficheiro cart-2025-26.json.
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
      descMax:10,pesoJ:0.2,local:'CART',municipal:'06-24',pausas:[]},icsExp:[]};
  const flex={id:'flexgym',nome:'Flexgym',modelo:'professor',turmas:turmas('G'),
    horarios:[{desde:'2026-10-02',slots:[{t:'C',wd:2,ini:'18:30',fim:'19:30'},{t:'C',wd:5,ini:'18:30',fim:'19:30'},{t:'A',wd:5,ini:'18:30',fim:'20:00'}]}],
    epocas:{'2026':{inicio:'2026-10-02',fim:'2027-07-31',meses:months('2026-10',10),poupInicial:0}},
    cfg:{valorAluno:14,valorAula:13,modeloPag:'aluno',pesoJ:0.2,local:'FlexGym',pausas:[]},icsExp:[]};
  return{cart:{doc:cart},flexgym:{doc:flex}}}
