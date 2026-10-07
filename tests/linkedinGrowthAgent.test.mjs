import test from "node:test";
import assert from "node:assert/strict";
import { prepareLinkedInAction, prepareLinkedInQueue } from "../src/lib/agents/linkedinGrowthAgent.ts";
const prospect={id:"p1",name:"Prospect",linkedinUrl:"https://linkedin.com/in/prospect",source:"verified",evidenceState:"VERIFIED",commercialFit:90,referralLeverage:80,accessibility:80,conversationRelevance:90,reason:"shared founder and AI interest"};
const rec={prospectId:"p1",classification:"DIRECT_BUYER",score:88,priority:"HIGH",reason:"shared founder and AI interest",founderAction:"approve"};
test("prepares a high-priority LinkedIn action without sending",()=>{const r=prepareLinkedInAction(prospect,rec);assert.equal(r.priority,"HIGH");assert.equal(r.profileUrl,prospect.linkedinUrl);assert.match(r.founderAction,/does not send externally/);});
test("verification blocks outreach preparation",()=>{const r=prepareLinkedInAction({...prospect,evidenceState:"REQUIRES_VERIFICATION"},{...rec,priority:"VERIFY",score:null});assert.equal(r.priority,"VERIFY");});
test("queue orders founder actions by priority",()=>{const r=prepareLinkedInQueue([{prospect,recommendation:rec},{prospect:{...prospect,id:"p2"},recommendation:{...rec,prospectId:"p2",priority:"MEDIUM",score:70}}]);assert.equal(r[0].prospectId,"p1");});
