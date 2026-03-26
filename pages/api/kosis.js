export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  const { orgId, tblId, prdSe, startPrdDe, endPrdDe } = req.query;

  const KOSIS_KEY = "ZDE4ZDE2ZGJkMjllNjk2ZDQ2MTNkNDZkZGFkYmMzNmU=";

  const url = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KOSIS_KEY}&orgId=${orgId}&tblId=${tblId}&objL1=ALL&objL2=ALL&itmId=ALL&format=json&jsonVD=Y&prdSe=${prdSe}&startPrdDe=${startPrdDe}&endPrdDe=${endPrdDe}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "fetch 실패", detail: err.message });
  }
}
