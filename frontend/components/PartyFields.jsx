"use client";
import { Field } from "./FormUI";

// Bill To / Ship To fields change shape depending on the invoice type:
//   customer -> Name, Aadhar Number, Mobile, Address, PAN Number
//   dealer   -> Name, Dealer Code, Mobile, Address, GSTIN
// Both variants share the same underlying party object so no data is lost
// if the user switches type after typing something.
export default function PartyFields({ type, party, onChange }) {
  const set = (field) => (e) => onChange(field, e.target.value);

  return (
    <>
      <Field label="Name" value={party.name} onChange={set("name")} />
      {type === "dealer" ? (
        <Field label="Dealer Code" value={party.dealerCode} onChange={set("dealerCode")} placeholder="SAM-DL-009" />
      ) : (
        <Field label="Aadhar Number" value={party.aadhar} onChange={set("aadhar")} placeholder="5636 1428 3141" />
      )}
      <Field label="Mobile" value={party.mobile} onChange={set("mobile")} />
      <Field label="Address" value={party.address} onChange={set("address")} md={8} />
      {type === "dealer" ? (
        <Field label="GSTIN" value={party.gstin} onChange={set("gstin")} md={4} placeholder="09AKAPV2384G1ZW" />
      ) : (
        <Field label="PAN Number" value={party.pan} onChange={set("pan")} md={4} placeholder="AIOPV6198A" />
      )}
    </>
  );
}
