const chai = require('chai');
const should = require('chai').should();
const expect = require('chai').expect;
const sinon = require('sinon');
const search = require('./../routes/search').search;
const {Datastore} = require('@google-cloud/datastore');

describe('Search', function() {
  describe('UpdateSearchResults', function() {
    let deleteAncientResultsStub;
    let retrieveGlobalTrendsStub;
    let updateSearchResultsForTopicStub;

    beforeEach(() => {
      deleteAncientResultsStub = 
          sinon.stub(search, 'deleteAncientResults')
              .resolves('Not interested in the output');
      sleepStub = 
          sinon.stub(search, 'sleep')
              .resolves('Not interested in the output');
      retrieveGlobalTrendsStub = 
          sinon.stub(search, 'retrieveGlobalTrends')
              .resolves([
                {trendTopic: 'trend1'},
                {trendTopic: 'trend2'},
              ]);
      getSearchResultsForCountriesForTopicStub =
          sinon.stub(search, 'getSearchResultsForCountriesForTopic')
              .resolves('Not interested in the output');
      addWorldDataByTopicToDatastoreStub =
          sinon.stub(search, 'addWorldDataByTopicToDatastore')
              .resolves('Not interested in the output');
    })

    afterEach(() => {
      sinon.restore();
    })

    it('should update search results for all global trends', async function() {
      await search.updateSearchResults();
      deleteAncientResultsStub.callCount.should.equal(1);
      retrieveGlobalTrendsStub.callCount.should.equal(1);
      getSearchResultsForCountriesForTopicStub.getCall(0).args[1].should.equal('trend1');
      getSearchResultsForCountriesForTopicStub.getCall(1).args[1].should.equal('trend2');
      getSearchResultsForCountriesForTopicStub.callCount.should.equal(2);
      sleepStub.callCount.should.equal(2);
    });
  });

  describe('RetrieveSearchResultFromDatastore', function() {
    beforeEach(() => {
      sinon.stub(Datastore.prototype, 'runQuery').callsFake(() => {
        results = [{
          topic: 'testTopic',
          timestamp: 0,
          dataByCountry: {},
        }];
        return [results];
      });
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should return latest datastore data', async function() {
      const results = await search.retrieveSearchResultFromDatastore('testTopic');

      results.topic.should.equal('testTopic');
      results.timestamp.should.equal(0);
      expect(results.dataByCountry).to.be.empty;
    });
  });
});