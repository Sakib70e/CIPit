import { env } from "./src/config/env.js";

async function runTests() {
  const BASE_URL = "http://localhost:3000/api";
  console.log("Starting Auth Tests...\n");

  // 1. Get Public Route (GET /inventory)
  let res = await fetch(`${BASE_URL}/inventory`);
  let data = await res.json();
  console.log("GET /inventory (No Auth):", res.status, data.success ? "PASS" : "FAIL");

  // 2. Post Admin Route (POST /inventory)
  res = await fetch(`${BASE_URL}/inventory`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemName: "Test Item", size: "1L", price: 10 })
  });
  data = await res.json();
  console.log("POST /inventory (No Auth):", res.status === 401 ? "PASS (Blocked)" : "FAIL", data.message);

  // 3. Register a Customer
  res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Cust1", phone: "1111111111", password: "pass" })
  });
  
  // Login as Customer
  res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: "1111111111", password: "pass" })
  });
  const customerLogin = await res.json();
  const customerToken = customerLogin.data?.token;

  if (customerToken) {
    // 4. Customer tries Admin Route
    res = await fetch(`${BASE_URL}/inventory`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${customerToken}` },
      body: JSON.stringify({ itemName: "Test Item", size: "1L", price: 10 })
    });
    data = await res.json();
    console.log("POST /inventory (Customer Auth):", res.status === 403 ? "PASS (Blocked 403)" : "FAIL", data.message);
  } else {
    console.log("Customer login failed. Cannot test Customer Auth.");
  }

  // 5. Login as Admin
  res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: "0000000000", password: "adminPassword123" }) // from earlier admin bootstrap
  });

  const adminLogin = await res.json();
  // if admin bootstrap didn't work exactly as that, we can just do another bootstrap
  if(!adminLogin.data?.token) {
    console.log("Bootstrapping admin...");
    await fetch(`${BASE_URL}/admin/bootstrap`, {
      method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Admin_2", phone: "2222222222", password: "admin", supervisor_key: "super_secret_supervisor_key" })
    });
    const adLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "2222222222", password: "admin" })
    });
    const adD = await adLogin.json();
    adminLogin.data = adD.data;
  }

  const adminToken = adminLogin.data?.token;

  if (adminToken) {
    // 6. Admin tries Admin Route
    const rand = Math.random().toString();
    res = await fetch(`${BASE_URL}/inventory`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminToken}` },
      body: JSON.stringify({ itemName: `Test Item ${rand}`, size: "1L", price: 10 })
    });
    data = await res.json();
    console.log("POST /inventory (Admin Auth):", res.status === 200 || res.status === 201 ? "PASS (Created)" : "FAIL", res.status, data.message);
  } else {
    console.log("Admin login failed. Cannot test Admin Auth.");
  }

  console.log("\nFinished tests.");
}

runTests();
