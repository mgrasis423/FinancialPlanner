import { useState, useMemo, useCallback } from "react";

/* ── palette ─────────────────────────────────────────── */
const C = {
  bg:"#0B0D10",surface:"#12151A",card:"#171B22",cardAlt:"#1C2029",
  border:"#252A35",borderLt:"#2F3542",
  green:"#34D399",greenDim:"rgba(52,211,153,.12)",greenMid:"rgba(52,211,153,.3)",
  blue:"#60A5FA",blueDim:"rgba(96,165,250,.12)",
  amber:"#FBBF24",amberDim:"rgba(251,191,36,.12)",
  red:"#F87171",redDim:"rgba(248,113,113,.12)",
  purple:"#A78BFA",purpleDim:"rgba(167,139,250,.12)",
  cyan:"#22D3EE",cyanDim:"rgba(34,211,238,.12)",
  txt:"#E4E8EF",mid:"#8B95A5",dim:"#505A6A",white:"#FFF",
};
const $ = n => n==null||isNaN(n)?"$0":"$"+Math.round(n).toLocaleString();
const $k = n => n>=1e6?`$${(n/1e6).toFixed(1)}M`:n>=1e3?`$${(n/1e3).toFixed(0)}K`:$(n);
const pct = n => (n*100).toFixed(1)+"%";
const pmt=(r,n,pv)=>r===0?pv/n:(pv*r*Math.pow(1+r,n))/(Math.pow(1+r,n)-1);

/* ── tiny components ─────────────────────────────────── */
const In = ({label,value,onChange,pre="$",suf,help,min,max,step})=>(
  <div style={{marginBottom:10}}>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
      <label style={{fontSize:10,fontWeight:600,color:C.mid,letterSpacing:".06em",textTransform:"uppercase"}}>{label}</label>
      {help&&<span style={{fontSize:9,color:C.dim}}>{help}</span>}
    </div>
    <div style={{display:"flex",alignItems:"center",background:C.bg,border:`1px solid ${C.border}`,borderRadius:5,overflow:"hidden"}}>
      {pre&&<span style={{padding:"6px 0 6px 8px",color:C.dim,fontSize:12,fontFamily:"'JetBrains Mono',monospace",userSelect:"none"}}>{pre}</span>}
      <input type="number" value={value} min={min} max={max} step={step||1}
        onChange={e=>onChange(e.target.value===""?"":Number(e.target.value))}
        style={{flex:1,background:"transparent",border:"none",outline:"none",color:C.txt,fontSize:13,padding:"6px 8px 6px 4px",fontFamily:"'JetBrains Mono',monospace",width:"100%",minWidth:0}}/>
      {suf&&<span style={{padding:"6px 8px 6px 0",color:C.dim,fontSize:11,fontFamily:"'JetBrains Mono',monospace",userSelect:"none"}}>{suf}</span>}
    </div>
  </div>
);

const Slider=({label,value,onChange,min=0,max=100,step=1,fmt:f,color=C.green,help})=>(
  <div style={{marginBottom:14}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:4}}>
      <span style={{fontSize:10,fontWeight:600,color:C.mid,letterSpacing:".06em",textTransform:"uppercase"}}>{label}</span>
      <span style={{fontSize:13,fontWeight:700,color,fontFamily:"'JetBrains Mono',monospace"}}>{f?f(value):value}</span>
    </div>
    {help&&<div style={{fontSize:9,color:C.dim,marginBottom:4}}>{help}</div>}
    <input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))}
      style={{width:"100%",accentColor:color,height:4,cursor:"pointer"}}/>
  </div>
);

const Card=({children,style,...p})=>(
  <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:18,...style}} {...p}>{children}</div>
);

const SectionHead=({icon,title,color=C.green})=>(
  <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:14}}>
    <span style={{fontSize:15}}>{icon}</span>
    <span style={{fontSize:12,fontWeight:700,color,letterSpacing:".07em",textTransform:"uppercase",fontFamily:"'Outfit',sans-serif"}}>{title}</span>
  </div>
);

const Pill=({children,color,bg})=>(
  <span style={{display:"inline-block",fontSize:9,fontWeight:700,color,background:bg,padding:"3px 8px",borderRadius:4,letterSpacing:".05em",textTransform:"uppercase"}}>{children}</span>
);

const Tip=({children,color=C.green,icon="💡"})=>(
  <div style={{display:"flex",gap:8,padding:"10px 12px",borderRadius:7,background:color===C.green?C.greenDim:color===C.amber?C.amberDim:color===C.red?C.redDim:C.blueDim,marginBottom:10,alignItems:"flex-start"}}>
    <span style={{fontSize:14,flexShrink:0,marginTop:1}}>{icon}</span>
    <span style={{fontSize:12,color:C.txt,lineHeight:1.5}}>{children}</span>
  </div>
);

const Row=({label,value,color=C.txt,bold,sub})=>(
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",padding:"4px 0"}}>
    <span style={{fontSize:12,color:C.mid}}>{label}</span>
    <div style={{textAlign:"right"}}>
      <span style={{fontSize:bold?14:12,fontWeight:bold?700:500,color,fontFamily:"'JetBrains Mono',monospace"}}>{value}</span>
      {sub&&<div style={{fontSize:9,color:C.dim}}>{sub}</div>}
    </div>
  </div>
);

const Bar=({pct:p,color,label,h=8})=>(
  <div style={{marginBottom:6}}>
    {label&&<div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
      <span style={{fontSize:10,color:C.mid}}>{label}</span>
      <span style={{fontSize:10,color,fontFamily:"'JetBrains Mono',monospace",fontWeight:600}}>{Math.round(p*100)}%</span>
    </div>}
    <div style={{height:h,background:C.bg,borderRadius:h/2,overflow:"hidden"}}>
      <div style={{height:"100%",width:`${Math.min(p*100,100)}%`,background:color,borderRadius:h/2,transition:"width .4s"}}/>
    </div>
  </div>
);

