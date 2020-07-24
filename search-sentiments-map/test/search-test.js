const chai = require('chai');
const should = require('chai').should();
const sinon = require('sinon');
const search = require('./../routes/search').search;
const router = require('./../routes/search').router;

describe('Search', function() {
  describe('UpdateSearchResults', function() {
    let deleteAncientResultsStub;
    let retrieveGlobalTrendsStub;
    let updateSearchResultsForTopicStub;

    beforeEach(() => {
      deleteAncientResultsStub = sinon.stub(search, 'deleteAncientResults').resolves('Not interested in the output');
      sleepForOneMinuteStub = sinon.stub(search, 'sleepForOneMinute').resolves('Not interested in the output');
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
      updateSearchResultsForTopicStub.getCall(1).args[0].should.equal('trend2');
      updateSearchResultsForTopicStub.callCount.should.equal(2);
      sleepForOneMinuteStub.callCount.should.equal(2);
    });
  });

  describe('RouterGetResults', function() {
    let retrieveSearchResultFromDatastoreStub;

    beforeEach(() => {
      retrieveSearchResultFromDatastoreStub = sinon.stub(search, 'retrieveSearchResultFromDatastore').resolves({
        {trendTopic: "trend1"},
        {trendTopic: "trend2"},
      });
    })

    afterEach(() => {
      sinon.restore();
    })

    it('should return latest data', async function() {
      retrieveSearchResultFromDatastoreStub.callCount.should.equal(1);
      let req,res,spy;

      req = res = {};
      spy = res.send = sinon.spy();

      await router.get('/testTopic');
      expect(spy.calledOnce).to.equal(true);
    });     
    });
  });
});