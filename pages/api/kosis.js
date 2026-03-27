export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const KOSIS_KEY = "ZDE4ZDE2ZGJkMjllNjk2ZDQ2MTNkNDZkZGFkYmMzNmU=";
  const { mode, orgId, tblId, prdSe, startPrdDe, endPrdDe, searchNm } = req.query;

  // ── 모드 1: tblId 자동 검색 ──────────────────────────
  if (mode === "search") {
    const url = `https://kosis.kr/openapi/statisticsSearch.do?method=getList&apiKey=${KOSIS_KEY}&searchNm=${encodeURIComponent(searchNm)}&format=json&jsonVD=Y`;
    try {
      const r = await fetch(url);
      const data = await r.json();
      return res.status(200).json(data);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── 모드 2: 데이터 수집 ──────────────────────────────
  const combos = [
    "objL1=ALL",
    "objL1=ALL&objL2=ALL",
    "objL1=ALL&objL2=ALL&objL3=ALL",
  ];

  for (const objL of combos) {
    const url = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KOSIS_KEY}&orgId=${orgId}&tblId=${tblId}&${objL}&itmId=ALL&format=json&jsonVD=Y&prdSe=${prdSe}&startPrdDe=${startPrdDe}&endPrdDe=${endPrdDe}`;
    try {
      const r = await fetch(url);
      const data = await r.json();
      if (!Array.isArray(data)) continue;
      if (data[0]?.err === "20") continue;
      if (data[0]?.ERR_MSG) continue;
      return res.status(200).json(data);
    } catch { continue; }
  }

  res.status(200).json({ err: "1", errMsg: "fetch 실패" });
}
