import { useState, useCallback } from "react";
import * as XLSX from "xlsx";

const INDICATORS = [
  { id:1,  cat:"사회·복지",  name:"청년실업률",    orgId:"101", tblId:"DT_1DA7107S",        prdSe:"M", unit:"%",     threshold:1  },
  { id:2,  cat:"사회·복지",  name:"기초생활수급자", orgId:"117", tblId:"DT_117N_A00301",     prdSe:"Y", unit:"명",    threshold:5  },
  { id:3,  cat:"사회·복지",  name:"노인 독거가구",  orgId:"101", tblId:"DT_1IN1503",         prdSe:"Y", unit:"가구",  threshold:5  },
  { id:4,  cat:"사회·복지",  name:"장애인 등록",    orgId:"117", tblId:"DT_117N_A00124",     prdSe:"Y", unit:"명",    threshold:3  },
  { id:5,  cat:"사회·복지",  name:"출생아 수",      orgId:"101", tblId:"DT_1B8000F",         prdSe:"Y", unit:"명",    threshold:5  },
  { id:6,  cat:"사회·복지",  name:"합계출산율",     orgId:"101", tblId:"DT_1B8000G",         prdSe:"Y", unit:"명",    threshold:3  },
  { id:7,  cat:"사회·복지",  name:"사망자 수",      orgId:"101", tblId:"DT_1B8000E",         prdSe:"Y", unit:"명",    threshold:3  },
  { id:8,  cat:"사회·복지",  name:"어린이집 수",    orgId:"117", tblId:"DT_117N_A00208",     prdSe:"Y", unit:"개소",  threshold:5  },
  { id:9,  cat:"사회·복지",  name:"아동학대 신고",  orgId:"117", tblId:"DT_117N_A00503",     prdSe:"Y", unit:"건",    threshold:5  },
  { id:10, cat:"사회·복지",  name:"한부모가족",     orgId:"117", tblId:"DT_117N_A00601",     prdSe:"Y", unit:"가구",  threshold:5  },
  { id:11, cat:"경제·고용",  name:"고용률",         orgId:"101", tblId:"DT_1DA7107S",        prdSe:"M", unit:"%",     threshold:1  },
  { id:12, cat:"경제·고용",  name:"실업률",         orgId:"101", tblId:"DT_1DA7107S",        prdSe:"M", unit:"%",     threshold:1  },
  { id:13, cat:"경제·고용",  name:"소비자물가지수", orgId:"101", tblId:"DT_1J20004",         prdSe:"M", unit:"지수",  threshold:2  },
  { id:14, cat:"경제·고용",  name:"제조업 취업자",  orgId:"101", tblId:"DT_1DA7002S",        prdSe:"M", unit:"천명",  threshold:3  },
  { id:15, cat:"경제·고용",  name:"평균 임금",      orgId:"118", tblId:"DT_OAA108",          prdSe:"M", unit:"원",    threshold:3  },
  { id:16, cat:"경제·고용",  name:"농가소득",       orgId:"101", tblId:"DT_1EB002",          prdSe:"Y", unit:"만원",  threshold:5  },
  { id:17, cat:"경제·고용",  name:"외국인 근로자",  orgId:"118", tblId:"DT_OAD006",          prdSe:"M", unit:"명",    threshold:5  },
  { id:18, cat:"부동산·인구",name:"아파트 매매가",  orgId:"116", tblId:"DT_MLTM_3034",       prdSe:"M", unit:"지수",  threshold:2  },
  { id:19, cat:"부동산·인구",name:"전세가격지수",   orgId:"116", tblId:"DT_MLTM_3035",       prdSe:"M", unit:"지수",  threshold:2  },
  { id:20, cat:"부동산·인구",name:"인구 이동",      orgId:"101", tblId:"DT_1B26001",         prdSe:"M", unit:"명",    threshold:5  },
  { id:21, cat:"부동산·인구",name:"미분양 주택",    orgId:"116", tblId:"DT_MLTM_2086",       prdSe:"M", unit:"호",    threshold:10 },
  { id:22, cat:"부동산·인구",name:"주민등록인구",   orgId:"101", tblId:"DT_1B040A3",         prdSe:"M", unit:"명",    threshold:3  },
  { id:23, cat:"교육·환경",  name:"학생 수",        orgId:"334", tblId:"DT_334005_2010",     prdSe:"Y", unit:"명",    threshold:3  },
  { id:24, cat:"교육·환경",  name:"교통사고",       orgId:"132", tblId:"DT_13204_111",       prdSe:"Y", unit:"건",    threshold:5  },
];

