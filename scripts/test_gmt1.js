// Quick test for GMT+1 date string conversion
const toGMT1DateStr = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  const gmt1 = new Date(d.getTime() + 3600 * 1000);
  return gmt1.toISOString().split('T')[0];
};

const tests = [
  '2026-01-17T22:00:00Z', // 23:00 CET => same day
  '2026-01-17T23:30:00Z', // 00:30 CET next day
  '2026-01-17T00:10:00Z', // early same day
  new Date(),
];

console.log('Now (UTC):', new Date().toISOString());
for (const t of tests) {
  console.log(t, '->', toGMT1DateStr(t));
}