const ScoreRing=({score,label,size=100})=>{
  const r=size/2-6,circ=2*Math.PI*r,offset=circ*(1-score/100);
  const color=score>=80?C.green:score>=60?C.amber:C.red;
  return(
    <div style={{textAlign:"center"}}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={5}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`} style={{transition:"stroke-dashoffset .6s"}}/>
        <text x={size/2} y={size/2-2} textAnchor="middle" dominantBaseline="central"
          fill={color} fontSize={size/3.5} fontWeight={700} fontFamily="'JetBrains Mono',monospace">{score}</text>
        <text x={size/2} y={size/2+14} textAnchor="middle" fill={C.dim} fontSize={8} fontWeight={600} textTransform="uppercase">{label}</text>
      </svg>
    </div>
  );
};

const BucketBar=({items,total})=>(
  <div style={{display:"flex",height:14,borderRadius:7,overflow:"hidden",marginBottom:8}}>
    {items.map((it,i)=><div key={i} title={`${it.label}: ${$(it.value)}`}
      style={{width:`${(it.value/total)*100}%`,background:it.color,minWidth:it.value>0?3:0,transition:"width .4s"}}/>)}
  </div>
);

const DebtRow=({d,onChange,onRemove})=>(
  <div style={{display:"grid",gridTemplateColumns:"1fr 90px 80px 70px 28px",gap:5,alignItems:"end",marginBottom:6}}>
    {[["Name","name","text"],["Balance","balance","number"],["Mo.Pmt","payment","number"],["Rate%","rate","number"]].map(([l,k,t])=>(
      <div key={k}>
        <label style={{fontSize:8,color:C.dim,textTransform:"uppercase",letterSpacing:".04em"}}>{l}</label>
        <input type={t} value={d[k]} step={k==="rate"?.1:1}
          onChange={e=>onChange({...d,[k]:t==="number"?Number(e.target.value):e.target.value})}
          style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:4,color:C.txt,fontSize:11,
            padding:"5px 6px",outline:"none",fontFamily:t==="number"?"'JetBrains Mono',monospace":"'Outfit',sans-serif",boxSizing:"border-box"}}/>
      </div>
    ))}
    <button onClick={onRemove} style={{background:C.redDim,border:"none",borderRadius:4,color:C.red,fontSize:13,cursor:"pointer",padding:"5px",lineHeight:1}}>×</button>
  </div>
);

/* ══════════════════════════════════════════════════════ */
export default function App(){
  const [phase,setPhase]=useState("input"); // input | plan

  /* ── Inputs ───────────────── */
  const [salary,setSalary]=useState(120000);
  const [bonus,setBonus]=useState(0);
  const [sideIncome,setSideIncome]=useState(0);
  const [filing,setFiling]=useState("single");
  const [retContrib,setRetContrib]=useState(6); // % of gross going to 401k
  const [employerMatch,setEmployerMatch]=useState(4); // %

  const [debts,setDebts]=useState([
    {id:1,name:"Auto Loan",balance:18000,payment:420,rate:5.9},
    {id:2,name:"Student Loan",balance:25000,payment:280,rate:4.5},
  ]);
  const addDebt=()=>setDebts(p=>[...p,{id:Date.now(),name:"",balance:0,payment:0,rate:0}]);

  const [expenses,setExpenses]=useState(2200);
  const [currentRent,setCurrentRent]=useState(1800);
  const [subscriptions,setSubscriptions]=useState(150);

  const [cash,setCash]=useState(80000);
  const [brokerage,setBrokerage]=useState(35000);
  const [retirement,setRetirement]=useState(60000);
  const [cryptoAssets,setCryptoAssets]=useState(0);

  const [creditScore,setCreditScore]=useState(740);
  const [age,setAge]=useState(30);
  const [retirementAge,setRetirementAge]=useState(65);

  /* ── Plan configurables ──── */
  const [homePrice,setHomePrice]=useState(500000);
  const [downPct,setDownPct]=useState(20);
  const [mortRate,setMortRate]=useState(6.75);
  const [loanTerm,setLoanTerm]=useState(30);
  const [propTaxRate,setPropTaxRate]=useState(1.1);
  const [homeInsurance,setHomeInsurance]=useState(1800);
  const [hoa,setHoa]=useState(0);
  const [closingPct,setClosingPct]=useState(3);

  const [priority,setPriority]=useState("balanced"); // aggressive-save | balanced | home-first | invest-heavy
  const [riskTolerance,setRiskTolerance]=useState("moderate");
  const [emergencyTarget,setEmergencyTarget]=useState(6); // months

  /* ── Derived calculations ─────────────────────────── */
  const calc = useMemo(()=>{
    const gross = salary+bonus+sideIncome;
    const ret401k = salary*(retContrib/100);
    const matchAmt = salary*(Math.min(retContrib,employerMatch)/100);

    // Tax (simplified)
    const stdDed = filing==="married"?30000:15000;
    const taxable = Math.max(0, gross - ret401k - stdDed);
    const brackets = filing==="married"
      ?[[23200,.10],[71100,.12],[106750,.22],[182850,.24],[103550,.32],[243750,.35],[Infinity,.37]]
      :[[11600,.10],[35550,.12],[53375,.22],[91425,.24],[51775,.32],[365625,.35],[Infinity,.37]];
    let fed=0,rem=taxable;
    for(const[s,r]of brackets){const a=Math.min(rem,s);fed+=a*r;rem-=a;if(rem<=0)break;}
    const fica=Math.min(gross,168600)*.0765;
    const state=gross*.05;
    const totalTax=fed+fica+state;
    const annualNet=gross-totalTax-ret401k;
    const monthlyNet=annualNet/12;

    // Debts
    const debtPmt=debts.reduce((s,d)=>s+d.payment,0);
    const debtBal=debts.reduce((s,d)=>s+d.balance,0);
    const highestRate=debts.length?Math.max(...debts.map(d=>d.rate)):0;
    const sortedDebts=[...debts].sort((a,b)=>b.rate-a.rate); // avalanche order

    // Current monthly spending (pre-home)
    const currentMonthlyOut = currentRent+expenses+subscriptions+debtPmt;
    const currentCashFlow = monthlyNet - currentMonthlyOut;

    // Liquid assets
    const liquid = cash;
    const totalAssets = cash+brokerage+retirement+cryptoAssets;
    const netWorth = totalAssets - debtBal;

    // ── Home purchase ──
    const downPayment = homePrice*(downPct/100);
    const closingCosts = homePrice*(closingPct/100);
    const totalCashNeeded = downPayment+closingCosts;
    const cashAfterClose = liquid - totalCashNeeded;
    const loanAmt = homePrice-downPayment;
    const mr = mortRate/100/12;
    const nPmt = loanTerm*12;
    const pi = pmt(mr,nPmt,loanAmt);
    const propTax = (homePrice*(propTaxRate/100))/12;
    const ins = homeInsurance/12;
    const pmiRate = downPct<20?(downPct<10?.01:.005):0;
    const pmiAmt = (loanAmt*pmiRate)/12;
    const totalHousing = pi+propTax+ins+pmiAmt+hoa;
    const frontDTI = totalHousing/(gross/12);
    const backDTI = (totalHousing+debtPmt)/(gross/12);

    // Monthly after buying
    const monthlyOutAfter = totalHousing+expenses+subscriptions+debtPmt;
    const cashFlowAfter = monthlyNet - monthlyOutAfter;

    // Emergency fund
    const emergencyNeed = monthlyOutAfter * emergencyTarget;
    const emergencyGap = emergencyNeed - cashAfterClose;
    const emergencyMonths = monthlyOutAfter>0?cashAfterClose/monthlyOutAfter:99;

    // ── Investment allocation ──
    // After housing, debts, expenses → what's left to allocate
    const freeMonthly = Math.max(0, cashFlowAfter);

    // Priority-based allocation engine
    let alloc = { extraDebt:0, emergency:0, roth:0, brokerage:0, homeSave:0, fun:0 };

    const needsEmergency = cashAfterClose < emergencyNeed;
    const hasHighDebt = highestRate > 6;
    const canBuyHome = cashAfterClose >= 0;

    if(priority==="aggressive-save"){
      // Max retirement & investments, min lifestyle
      const funBudget = Math.min(freeMonthly*0.05, 200);
      const remaining = freeMonthly - funBudget;
      alloc.fun = funBudget;
      if(needsEmergency){ alloc.emergency = Math.min(remaining*0.3, emergencyGap>0?emergencyGap/6:0); }
      if(hasHighDebt){ alloc.extraDebt = Math.min((remaining-alloc.emergency)*0.2, debtBal>0?500:0); }
      const investable = remaining - alloc.emergency - alloc.extraDebt;
      alloc.roth = Math.min(investable*0.5, 583); // ~$7k/yr
      alloc.brokerage = investable - alloc.roth;
    } else if(priority==="home-first"){
      // If can't buy yet, save aggressively for down payment
      if(!canBuyHome){
        const funBudget = Math.min(freeMonthly*0.08, 300);
        alloc.fun = funBudget;
        const r = freeMonthly-funBudget;
        alloc.homeSave = r*0.7;
        alloc.roth = Math.min(r*0.15, 583);
        alloc.extraDebt = r*0.15;
      } else {
        // Already buying — rebuild emergency + invest
        const funBudget = Math.min(freeMonthly*0.1, 400);
        alloc.fun = funBudget;
        const r = freeMonthly-funBudget;
        if(needsEmergency){ alloc.emergency = Math.min(r*0.4, emergencyGap>0?emergencyGap/4:0); }
        const rest = r-alloc.emergency;
        alloc.extraDebt = hasHighDebt?Math.min(rest*0.2, 500):0;
        alloc.roth = Math.min((rest-alloc.extraDebt)*0.5, 583);
        alloc.brokerage = rest - alloc.extraDebt - alloc.roth;
      }
    } else if(priority==="invest-heavy"){
      const funBudget = Math.min(freeMonthly*0.08, 300);
      alloc.fun = funBudget;
      const r = freeMonthly-funBudget;
      if(needsEmergency){ alloc.emergency = Math.min(r*0.15, emergencyGap>0?emergencyGap/6:0); }
      alloc.extraDebt = hasHighDebt?Math.min((r-alloc.emergency)*0.1, 300):0;
      const investable = r - alloc.emergency - alloc.extraDebt;
      alloc.roth = Math.min(investable*0.4, 583);
      alloc.brokerage = investable - alloc.roth;
    } else { // balanced
      const funBudget = Math.min(freeMonthly*0.1, 400);
      alloc.fun = funBudget;
      const r = freeMonthly-funBudget;
      if(needsEmergency){ alloc.emergency = Math.min(r*0.25, emergencyGap>0?emergencyGap/5:0); }
      alloc.extraDebt = hasHighDebt?Math.min((r-alloc.emergency)*0.2, 500):0;
      const rest = r - alloc.emergency - alloc.extraDebt;
      alloc.roth = Math.min(rest*0.4, 583);
      alloc.brokerage = rest - alloc.roth;
    }

    // Round allocations
    Object.keys(alloc).forEach(k=>alloc[k]=Math.max(0,Math.round(alloc[k])));

    // ── Debt payoff timeline ──
    const debtTimelines = sortedDebts.map(d=>{
      if(d.payment<=0||d.balance<=0) return {...d, months:0, totalInterest:0};
      const mRate = d.rate/100/12;
      let bal=d.balance, months=0, totInt=0;
      const extraForThis = (alloc.extraDebt>0 && d.id===sortedDebts[0]?.id)?alloc.extraDebt:0;
      while(bal>0 && months<600){
        const intCharge = bal*mRate;
        totInt+=intCharge;
        bal -= (d.payment+extraForThis-intCharge);
        months++;
      }
      return {...d, months, totalInterest:Math.round(totInt)};
    });

    // ── Investment projections ──
    const annualReturn = riskTolerance==="conservative"?.06:riskTolerance==="moderate"?.08:.10;
    const monthlyInvest = alloc.roth+alloc.brokerage;
    const yearsToRetire = Math.max(1, retirementAge-age);
    const currentInvested = brokerage+retirement+matchAmt; // starting balance
    // FV of existing + FV of monthly contributions
    const fvExisting = currentInvested * Math.pow(1+annualReturn, yearsToRetire);
    const fvContrib = monthlyInvest>0?(monthlyInvest * ((Math.pow(1+annualReturn/12, yearsToRetire*12)-1)/(annualReturn/12))):0;
    const projectedRetirement = fvExisting + fvContrib;
    const safeWithdrawal = projectedRetirement * 0.04; // 4% rule

    // ── Max affordable home ──
    const maxFrontDTI = 0.28;
    const maxHousingPmt = (gross/12)*maxFrontDTI;
    const maxPITI = maxHousingPmt; // simplified
    const estTaxIns = 600; // rough monthly for taxes+insurance
    const maxPI = maxPITI - estTaxIns;
    const maxLoan = maxPI>0?(maxPI*(Math.pow(1+mr,nPmt)-1))/(mr*Math.pow(1+mr,nPmt)):0;
    const maxHome = maxLoan / (1-downPct/100);

    // ── Health score ──
    let score=50;
    if(frontDTI<=.28) score+=12; else if(frontDTI<=.33) score+=6;
    if(backDTI<=.36) score+=10; else if(backDTI<=.43) score+=4;
    if(cashFlowAfter>500) score+=10; else if(cashFlowAfter>0) score+=5; else score-=10;
    if(emergencyMonths>=emergencyTarget) score+=8; else if(emergencyMonths>=3) score+=4;
    if(!hasHighDebt) score+=5;
    if(retContrib>=10) score+=5; else if(retContrib>=6) score+=3;
    score = Math.max(0,Math.min(100,score));

    // Affordability verdict
    let verdict, verdictColor;
    if(!canBuyHome){ verdict="Can't Afford"; verdictColor=C.red; }
    else if(frontDTI>.33||backDTI>.43||cashFlowAfter<0){ verdict="Stretch"; verdictColor=C.red; }
    else if(frontDTI>.28||backDTI>.36||cashFlowAfter<300){ verdict="Tight but Possible"; verdictColor=C.amber; }
    else { verdict="Comfortable"; verdictColor=C.green; }

    return {
      gross,ret401k,matchAmt,totalTax,annualNet,monthlyNet,
      debtPmt,debtBal,highestRate,sortedDebts,
      currentMonthlyOut,currentCashFlow,
      liquid,totalAssets,netWorth,
      downPayment,closingCosts,totalCashNeeded,cashAfterClose,loanAmt,
      pi,propTax,ins,pmiAmt,totalHousing,frontDTI,backDTI,
      monthlyOutAfter,cashFlowAfter,
      emergencyNeed,emergencyGap,emergencyMonths,
      freeMonthly,alloc,
      debtTimelines,
      monthlyInvest,projectedRetirement,safeWithdrawal,annualReturn,yearsToRetire,fvExisting,fvContrib,
      maxHome,
      score,verdict,verdictColor,
      canBuyHome,needsEmergency,hasHighDebt,
    };
  },[salary,bonus,sideIncome,filing,retContrib,employerMatch,debts,expenses,currentRent,subscriptions,
    cash,brokerage,retirement,cryptoAssets,creditScore,age,retirementAge,
    homePrice,downPct,mortRate,loanTerm,propTaxRate,homeInsurance,hoa,closingPct,
    priority,riskTolerance,emergencyTarget]);

  /* ── Render ───────────────────────────────────────── */
  return(
    <div style={{background:C.bg,minHeight:"100vh",color:C.txt,fontFamily:"'Outfit',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet"/>

      {/* Header */}
      <div style={{padding:"20px 20px 0",maxWidth:1100,margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
          <div style={{width:34,height:34,borderRadius:8,background:`linear-gradient(135deg,${C.green},${C.blue})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,fontWeight:800,color:C.bg}}>₿</div>
          <div>
            <h1 style={{margin:0,fontSize:20,fontWeight:800,letterSpacing:"-.02em",color:C.white}}>Financial Command Center</h1>
            <p style={{margin:0,fontSize:10,color:C.dim,letterSpacing:".05em"}}>INCOME · DEBT · HOME · INVEST · RETIRE</p>
          </div>
        </div>
      </div>

      {/* Phase toggle */}
      <div style={{padding:"14px 20px",maxWidth:1100,margin:"0 auto",display:"flex",gap:8}}>
        {[["input","📝 My Finances"],["plan","🧭 My Plan"]].map(([k,l])=>(
          <button key={k} onClick={()=>setPhase(k)}
            style={{background:phase===k?C.greenDim:"transparent",color:phase===k?C.green:C.dim,
              border:`1px solid ${phase===k?C.green:C.border}`,borderRadius:6,padding:"7px 16px",
              fontSize:11,fontWeight:700,cursor:"pointer",letterSpacing:".04em",textTransform:"uppercase",fontFamily:"'Outfit',sans-serif"}}>
            {l}
          </button>
        ))}
      </div>

      <div style={{padding:"0 20px 50px",maxWidth:1100,margin:"0 auto"}}>

      {/* ═══════ INPUT PHASE ═══════ */}
      {phase==="input"&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:14}}>
          {/* Col 1 */}
          <div>
            <Card style={{marginBottom:14}}>
              <SectionHead icon="💰" title="Income & Taxes" color={C.green}/>
              <In label="Annual Salary" value={salary} onChange={setSalary}/>
              <In label="Bonus / Commission" value={bonus} onChange={setBonus} help="annual"/>
              <In label="Side Income" value={sideIncome} onChange={setSideIncome} help="annual"/>
              <div style={{display:"flex",gap:8,marginBottom:10}}>
                {["single","married"].map(s=>(
                  <button key={s} onClick={()=>setFiling(s)}
                    style={{flex:1,padding:"7px",borderRadius:5,border:`1px solid ${filing===s?C.green:C.border}`,
                      background:filing===s?C.greenDim:"transparent",color:filing===s?C.green:C.dim,
                      fontSize:11,fontWeight:600,cursor:"pointer",textTransform:"capitalize",fontFamily:"'Outfit',sans-serif"}}>{s}</button>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <In label="401k Contribution" value={retContrib} onChange={setRetContrib} pre="" suf="%" help="of salary"/>
                <In label="Employer Match" value={employerMatch} onChange={setEmployerMatch} pre="" suf="%" help="up to"/>
              </div>
              <div style={{background:C.bg,borderRadius:6,padding:10,fontSize:11,marginTop:4}}>
                <Row label="Gross Annual" value={$(calc.gross)} color={C.green}/>
                <Row label="401k Deduction" value={`-${$(calc.ret401k)}`} color={C.dim}/>
                <Row label="Est. Total Tax" value={`-${$(calc.totalTax)}`} color={C.red}/>
                <div style={{borderTop:`1px solid ${C.border}`,marginTop:4,paddingTop:4}}>
                  <Row label="Monthly Take-Home" value={$(calc.monthlyNet)} color={C.green} bold/>
                </div>
              </div>
            </Card>

            <Card style={{marginBottom:14}}>
              <SectionHead icon="🧾" title="Monthly Expenses" color={C.amber}/>
              <In label="Living Expenses" value={expenses} onChange={setExpenses} help="food, utils, transport"/>
              <In label="Current Rent" value={currentRent} onChange={setCurrentRent}/>
              <In label="Subscriptions & Memberships" value={subscriptions} onChange={setSubscriptions}/>
              <div style={{background:C.bg,borderRadius:6,padding:10,fontSize:11,marginTop:4}}>
                <Row label="Total Monthly Out" value={$(calc.currentMonthlyOut)} color={C.amber}/>
                <Row label="Current Cash Flow" value={$(calc.currentCashFlow)} color={calc.currentCashFlow>=0?C.green:C.red} bold/>
              </div>
            </Card>

            <Card>
              <SectionHead icon="👤" title="Profile" color={C.purple}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                <In label="Age" value={age} onChange={setAge} pre=""/>
                <In label="Retire Age" value={retirementAge} onChange={setRetirementAge} pre=""/>
                <In label="Credit Score" value={creditScore} onChange={setCreditScore} pre="" min={300} max={850}/>
              </div>
            </Card>
          </div>

          {/* Col 2 */}
          <div>
            <Card style={{marginBottom:14}}>
              <SectionHead icon="📊" title="Debts" color={C.red}/>
              {debts.map(d=><DebtRow key={d.id} d={d}
                onChange={nd=>setDebts(p=>p.map(x=>x.id===d.id?nd:x))}
                onRemove={()=>setDebts(p=>p.filter(x=>x.id!==d.id))}/>)}
              <button onClick={addDebt} style={{width:"100%",background:"transparent",border:`1px dashed ${C.border}`,
                borderRadius:5,color:C.dim,fontSize:10,padding:"6px",cursor:"pointer",fontFamily:"'Outfit',sans-serif",marginTop:4}}>+ Add Debt</button>
              <div style={{background:C.bg,borderRadius:6,padding:10,fontSize:11,marginTop:8}}>
                <Row label="Total Balance" value={$(calc.debtBal)} color={C.red}/>
                <Row label="Monthly Payments" value={$(calc.debtPmt)} color={C.amber}/>
                {calc.highestRate>0&&<Row label="Highest Rate" value={calc.highestRate+"%"} color={calc.highestRate>6?C.red:C.amber}/>}
              </div>
            </Card>

            <Card style={{marginBottom:14}}>
              <SectionHead icon="🏦" title="Assets & Savings" color={C.blue}/>
              <In label="Cash / Savings" value={cash} onChange={setCash} help="for down payment"/>
              <In label="Brokerage / Taxable" value={brokerage} onChange={setBrokerage}/>
              <In label="Retirement Accounts" value={retirement} onChange={setRetirement} help="401k, IRA"/>
              <In label="Crypto / Alt Assets" value={cryptoAssets} onChange={setCryptoAssets}/>
              <div style={{background:C.bg,borderRadius:6,padding:10,fontSize:11,marginTop:4}}>
                <Row label="Total Assets" value={$(calc.totalAssets)} color={C.blue}/>
                <Row label="Total Debts" value={`-${$(calc.debtBal)}`} color={C.red}/>
                <div style={{borderTop:`1px solid ${C.border}`,marginTop:4,paddingTop:4}}>
                  <Row label="Net Worth" value={$(calc.netWorth)} color={calc.netWorth>=0?C.green:C.red} bold/>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ═══════ PLAN PHASE ═══════ */}
      {phase==="plan"&&(
        <div>
          {/* Top bar: score + verdict + key metrics */}
          <Card style={{marginBottom:14,display:"flex",flexWrap:"wrap",gap:16,alignItems:"center",justifyContent:"space-around"}}>
            <ScoreRing score={calc.score} label="Health"/>
            <div style={{textAlign:"center"}}>
              <Pill color={calc.verdictColor} bg={calc.verdictColor===C.green?C.greenDim:calc.verdictColor===C.amber?C.amberDim:C.redDim}>
                {calc.verdict}
              </Pill>
              <div style={{fontSize:22,fontWeight:800,color:C.white,fontFamily:"'JetBrains Mono',monospace",marginTop:6}}>{$(homePrice)}</div>
              <div style={{fontSize:9,color:C.dim,textTransform:"uppercase",letterSpacing:".06em"}}>Target Home</div>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:18,fontWeight:700,color:C.green,fontFamily:"'JetBrains Mono',monospace"}}>{$(calc.cashFlowAfter)}</div>
              <div style={{fontSize:9,color:C.dim,textTransform:"uppercase"}}>Monthly Free Cash</div>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:18,fontWeight:700,color:C.blue,fontFamily:"'JetBrains Mono',monospace"}}>{$k(calc.maxHome)}</div>
              <div style={{fontSize:9,color:C.dim,textTransform:"uppercase"}}>Max Affordable</div>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:18,fontWeight:700,color:C.purple,fontFamily:"'JetBrains Mono',monospace"}}>{$k(calc.projectedRetirement)}</div>
              <div style={{fontSize:9,color:C.dim,textTransform:"uppercase"}}>Projected @ {retirementAge}</div>
            </div>
          </Card>

          {/* Controls row */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:14,marginBottom:14}}>
            <Card>
              <SectionHead icon="🏠" title="Home Purchase" color={C.white}/>
              <Slider label="Home Price" value={homePrice} onChange={setHomePrice} min={100000} max={1500000} step={10000} fmt={$} color={C.white}/>
              <Slider label="Down Payment" value={downPct} onChange={setDownPct} min={3} max={40} fmt={v=>v+"%"} color={C.green}
                help={`${$(homePrice*downPct/100)} cash needed`}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <In label="Rate" value={mortRate} onChange={setMortRate} pre="" suf="%" step={.125}/>
                <In label="Term" value={loanTerm} onChange={setLoanTerm} pre="" suf="yrs"/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
                <In label="Tax %" value={propTaxRate} onChange={setPropTaxRate} pre="" suf="%" step={.1}/>
                <In label="Insur/yr" value={homeInsurance} onChange={setHomeInsurance}/>
                <In label="HOA" value={hoa} onChange={setHoa}/>
              </div>
              <In label="Closing Costs" value={closingPct} onChange={setClosingPct} pre="" suf="%" step={.5}/>
            </Card>

            <Card>
              <SectionHead icon="⚙️" title="Strategy & Priorities" color={C.cyan}/>
              <div style={{marginBottom:14}}>
                <label style={{fontSize:10,fontWeight:600,color:C.mid,letterSpacing:".06em",textTransform:"uppercase",marginBottom:6,display:"block"}}>Priority Mode</label>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                  {[["balanced","⚖️ Balanced"],["home-first","🏠 Home First"],["invest-heavy","📈 Invest Heavy"],["aggressive-save","🚀 Aggressive Save"]].map(([k,l])=>(
                    <button key={k} onClick={()=>setPriority(k)}
                      style={{padding:"8px 6px",borderRadius:6,border:`1px solid ${priority===k?C.cyan:C.border}`,
                        background:priority===k?C.cyanDim:"transparent",color:priority===k?C.cyan:C.dim,
                        fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif",textAlign:"left"}}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{marginBottom:14}}>
                <label style={{fontSize:10,fontWeight:600,color:C.mid,letterSpacing:".06em",textTransform:"uppercase",marginBottom:6,display:"block"}}>Risk Tolerance</label>
                <div style={{display:"flex",gap:6}}>
                  {["conservative","moderate","aggressive"].map(r=>(
                    <button key={r} onClick={()=>setRiskTolerance(r)}
                      style={{flex:1,padding:"7px",borderRadius:5,border:`1px solid ${riskTolerance===r?C.purple:C.border}`,
                        background:riskTolerance===r?C.purpleDim:"transparent",color:riskTolerance===r?C.purple:C.dim,
                        fontSize:10,fontWeight:600,cursor:"pointer",textTransform:"capitalize",fontFamily:"'Outfit',sans-serif"}}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <Slider label="Emergency Fund Target" value={emergencyTarget} onChange={setEmergencyTarget}
                min={3} max={12} fmt={v=>v+" months"} color={C.amber}/>

              {/* Context-aware tips */}
              {calc.hasHighDebt && <Tip color={C.amber} icon="⚡">You have debt above 6% — the plan prioritizes accelerated payoff on your highest-rate debt first (avalanche method).</Tip>}
              {downPct<20 && <Tip color={C.amber} icon="🛡️">Below 20% down triggers PMI of ~{$(calc.pmiAmt)}/mo. Consider whether saving more upfront is worth it.</Tip>}
              {calc.frontDTI>.33 && <Tip color={C.red} icon="🚨">Front-end DTI exceeds 33%. Most lenders cap at 28-33%. Lower your target home price or increase income.</Tip>}
              {calc.cashAfterClose<0 && <Tip color={C.red} icon="💸">You don't have enough cash to close. You're {$(Math.abs(calc.cashAfterClose))} short. Reduce down payment or save more first.</Tip>}
              {calc.cashFlowAfter<0 && <Tip color={C.red} icon="📉">Negative monthly cash flow after purchase. This is not sustainable — reduce home price or debt first.</Tip>}
              {calc.score>=80 && <Tip color={C.green} icon="✅">Strong financial position. You have room for both homeownership and solid investing. Stay the course.</Tip>}
            </Card>
          </div>

          {/* ── The Plan: Where Every Dollar Goes ── */}
          <Card style={{marginBottom:14}}>
            <SectionHead icon="💵" title="Your Monthly Dollar Plan" color={C.green}/>
            <div style={{fontSize:12,color:C.mid,marginBottom:12}}>
              After purchasing, here's how the plan allocates your {$(calc.monthlyNet)}/mo take-home based on <strong style={{color:C.cyan}}>{priority.replace("-"," ")}</strong> mode.
            </div>

            {/* Full budget bar */}
            <BucketBar total={calc.monthlyNet} items={[
              {label:"Housing",value:calc.totalHousing,color:C.red},
              {label:"Debts",value:calc.debtPmt,color:C.amber},
              {label:"Living",value:expenses+subscriptions,color:C.blue},
              {label:"Invest",value:calc.alloc.roth+calc.alloc.brokerage,color:C.purple},
              {label:"Emergency",value:calc.alloc.emergency,color:C.amber},
              {label:"Extra Debt",value:calc.alloc.extraDebt,color:"#FF6B6B"},
              {label:"Fun",value:calc.alloc.fun,color:C.cyan},
              {label:calc.alloc.homeSave>0?"Home Fund":"Unallocated",value:Math.max(0,calc.freeMonthly-Object.values(calc.alloc).reduce((a,b)=>a+b,0)),color:C.dim},
            ]}/>

            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:8}}>
              {[
                ["🏠 Housing (PITI)",calc.totalHousing,C.red, `${pct(calc.frontDTI)} front-end DTI`],
                ["💳 Debt Payments",calc.debtPmt,C.amber,`${debts.length} debts`],
                ["🛒 Living + Subs",expenses+subscriptions,C.blue,"non-negotiable"],
                ["📈 Roth IRA",calc.alloc.roth,C.purple,calc.alloc.roth>=583?"maxing out":"below max ($583/mo)"],
                ["📊 Brokerage",calc.alloc.brokerage,C.purple,`${riskTolerance} risk`],
                ["🛡️ Emergency Fund",calc.alloc.emergency,C.amber,calc.needsEmergency?`${calc.emergencyMonths.toFixed(1)}mo → ${emergencyTarget}mo target`:"✓ fully funded"],
                ["⚡ Extra Debt Payoff",calc.alloc.extraDebt,"#FF6B6B",calc.hasHighDebt?"avalanche method":"no high-rate debt"],
                ["🎉 Discretionary",calc.alloc.fun,C.cyan,"entertainment, dining, etc."],
              ].map(([label,value,color,sub])=>(
                <div key={label} style={{background:C.bg,borderRadius:7,padding:"10px 12px"}}>
                  <div style={{fontSize:10,color:C.mid,marginBottom:2}}>{label}</div>
                  <div style={{fontSize:16,fontWeight:700,color,fontFamily:"'JetBrains Mono',monospace"}}>{$(value)}</div>
                  <div style={{fontSize:9,color:C.dim,marginTop:2}}>{sub}</div>
                </div>
              ))}
            </div>

            {calc.alloc.homeSave>0&&(
              <div style={{marginTop:10,background:C.greenDim,borderRadius:7,padding:12,textAlign:"center"}}>
                <div style={{fontSize:10,color:C.green,textTransform:"uppercase",letterSpacing:".06em"}}>Saving for Down Payment</div>
                <div style={{fontSize:20,fontWeight:700,color:C.green,fontFamily:"'JetBrains Mono',monospace"}}>{$(calc.alloc.homeSave)}/mo</div>
                <div style={{fontSize:10,color:C.mid,marginTop:2}}>
                  {Math.abs(calc.cashAfterClose)>0?`~${Math.ceil(Math.abs(calc.cashAfterClose)/calc.alloc.homeSave)} months to reach down payment`:""}
                </div>
              </div>
            )}
          </Card>

          {/* ── Detail panels ── */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))",gap:14}}>

            {/* Home purchase detail */}
            <Card>
              <SectionHead icon="🏠" title="Home Purchase Breakdown" color={C.white}/>
              <Row label="Home Price" value={$(homePrice)} color={C.white} bold/>
              <Row label={`Down Payment (${downPct}%)`} value={$(calc.downPayment)}/>
              <Row label={`Closing Costs (${closingPct}%)`} value={$(calc.closingCosts)}/>
              <div style={{borderTop:`1px solid ${C.border}`,margin:"6px 0"}}/>
              <Row label="Total Cash to Close" value={$(calc.totalCashNeeded)} color={C.amber} bold/>
              <Row label="Cash Remaining" value={$(calc.cashAfterClose)} color={calc.cashAfterClose>=0?C.green:C.red} bold/>
              <div style={{borderTop:`1px solid ${C.border}`,margin:"6px 0"}}/>
              <Row label="Loan Amount" value={$(calc.loanAmt)}/>
              <Row label="Principal & Interest" value={$(calc.pi)+"/mo"}/>
              <Row label="Property Tax" value={$(calc.propTax)+"/mo"}/>
              <Row label="Insurance" value={$(calc.ins)+"/mo"}/>
              {calc.pmiAmt>0&&<Row label="PMI" value={$(calc.pmiAmt)+"/mo"} color={C.amber}/>}
              {hoa>0&&<Row label="HOA" value={$(hoa)+"/mo"}/>}
              <div style={{borderTop:`1px solid ${C.border}`,margin:"6px 0"}}/>
              <Row label="Total Housing" value={$(calc.totalHousing)+"/mo"} color={C.white} bold/>
              <Row label="Front-End DTI" value={pct(calc.frontDTI)} color={calc.frontDTI<=.28?C.green:calc.frontDTI<=.33?C.amber:C.red}/>
              <Row label="Back-End DTI" value={pct(calc.backDTI)} color={calc.backDTI<=.36?C.green:calc.backDTI<=.43?C.amber:C.red}/>
              <div style={{marginTop:10,background:C.bg,borderRadius:6,padding:10,textAlign:"center"}}>
                <div style={{fontSize:9,color:C.dim,textTransform:"uppercase"}}>vs. Current Rent</div>
                <div style={{fontSize:16,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",
                  color:calc.totalHousing-currentRent>0?C.red:C.green}}>
                  {calc.totalHousing-currentRent>=0?"+":""}{$(calc.totalHousing-currentRent)}/mo
                </div>
              </div>
            </Card>

            {/* Debt strategy */}
            <Card>
              <SectionHead icon="⚡" title="Debt Payoff Strategy" color={C.red}/>
              {calc.debtTimelines.length===0?(
                <Tip color={C.green} icon="🎉">Debt-free! All free cash goes to investing and saving.</Tip>
              ):(
                <>
                  <div style={{fontSize:11,color:C.mid,marginBottom:10}}>
                    Avalanche method: attacking highest rate first{calc.alloc.extraDebt>0?` with ${$(calc.alloc.extraDebt)}/mo extra`:""}.
                  </div>
                  {calc.debtTimelines.map((d,i)=>(
                    <div key={d.id} style={{background:C.bg,borderRadius:6,padding:10,marginBottom:8}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:4}}>
                        <span style={{fontSize:12,fontWeight:600,color:C.txt}}>{d.name||"Debt "+(i+1)}</span>
                        <Pill color={i===0&&calc.alloc.extraDebt>0?C.red:C.dim} bg={i===0&&calc.alloc.extraDebt>0?C.redDim:C.surface}>
                          {i===0&&calc.alloc.extraDebt>0?"Priority":"Standard"}
                        </Pill>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,fontSize:11}}>
                        <div><div style={{color:C.dim,fontSize:9,textTransform:"uppercase"}}>Balance</div><div style={{fontFamily:"'JetBrains Mono',monospace",color:C.red}}>{$(d.balance)}</div></div>
                        <div><div style={{color:C.dim,fontSize:9,textTransform:"uppercase"}}>Payoff</div><div style={{fontFamily:"'JetBrains Mono',monospace",color:C.amber}}>{Math.ceil(d.months/12)}yr {d.months%12}mo</div></div>
                        <div><div style={{color:C.dim,fontSize:9,textTransform:"uppercase"}}>Interest Cost</div><div style={{fontFamily:"'JetBrains Mono',monospace",color:C.dim}}>{$(d.totalInterest)}</div></div>
                      </div>
                      <Bar pct={1-d.balance/(d.balance+d.totalInterest)} color={d.rate>=6?C.red:C.amber} label={`${d.rate}% APR`} h={5}/>
                    </div>
                  ))}
                </>
              )}
            </Card>

            {/* Investment & retirement */}
            <Card>
              <SectionHead icon="📈" title="Investment & Retirement" color={C.purple}/>
              <div style={{background:C.bg,borderRadius:7,padding:12,marginBottom:12,textAlign:"center"}}>
                <div style={{fontSize:9,color:C.dim,textTransform:"uppercase",letterSpacing:".06em"}}>Projected Portfolio at Age {retirementAge}</div>
                <div style={{fontSize:26,fontWeight:800,color:C.purple,fontFamily:"'JetBrains Mono',monospace",margin:"6px 0"}}>{$k(calc.projectedRetirement)}</div>
                <div style={{fontSize:11,color:C.mid}}>Safe withdrawal (4% rule): <strong style={{color:C.green}}>{$k(calc.safeWithdrawal)}/yr</strong> = {$(calc.safeWithdrawal/12)}/mo</div>
              </div>

              <Row label="Currently Invested" value={$(brokerage+retirement+calc.matchAmt)}/>
              <Row label="Monthly Contributions" value={$(calc.monthlyInvest)} color={C.purple} sub={`Roth ${$(calc.alloc.roth)} + Brokerage ${$(calc.alloc.brokerage)}`}/>
              <Row label="401k Contrib (pre-tax)" value={$(calc.ret401k/12)+"/mo"} color={C.mid} sub={`+${$(calc.matchAmt/12)} employer match`}/>
              <Row label="Assumed Return" value={(calc.annualReturn*100).toFixed(0)+"%/yr"} color={C.mid}/>
              <Row label="Years to Retire" value={calc.yearsToRetire+""}/>
              <div style={{borderTop:`1px solid ${C.border}`,margin:"8px 0"}}/>
              <div style={{fontSize:11,color:C.mid,marginBottom:6}}>Growth Breakdown</div>
              <div style={{display:"flex",gap:8}}>
                <div style={{flex:1,background:C.bg,borderRadius:6,padding:10,textAlign:"center"}}>
                  <div style={{fontSize:9,color:C.dim,textTransform:"uppercase"}}>From Existing</div>
                  <div style={{fontSize:14,fontWeight:700,color:C.blue,fontFamily:"'JetBrains Mono',monospace"}}>{$k(calc.fvExisting)}</div>
                </div>
                <div style={{flex:1,background:C.bg,borderRadius:6,padding:10,textAlign:"center"}}>
                  <div style={{fontSize:9,color:C.dim,textTransform:"uppercase"}}>From New Contrib</div>
                  <div style={{fontSize:14,fontWeight:700,color:C.purple,fontFamily:"'JetBrains Mono',monospace"}}>{$k(calc.fvContrib)}</div>
                </div>
              </div>
              {calc.alloc.roth<583&&(
                <Tip color={C.amber} icon="💡" >You're contributing {$(calc.alloc.roth)}/mo to Roth — below the $583/mo max. Shift priority to "Invest Heavy" or "Aggressive Save" to max it out.</Tip>
              )}
            </Card>

            {/* Emergency fund */}
            <Card>
              <SectionHead icon="🛡️" title="Emergency Fund" color={C.amber}/>
              <div style={{textAlign:"center",marginBottom:12}}>
                <div style={{fontSize:28,fontWeight:800,fontFamily:"'JetBrains Mono',monospace",
                  color:calc.emergencyMonths>=emergencyTarget?C.green:calc.emergencyMonths>=3?C.amber:C.red}}>
                  {calc.emergencyMonths.toFixed(1)} mo
                </div>
                <div style={{fontSize:10,color:C.dim,textTransform:"uppercase"}}>of expenses covered after closing</div>
              </div>
              <Bar pct={Math.min(calc.emergencyMonths/emergencyTarget,1)} color={calc.emergencyMonths>=emergencyTarget?C.green:C.amber}
                label={`Target: ${emergencyTarget} months (${$(calc.emergencyNeed)})`}/>

              <Row label="Monthly Expenses (post-buy)" value={$(calc.monthlyOutAfter)}/>
              <Row label="Cash After Close" value={$(Math.max(0,calc.cashAfterClose))} color={calc.cashAfterClose>=0?C.green:C.red}/>
              <Row label="Target Fund" value={$(calc.emergencyNeed)} color={C.amber}/>

              {calc.needsEmergency&&calc.alloc.emergency>0?(
                <div style={{marginTop:8,background:C.amberDim,borderRadius:6,padding:10,textAlign:"center"}}>
                  <div style={{fontSize:9,color:C.amber,textTransform:"uppercase"}}>Building at</div>
                  <div style={{fontSize:16,fontWeight:700,color:C.amber,fontFamily:"'JetBrains Mono',monospace"}}>{$(calc.alloc.emergency)}/mo</div>
                  <div style={{fontSize:10,color:C.mid,marginTop:2}}>
                    ~{Math.ceil(calc.emergencyGap/calc.alloc.emergency)} months to fully funded
                  </div>
                </div>
              ):(
                <Tip color={C.green} icon="✅">Emergency fund meets your {emergencyTarget}-month target after closing. Funds are redirected to investing.</Tip>
              )}
            </Card>

            {/* Affordability scale */}
            <Card style={{gridColumn:"1/-1"}}>
              <SectionHead icon="📐" title="Home Affordability Scale" color={C.white}/>
              <div style={{fontSize:11,color:C.mid,marginBottom:14}}>
                Based on your income, debts, and a {downPct}% down target, here's how different home prices affect your financial health.
              </div>
              <div style={{overflowX:"auto"}}>
                <div style={{display:"flex",gap:8,minWidth:"fit-content",paddingBottom:4}}>
                  {[...Array(8)].map((_,i)=>{
                    const hp = Math.round((calc.maxHome*0.5) + i*(calc.maxHome*0.15));
                    const dp = hp*(downPct/100);
                    const la = hp-dp;
                    const mr2 = mortRate/100/12;
                    const p = pmt(mr2,loanTerm*12,la);
                    const tx = (hp*(propTaxRate/100))/12;
                    const insr = homeInsurance/12;
                    const pm = downPct<20?(la*(downPct<10?.01:.005))/12:0;
                    const th = p+tx+insr+pm+hoa;
                    const fd = th/(calc.gross/12);
                    const cf = calc.monthlyNet-th-calc.debtPmt-expenses-subscriptions;
                    const ca = cash-dp-(hp*(closingPct/100));
                    const isTarget = Math.abs(hp-homePrice)<homePrice*0.05;
                    const color = fd<=.28&&cf>300&&ca>=0?C.green:fd<=.33&&cf>=0&&ca>=0?C.amber:C.red;
                    return(
                      <div key={i} style={{minWidth:110,background:isTarget?C.cardAlt:C.bg,border:`1px solid ${isTarget?color:C.border}`,
                        borderRadius:8,padding:10,textAlign:"center",boxShadow:isTarget?`0 0 12px ${color}33`:"none"}}>
                        {isTarget&&<div style={{fontSize:8,color,fontWeight:700,textTransform:"uppercase",marginBottom:4}}>▼ Your Target</div>}
                        <div style={{fontSize:13,fontWeight:700,color:C.white,fontFamily:"'JetBrains Mono',monospace"}}>{$k(hp)}</div>
                        <div style={{fontSize:10,color,fontWeight:600,margin:"4px 0"}}>{pct(fd)} DTI</div>
                        <div style={{fontSize:10,color:C.mid}}>{$(th)}/mo</div>
                        <div style={{fontSize:10,fontWeight:600,color:cf>=0?C.green:C.red,fontFamily:"'JetBrains Mono',monospace"}}>{$(cf)}</div>
                        <div style={{fontSize:8,color:C.dim}}>free cash</div>
                        {ca<0&&<div style={{fontSize:8,color:C.red,marginTop:2}}>⚠ short {$k(Math.abs(ca))}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