const CAT_COLOR = { "사회·복지":"#60a5fa","경제·고용":"#fbbf24","부동산·인구":"#f472b6","교육·환경":"#34d399" };
const CATS = ["전체", ...Object.keys(CAT_COLOR)];

async function fetchKosis(ind) {
  const { orgId, tblId, prdSe } = ind;
  const [s, e] = prdSe==="M" ? ["202401","202602"] : prdSe==="Y" ? ["2022","2025"] : ["20231","20254"];
  try {
    const res = await fetch(`/api/kosis?orgId=${orgId}&tblId=${tblId}&prdSe=${prdSe}&startPrdDe=${s}&endPrdDe=${e}`);
    const data = await res.json();
    if (!Array.isArray(data)) return { ok:false, error: data?.errMsg||data?.error||"API 오류" };
    if (data[0]?.ERR_MSG) return { ok:false, error:data[0].ERR_MSG };
    return { ok:true, data };
  } catch(e) {
    return { ok:false, error:"연결 실패" };
  }
}

function parseRegional(rows) {
  const out={}, seen={};
  rows.forEach(row => {
    let region=null;
    for (const v of Object.values(row)) {
      const s=String(v);
      if (s.includes("광주")) { region="광주"; break; }
      if (s.includes("전남")||s.includes("전라남")) { region="전남"; break; }
    }
    if (!region) return;
    const value=parseFloat(row.DT); if (isNaN(value)) return;
    const period=row.PRD_DE||""; if (!period) return;
    if (!seen[region]) seen[region]=new Set();
    if (seen[region].has(period)) return;
    seen[region].add(period);
    if (!out[region]) out[region]=[];
    out[region].push({ period, value, unit:row.UNIT_NM||"" });
  });
  Object.values(out).forEach(a=>a.sort((x,y)=>y.period.localeCompare(x.period)));
  return out;
}

function yoyPeriod(p, s) {
  if (s==="M"&&p.length===6) return `${+p.slice(0,4)-1}${p.slice(4)}`;
  if (s==="Y") return String(+p-1);
  if (s==="Q"&&p.length===5) return `${+p.slice(0,4)-1}${p.slice(4)}`;
  return null;
}
function chg(c,p) { return p&&p!==0?(c-p)/Math.abs(p)*100:null; }

function process(ind, rows) {
  const g=parseRegional(rows); const out={};
  for (const [r,arr] of Object.entries(g)) {
    if (!arr.length) continue;
    const cur=arr[0],prev=arr[1],yp=yoyPeriod(cur.period,ind.prdSe),yo=yp?arr.find(e=>e.period===yp):null;
    out[r]={ v:cur.value, p:cur.period, u:cur.unit||ind.unit, mom:prev?chg(cur.value,prev.value):null, yoy:yo?chg(cur.value,yo.value):null };
  }
  return out;
}

function maxChg(data) {
  if (!data) return 0; let m=0;
  for (const d of Object.values(data)) {
    if (d.mom!=null) m=Math.max(m,Math.abs(d.mom));
    if (d.yoy!=null) m=Math.max(m,Math.abs(d.yoy));
  }
  return m;
}

