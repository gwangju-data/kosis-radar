export const config = { runtime: "edge" };

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const orgId      = searchParams.get("orgId");
  const tblId      = searchParams.get("tblId");
  const prdSe      = searchParams.get("prdSe");
  const startPrdDe = searchParams.get("startPrdDe");
  const endPrdDe   = searchParams.get("endPrdDe");

  const KOSIS_KEY = "ZDE4ZDE2ZGJkMjllNjk2ZDQ2MTNkNDZkZGFkYmMzNmU=";

  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/json",
    "Accept-Language": "ko-KR,ko;q=0.9",
    "Referer": "https://kosis.kr/",
  };

  const combos = ["", "&objL2=ALL", "&objL2=ALL&objL3=ALL"];

  for (const extra of combos) {
    const url = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KOSIS_KEY}&orgId=${orgId}&tblId=${tblId}&objL1=ALL${extra}&itmId=ALL&format=json&jsonVD=Y&prdSe=${prdSe}&startPrdDe=${startPrdDe}&endPrdDe=${endPrdDe}`;
    try {
      const r = await fetch(url, { headers });
      const text = await r.text();
      let data;
      try { data = JSON.parse(text); } catch { continue; }
      if (!Array.isArray(data)) continue;
      if (data[0]?.err === "20") continue;
      if (data[0]?.ERR_MSG) continue;
      return new Response(JSON.stringify(data), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    } catch { continue; }
  }

  return new Response(JSON.stringify([{ ERR_MSG: "fetch 실패" }]), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
```

커밋 후 이 URL 다시 테스트해주세요
```
https://kosis-radar.vercel.app/api/kosis?orgId=101&tblId=DT_1B040A3&prdSe=M&startPrdDe=202401&endPrdDe=202602
