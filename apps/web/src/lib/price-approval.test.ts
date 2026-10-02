import assert from "node:assert/strict";
import test from "node:test";
import { configuredApproverIds, isActivePriceApprover, canApprovePrice, hasPriceApproval, projectPriceVersion } from "./price-approval.ts";

const project = { retailMultiplier: 2, pricingPolicy: "ALL_COSTS", vendorBills: [
  { id: "p", amount: 54, category: "OUTSIDE_PRINTING", vendorName: "K&L" },
] };

test("owner approval requires a configured immutable identity", () => {
  assert.equal(canApprovePrice("robert", ""), false);
  assert.equal(canApprovePrice("laurie", "robert"), false);
  assert.equal(canApprovePrice("robert", "robert"), true);
});

test("approval binds to the complete cost/pricing version and fails closed", () => {
  const version = projectPriceVersion(project);
  const approval = { priceApprovedVersion: version, priceApprovedById: "robert", priceApprovedAt: new Date() };
  assert.equal(hasPriceApproval(approval, version), true);
  assert.equal(hasPriceApproval({ ...approval, priceApprovedAt: null }, version), false);
  for (const changed of [
    { ...project, retailMultiplier: 3 },
    { ...project, pricingPolicy: "LEGACY_DELIVERY_AT_COST" },
    { ...project, vendorBills: [{ ...project.vendorBills[0], amount: 55 }] },
    { ...project, vendorBills: [{ ...project.vendorBills[0], vendorName: "Corrected description" }] },
  ]) assert.equal(hasPriceApproval(approval, projectPriceVersion(changed)), false);
});


test("both explicit approved IDs pass; partial/unlisted identities fail", () => {
  const ids="cmkmwyr4900004mqfqkfjnfek,cmkofikao0000grnyo9og4rxe";
  assert.equal(canApprovePrice("cmkmwyr4900004mqfqkfjnfek",ids),true);
  assert.equal(canApprovePrice("cmkofikao0000grnyo9og4rxe",ids),true);
  assert.equal(canApprovePrice("cmkmwyr",ids),false);
  assert.equal(canApprovePrice("unlisted",ids),false);
  assert.deepEqual(configuredApproverIds(" a, a ,b "),["a","b"]);
});
test("configured approval still requires a current active admin record", async () => {
 const prior=process.env.PRICE_APPROVER_USER_IDS;process.env.PRICE_APPROVER_USER_IDS="fixture-a,fixture-b";
 try {
  for(const id of ["fixture-a","fixture-b"]){
   const tx={user:{findUnique:async()=>({role:"ADMIN",status:"APPROVED"})}} as unknown as Parameters<typeof isActivePriceApprover>[0];
   assert.equal(await isActivePriceApprover(tx,id),true);
   assert.equal(await isActivePriceApprover(tx,"unlisted"),false);
  }
  for(const record of [null,{role:"TALENT",status:"APPROVED"},{role:"ADMIN",status:"PENDING"}]){
   const tx={user:{findUnique:async()=>record}} as unknown as Parameters<typeof isActivePriceApprover>[0];
   assert.equal(await isActivePriceApprover(tx,"fixture-a"),false);
  }
 } finally {if(prior===undefined)delete process.env.PRICE_APPROVER_USER_IDS;else process.env.PRICE_APPROVER_USER_IDS=prior;}
});