function fmtP(p,s) {
  if (!p) return "";
  if (s==="M"&&p.length===6) return `${p.slice(0,4)}.${p.slice(4)}`;
  if (s==="Y") return `${p}년`;
  if (s==="Q"&&p.length===5) return `${p.slice(0,4)}년 Q${p.slice(4)}`;
  return p;
}
function fmtC(v) { if (v==null) return null; return `${v>0?"+":""}${v.toFixed(1)}%`; }

async function getAngle(item) {
  if (!item.data||!Object.keys(item.data).length) return "데이터 없음";
  const lines=Object.entries(item.data).map(([r,d])=>{
    const cs=[d.mom!=null&&`전월비 ${fmtC(d.mom)}`,d.yoy!=null&&`전년비 ${fmtC(d.yoy)}`].filter(Boolean).join(", ");
    return `${r}: ${d.v.toLocaleString()} ${d.u} (${cs||"변동없음"})`;
  }).join("\n");
  try {
    const res=await fetch("https://api.anthropic.com/v1/messages",{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000,
        messages:[{role:"user",content:`광주전남 지역신문 기자 관점에서 다음 통계 변화에 대한 기사 각도 2개를 한 줄씩 제안해주세요.\n\n지표: ${item.name}\n${lines}\n\n형식:\n① [취재 각도]\n② [취재 각도]`}]
      })
    });
    const d=await res.json();
    return d.content?.[0]?.text||"생성 실패";
  } catch { return "생성 실패"; }
}

function doExport(results) {
  const wb=XLSX.utils.book_new();
  const fmt=r=>{
    const row={분야:r.cat,지표:r.name,상태:r.error?`오류:${r.error}`:Object.keys(r.data||{}).length?"성공":"데이터없음"};
    for (const [reg,d] of Object.entries(r.data||{})) {
      row[`${reg}_최신값`]=`${d.v.toLocaleString()} ${d.u}`;
      row[`${reg}_기준시점`]=fmtP(d.p,r.prdSe);
      row[`${reg}_전월비`]=fmtC(d.mom)||"-";
      row[`${reg}_전년비`]=fmtC(d.yoy)||"-";
    }
    row["기사각도"]=r.angle||""; return row;
  };
  const urgent=results.filter(r=>r.data&&maxChg(r.data)>=r.threshold);
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(urgent.map(fmt)),"급변항목");
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(results.map(fmt)),"전체현황");
  XLSX.writeFile(wb,`광주전남통계레이더_${new Date().toISOString().slice(0,10)}.xlsx`);
}

function Badge({ value, threshold, label }) {
  if (value==null) return <span style={{color:"#4b5563",fontSize:10,fontFamily:"monospace"}}>-</span>;
  const abs=Math.abs(value);
  const col=abs>=threshold*2?"#ef4444":abs>=threshold?"#f59e0b":"#22c55e";
  return (
    <div style={{display:"flex",alignItems:"center",gap:3}}>
      <span style={{fontSize:10,color:"#6b7280"}}>{label}</span>
      <span style={{background:col+"1a",color:col,border:`1px solid ${col}44`,padding:"1px 5px",borderRadius:3,fontSize:10,fontFamily:"monospace",fontWeight:700}}>{fmtC(value)}</span>
    </div>
  );
}

