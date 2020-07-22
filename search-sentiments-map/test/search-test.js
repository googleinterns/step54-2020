const chai = require("chai");
const sinon = require("sinon");
const expect = chai.expect;
const faker = require("faker");
const search = require("./../routes/search.js");

describe("RetrieveGlobalTrends", function() {
  it("return most recent global trends", async function() {
    expect(search.retrieveGlobalTrends()).to.be.an('array');
  });
});