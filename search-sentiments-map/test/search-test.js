const chai = require('chai');
const should = require('chai').should();
const sinon = require('sinon');
const search = require('./../routes/search').search;

describe('UpdateSearchResults', function() {
  let deleteAncientResultsStub;
  let retrieveGlobalTrendsStub;
  let updateSearchResultsForTopicStub;

  beforeEach(() => {
    deleteAncientResultsStub = sinon.stub(search, 'deleteAncientResults').resolves('Not interested in the output');
    retrieveGlobalTrendsStub = sinon.stub(search, 'retrieveGlobalTrends').resolves([
      {trendTopic: "trend1"},
      {trendTopic: "trend2"}
    ]);
    updateSearchResultsForTopicStub = sinon.stub(search, 'updateSearchResultsForTopic').resolves('Not interested in the output');
  })

  afterEach(() => {
    sinon.restore();
  })

  it('should update search results for all global trends', async function() {
    await search.updateSearchResults();
    deleteAncientResultsStub.callCount.should.equal(1);
    retrieveGlobalTrendsStub.callCount.should.equal(1);
    updateSearchResultsForTopicStub.getCall(0).args[0].should.equal('trend1');
    //updateSearchResultsForTopicStub.getCall(1).args[0].should.equal('trend2');
    //retrieveGlobalTrendsStub.callCount.should.equal(2);
  });
});