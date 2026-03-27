export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const KOSIS_KEY = "ZDE4ZDE2ZGJkMjllNjk2ZDQ2MTNkNDZkZGFkYmMzNmU=";
  const { orgId, tblId, prdSe, startPrdDe, endPrdDe } = req.query;

  const combos = [
    "",
    "&objL2=ALL",
    "&objL2=ALL&objL3=ALL",
  ];

  for (const extra of combos) {
    const url = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KOSIS_KEY}&orgId=${orgId}&tblId=${tblId}&objL1=ALL${extra}&itmId=ALL&format=json&jsonVD=Y&prdSe=${prdSe}&startPrdDe=${startPrdDe}&endPrdDe=${endPrdDe}`;
    try {
      const r = await fetch(url);
      const text = await r.text();
      let data;
      try { data = JSON.parse(text); } catch { continue; }
      if (!Array.isArray(data)) continue;
      if (data[0]?.err === "20") continue;
      if (data[0]?.ERR_MSG) {
        if (data[0].ERR_MSG.includes("40,000")) {
          // 기간 줄여서 재시도
          const url2 = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KOSIS_KEY}&orgId=${orgId}&tblId=${tblId}&objL1=ALL${extra}&itmId=ALL&format=json&jsonVD=Y&prdSe=${prdSe}&startPrdDe=${startPrdDe}&endPrdDe=${endPrdDe}&newEstPrdCnt=3`;
          const r2 = await fetch(url2);
          const d2 = await r2.json();
          if (Array.isArray(d2) && !d2[0]?.ERR_MSG) return res.status(200).json(d2);
        }
        continue;
      }
      return res.status(200).json(data);
    } catch { continue; }
  }

  res.status(200).json([{ ERR_MSG: "fetch 실패" }]);
}
