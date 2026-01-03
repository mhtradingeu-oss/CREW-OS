// Manual validation script for feature telemetry (FeatureUsageDaily, PlanAwareness)
// Usage: node scripts/validate-feature-telemetry.mjs <featureRoute> <jwt>
import fetch from 'node-fetch';

const [,, featureRoute, jwt] = process.argv;
if (!featureRoute || !jwt) {
  console.error('Usage: node scripts/validate-feature-telemetry.mjs <featureRoute> <jwt>');
  process.exit(1);
}

const url = `http://localhost:4000${featureRoute}`;

fetch(url, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${jwt}`,
    'Content-Type': 'application/json',
  },
})
  .then(res => res.json().then(data => ({ status: res.status, data })))
  .then(({ status, data }) => {
    console.log('Response:', status, data);
    console.log('Now check FeatureUsageDaily and PlanAwareness tables for new rows.');
  })
  .catch(err => {
    console.error('Request failed:', err);
    process.exit(2);
  });
