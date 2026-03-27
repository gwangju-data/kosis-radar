export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  const { orgId, tblId, prdSe, startPrdDe, endPrdDe } = req.query;
  const KOSIS_KEY = "ZDE4ZDE2ZGJkMjllNjk2ZDQ2MTNkNDZkZGFkYmMzNmU=";

  // objL 조합을 자동으로 시도
  const objLCombos = [
    "objL1=ALL",
    "objL1=ALL&objL2=ALL",
    "objL1=ALL&objL2=ALL&objL3=ALL",
  ];

  for (const objL of objLCombos) {
    const url = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KOSIS_KEY}&orgId=${orgId}&tblId=${tblId}&${objL}&itmId=ALL&format=json&jsonVD=Y&prdSe=${prdSe}&startPrdDe=${startPrdDe}&endPrdDe=${endPrdDe}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (!Array.isArray(data)) continue;
      if (data[0]?.err === "20") continue; // 파라미터 오류면 다음 조합 시도
      if (data[0]?.ERR_MSG?.includes("40,000")) {
        // 40000셀 초과시 기간 단축해서 재시도
        const shortUrl = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KOSIS_KEY}&orgId=${orgId}&tblId=${tblId}&${objL}&itmId=ALL&format=json&jsonVD=Y&prdSe=${prdSe}&startPrdDe=${startPrdDe}&endPrdDe=${endPrdDe}&newEstPrdCnt=2`;
        const r2 = await fetch(shortUrl);
        const d2 = await r2.json();
        if (Array.isArray(d2) && !d2[0]?.ERR_MSG) {
          return res.status(200).json(d2);
        }
        continue;
      }
      if (data[0]?.ERR_MSG) continue;
      return res.status(200).json(data);
    } catch (err) {
      continue;
    }
  }

  res.status(200).json({ err: "1", errMsg: "fetch 실패" });
}