function Card({ item, onAngle, isLoadingAngle }) {
  const hasData=item.data&&Object.keys(item.data).length>0;
  const mc=hasData?maxChg(item.data):0;
  const isCrit=mc>=item.threshold*2, isWarn=mc>=item.threshold&&!isCrit;
  const cc=CAT_COLOR[item.cat];
  return (
    <div style={{background:"#161b22",border:`1px solid ${isCrit?"#ef444428":isWarn?"#f59e0b28":"#21262d"}`,borderLeft:`3px solid ${isCrit?"#ef4444":isWarn?"#f59e0b":hasData?"#22c55e":"#374151"}`,borderRadius:8,padding:"11px 13px",marginBottom:6}}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap",marginBottom:7}}>
            <span style={{fontSize:10,padding:"2px 7px",borderRadius:4,background:cc+"22",color:cc,fontWeight:700,flexShrink:0}}>{item.cat}</span>
            <span style={{fontWeight:600,fontSize:14}}>{item.name}</span>
            {isCrit&&<span style={{fontSize:10,background:"#ef444418",color:"#ef4444",padding:"1px 6px",borderRadius:4}}>🔴 급변</span>}
            {isWarn&&<span style={{fontSize:10,background:"#f59e0b18",color:"#f59e0b",padding:"1px 6px",borderRadius:4}}>🟡 주목</span>}
            {item.error&&<span style={{fontSize:10,color:"#6b7280",background:"#21262d",padding:"1px 6px",borderRadius:4}}>⚠ {item.error}</span>}
          </div>
          {hasData&&(
            <div style={{display:"flex",flexWrap:"wrap",gap:"6px 18px"}}>
              {Object.entries(item.data).map(([r,d])=>(
                <div key={r} style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}>
                  <span style={{fontSize:11,fontWeight:700,color:"#9ca3af",background:"#21262d",padding:"1px 6px",borderRadius:4,flexShrink:0}}>{r}</span>
                  <span style={{fontFamily:"monospace",fontWeight:700,fontSize:15}}>{d.v.toLocaleString()}<span style={{fontSize:11,color:"#6b7280",marginLeft:2}}>{d.u}</span></span>
                  <Badge value={d.mom} threshold={item.threshold} label="전월"/>
                  <Badge value={d.yoy} threshold={item.threshold} label="전년"/>
                  <span style={{fontSize:10,color:"#4b5563"}}>{fmtP(d.p,item.prdSe)}</span>
                </div>
              ))}
            </div>
          )}
          {item.angle&&(
            <div style={{marginTop:9,padding:"9px 11px",background:"#f59e0b0c",border:"1px solid #f59e0b22",borderRadius:6,fontSize:12.5,color:"#fde68a",lineHeight:1.7,whiteSpace:"pre-line"}}>
              ✍️ {item.angle}
            </div>
          )}
        </div>
        {hasData&&(isCrit||isWarn)&&!item.angle&&(
          <button onClick={()=>onAngle(item.id)} disabled={isLoadingAngle} style={{background:"#21262d",border:"1px solid #30363d",color:isLoadingAngle?"#4b5563":"#f59e0b",padding:"5px 10px",borderRadius:6,cursor:isLoadingAngle?"not-allowed":"pointer",fontSize:12,flexShrink:0}}>
            {isLoadingAngle?"⏳":"✍️ 각도"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState({ n:0, label:"" });
  const [results, setResults] = useState([]);
  const [tab, setTab] = useState("urgent");
  const [cat, setCat] = useState("전체");
  const [loadingAngles, setLoadingAngles] = useState(new Set());

  const startScan = useCallback(async () => {
    setStatus("scanning"); setResults([]);
    const all=[];
    for (let i=0;i<INDICATORS.length;i++) {
      const ind=INDICATORS[i];
      setProgress({ n:i+1, label:ind.name });
      const { ok, data, error }=await fetchKosis(ind);
      const processed=ok&&data.length?process(ind,data):{};
      all.push({ ...ind, data:processed, error:ok?null:error, angle:null });
      setResults([...all]);
      await new Promise(r=>setTimeout(r,300));
    }
    setStatus("done");
  }, []);

  const requestAngle = useCallback(async (id) => {
    const item=results.find(r=>r.id===id);
    if (!item||loadingAngles.has(id)) return;
    setLoadingAngles(p=>new Set([...p,id]));
    const angle=await getAngle(item);
    setResults(p=>p.map(r=>r.id===id?{...r,angle}:r));
    setLoadingAngles(p=>{ const n=new Set(p); n.delete(id); return n; });
  }, [results, loadingAngles]);

  const filtered=cat==="전체"?results:results.filter(r=>r.cat===cat);
  const urgent=filtered.filter(r=>r.data&&maxChg(r.data)>=r.threshold).sort((a,b)=>maxChg(b.data)-maxChg(a.data));
  const successCount=results.filter(r=>r.data&&Object.keys(r.data).length>0).length;
  const errorCount=results.filter(r=>r.error).length;
  const pct=results.length?Math.round(results.length/30*100):0;

  return (
    <div style={{minHeight:"100vh",background:"#0d1117",color:"#e6edf3",fontFamily:"'Apple SD Gothic Neo','Noto Sans KR',sans-serif"}}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#0d1117;}
        ::-webkit-scrollbar{width:5px;}
        ::-webkit-scrollbar-track{background:#161b22;}
        ::-webkit-scrollbar-thumb{background:#30363d;border-radius:3px;}
        button:focus{outline:none;}
      `}</style>

      <div style={{background:"#161b22",borderBottom:"1px solid #21262d",padding:"13px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",gap:11}}>
          <div style={{width:38,height:38,borderRadius:10,background:"linear-gradient(135deg,#f59e0b,#ef4444)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>📡</div>
          <div>
            <div style={{fontWeight:700,fontSize:15}}>광주전남 통계 레이더</div>
            <div style={{fontSize:11,color:"#6b7280",marginTop:1}}>
              {status==="idle"&&"KOSIS Open API · 30개 지표"}
              {status==="scanning"&&`스캔 중 (${results.length}/30) — ${progress.label}`}
              {status==="done"&&`완료 · 성공 ${successCount}개 · 오류 ${errorCount}개`}
            </div>
          </div>
        </div>
        <div style={{display:"flex",gap:8}}>
          {status==="done"&&(
            <button onClick={()=>doExport(results)} style={{background:"#21262d",border:"1px solid #30363d",color:"#e6edf3",padding:"7px 14px",borderRadius:7,cursor:"pointer",fontSize:12,fontWeight:500}}>
              📥 엑셀 저장
            </button>
          )}
          <button onClick={startScan} disabled={status==="scanning"} style={{background:status==="scanning"?"#21262d":"linear-gradient(135deg,#f59e0b,#f97316)",border:"none",color:status==="scanning"?"#6b7280":"#000",padding:"7px 18px",borderRadius:7,cursor:status==="scanning"?"not-allowed":"pointer",fontWeight:700,fontSize:13}}>
            {status==="scanning"?"⏳ 스캔 중...":"🔍 스캔 시작"}
          </button>
        </div>
      </div>

      <div style={{height:3,background:"#21262d"}}>
        <div style={{height:"100%",width:status==="done"?"100%":`${pct}%`,background:"linear-gradient(90deg,#f59e0b,#ef4444)",transition:"width 0.4s ease"}}/>
      </div>

      <div style={{maxWidth:880,margin:"0 auto",padding:"20px 16px 60px"}}>
        {status==="idle"&&(
          <div style={{textAlign:"center",padding:"70px 16px"}}>
            <div style={{fontSize:52,marginBottom:18}}>📡</div>
            <div style={{fontSize:22,fontWeight:700,marginBottom:10}}>광주·전남 통계 변화 레이더</div>
            <div style={{color:"#8b949e",fontSize:14,lineHeight:1.8,marginBottom:32}}>
              KOSIS 30개 지표를 자동 수집해 유의미한 변화를 찾아드립니다.<br/>
              전월비·전년비 동시 분석 + AI 기사 각도 제안 + 엑셀 저장
            </div>
            <div style={{display:"flex",justifyContent:"center",gap:10,flexWrap:"wrap",marginBottom:32}}>
              {Object.entries(CAT_COLOR).map(([c,col])=>(
                <div key={c} style={{background:col+"1a",border:`1px solid ${col}33`,padding:"5px 14px",borderRadius:20,fontSize:13,color:col,fontWeight:500}}>{c}</div>
              ))}
            </div>
            <div style={{background:"#161b22",border:"1px solid #21262d",borderRadius:10,padding:"16px 20px",maxWidth:440,margin:"0 auto",textAlign:"left",fontSize:12.5,color:"#8b949e",lineHeight:1.9}}>
              <div style={{fontWeight:600,color:"#e6edf3",marginBottom:6}}>📌 사용 방법</div>
              <div>① 상단 <b style={{color:"#f59e0b"}}>스캔 시작</b> 버튼 클릭</div>
              <div>② 30개 지표 자동 수집 (약 2~3분 소요)</div>
              <div>③ 급변 알림 탭에서 기사 아이템 확인</div>
              <div>④ <b style={{color:"#f59e0b"}}>✍️ 각도</b> 버튼으로 AI 취재 방향 제안</div>
              <div>⑤ <b style={{color:"#f59e0b"}}>📥 엑셀 저장</b>으로 결과 보관</div>
            </div>
          </div>
        )}

        {results.length>0&&(
          <>
            <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
              {[
                {label:"스캔",v:results.length,col:"#8b949e"},
                {label:"데이터 확보",v:successCount,col:"#22c55e"},
                {label:"급변",v:results.filter(r=>r.data&&maxChg(r.data)>=r.threshold*2).length,col:"#ef4444"},
                {label:"주목",v:results.filter(r=>{const m=maxChg(r.data||{});return m>=r.threshold&&m<r.threshold*2;}).length,col:"#f59e0b"},
                {label:"오류",v:errorCount,col:"#6b7280"},
              ].map(s=>(
                <div key={s.label} style={{background:"#161b22",border:"1px solid #21262d",borderRadius:8,padding:"7px 13px",display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontFamily:"monospace",fontWeight:700,fontSize:18,color:s.col}}>{s.v}</span>
                  <span style={{fontSize:12,color:"#6b7280"}}>{s.label}</span>
                </div>
              ))}
            </div>

            <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
              {CATS.map(c=>{
                const active=cat===c;
                const col=c==="전체"?"#f59e0b":CAT_COLOR[c];
                return <button key={c} onClick={()=>setCat(c)} style={{background:active?col+"22":"transparent",border:`1px solid ${active?col:"#30363d"}`,color:active?col:"#6b7280",padding:"5px 13px",borderRadius:20,cursor:"pointer",fontSize:12.5,fontWeight:active?600:400}}>{c}</button>;
              })}
            </div>

            <div style={{display:"flex",borderBottom:"1px solid #21262d",marginBottom:12}}>
              {[["urgent",`🔴 급변 알림 (${urgent.length})`],["all",`📊 전체 현황 (${filtered.length})`]].map(([key,label])=>(
                <button key={key} onClick={()=>setTab(key)} style={{background:"transparent",border:"none",borderBottom:tab===key?"2px solid #f59e0b":"2px solid transparent",color:tab===key?"#f59e0b":"#6b7280",padding:"9px 18px",cursor:"pointer",fontSize:13,fontWeight:600,marginBottom:-1}}>{label}</button>
              ))}
            </div>

            <div>
              {(tab==="urgent"?urgent:filtered).map(item=>(
                <Card key={item.id} item={item} onAngle={requestAngle} isLoadingAngle={loadingAngles.has(item.id)}/>
              ))}
              {tab==="urgent"&&urgent.length===0&&(
                <div style={{textAlign:"center",padding:"48px 0",color:"#6b7280"}}>
                  {status==="scanning"?"⏳ 데이터 수집 중입니다...":"급변 항목이 없습니다. 전체 현황 탭을 확인해보세요."}
                </div>
              )}
            </div>
          </>
        )}

        {status==="done"&&(
          <div style={{marginTop:28,padding:"10px 14px",background:"#161b22",border:"1px solid #21262d",borderRadius:8,fontSize:11.5,color:"#6b7280",lineHeight:1.7}}>
            🔒 API 키는 서버에서만 사용됩니다 · 출처: KOSIS 국가통계포털
          </div>
        )}
      </div>
    </div>
  );
}
