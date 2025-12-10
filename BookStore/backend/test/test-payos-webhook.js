const crypto = require("crypto");
const axios = require("axios");

const CHECKSUM_KEY = "098516a8a32f1908c5c863afaf5bc9402cc786aad4531020264d5d4189c14b35";

function sortObjDataByKey(object) {
  return Object.keys(object)
    .sort()
    .reduce((obj, key) => {
      obj[key] = object[key];
      return obj;
    }, {});
}

function convertObjToQueryStr(object) {
  return Object.keys(object)
    .map((key) => `${key}=${object[key]}`)
    .join("&");
}

function generateSignature(data, checksum) {
  const sorted = sortObjDataByKey(data);
  const query = convertObjToQueryStr(sorted);
  return crypto.createHmac("sha256", checksum).update(query).digest("hex");
}

(async () => {
  const data = {
    accountNumber: "123456789",
    amount: 69000,
    currency: "VND",
    description: "Thanh toán đơn hàng sách",
    orderCode: 1765353576022,
    paymentLinkId: "pl_123456",
    reference: "Ref123",
    transactionDateTime: "2025-12-10T14:30:00"
  };

  const signature = generateSignature(data, CHECKSUM_KEY);

  console.log("🟣 CLIENT RAW QUERY:", convertObjToQueryStr(sortObjDataByKey(data)));
  console.log("🟣 CLIENT SIGNATURE:", signature);

  const res = await axios.post(
    "http://localhost:3000/payos/webhook",
    { data, signature },
    { headers: { "Content-Type": "application/json" } }
  );

  console.log(res.data);
})();
