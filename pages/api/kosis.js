export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const KOSIS_KEY = "ZDE4ZDE2ZGJkMjllNjk2ZDQ2MTNkNDZkZGFkYmMzNmU=";
  const { orgId, tblId, prdSe, startPrdDe, endPrdDe } = req.query;

  const combos = [
    "&objL1=ALL",
    "&objL1=ALL&objL2=ALL",
    "&objL1=ALL&objL2=ALL&objL3=ALL",
  ];

  // 브라우저처럼 보이는 헤더
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "ko-KR,ko;q=0.9",
    "Referer": "https://kosis.kr/",
    "Origin": "https://kosis.kr",
  };

  for (const extra of combos) {
    const url = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KOSIS_KEY}&orgId=${orgId}&tblId=${tblId}${extra}&itmId=ALL&format=json&jsonVD=Y&prdSe=${prdSe}&startPrdDe=${startPrdDe}&endPrdDe=${endPrdDe}`;
    try {
      const r = await fetch(url, { headers });
      const text = await r.text();
      console.log(`[${tblId}] status:${r.status} body:${text.slice(0,200)}`);
      let data;
      try { data = JSON.parse(text); } catch { continue; }
      if (!Array.isArray(data)) continue;
      if (data[0]?.err === "20") continue;
      if (data[0]?.ERR_MSG) continue;
      return res.status(200).json(data);
    } catch(e) {
      console.log(`[${tblId}] error:`, e.message);
      continue;
    }
  }

  // 로그 확인용 - 마지막 에러 반환
  res.status(200).json([{ ERR_MSG: "fetch 실패 - kosis.kr 접근 불가" }]);
}
```

커밋 후 다시 이 URL 테스트해주세요
```
https://kosis-radar.vercel.app/api/kosis?orgId=101&tblId=DT_1B040A3&prdSe=M&startPrdDe=202401&endPrdDe=202602
