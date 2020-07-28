const chai = require('chai');
const should = require('chai').should();
const expect = require('chai').expect;
const sinon = require('sinon');
const search = require('./../routes/search').search;
const {Datastore} = require('@google-cloud/datastore');
const fetch = require('node-fetch'); // Used to access custom search.

describe('Search', function() {
  // describe('UpdateSearchResults', function() {
  //   let deleteAncientResultsStub;
  //   let retrieveGlobalTrendsStub;
  //   let updateSearchResultsForTopicStub;

  //   beforeEach(() => {
  //     deleteAncientResultsStub = 
  //         sinon.stub(search, 'deleteAncientResults')
  //             .resolves('Not interested in the output');
  //     sleepStub = 
  //         sinon.stub(search, 'sleep')
  //             .resolves('Not interested in the output');
  //     retrieveGlobalTrendsStub = 
  //         sinon.stub(search, 'retrieveGlobalTrends')
  //             .resolves([
  //               {trendTopic: "trend1"},
  //               {trendTopic: "trend2"}
  //             ]);
  //     updateSearchResultsForTopicStub =
  //         sinon.stub(search, 'updateSearchResultsForTopic')
  //             .resolves('Not interested in the output');
  //   })

  //   afterEach(() => {
  //     sinon.restore();
  //   })

  //   it('should update search results for all global trends', async function() {
  //     await search.updateSearchResults();
  //     deleteAncientResultsStub.callCount.should.equal(1);
  //     retrieveGlobalTrendsStub.callCount.should.equal(1);
  //     updateSearchResultsForTopicStub.getCall(0).args[0].should.equal('trend1');
  //     updateSearchResultsForTopicStub.getCall(1).args[0].should.equal('trend2');
  //     updateSearchResultsForTopicStub.callCount.should.equal(2);
  //     sleepStub.callCount.should.equal(2);
  //   });
  // });

  // describe('RetrieveSearchResultFromDatastore', function() {
  //   beforeEach(() => {
  //     sinon.stub(Datastore.prototype, 'runQuery').callsFake(() => {
  //       results = [{
  //         topic: 'testTopic',
  //         timestamp: 0,
  //         dataByCountry: {},
  //       }];
  //       return [results];
  //     });
  //   });

  //   afterEach(() => {
  //     sinon.restore();
  //   });

  //   it('should return latest datastore data', async function() {
  //     const results = await search.retrieveSearchResultFromDatastore('testTopic');

  //     results.topic.should.equal('testTopic');
  //     results.timestamp.should.equal(0);
  //     expect(results.dataByCountry).to.be.empty;
  //   });
  // });


  describe('FormatCountryResults', function() {
    beforeEach(() => {
      sinon.stub(fetch, 'Promise').returns(Promise.resolve(JSON.stringify({score: 10})));
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should return -500 and no results if passed no country data', async function() {
      const results = await search.formatCountryResults({});
      results.score.should.equal(-500);
      expect(results.results).to.be.empty;
    });

    it('should return correctly formatted country results', async function() {
      const results = await search.formatCountryResults(
        {items: 
          [{title: "item1Title",
            snippet: "item1Snippet",
          htmlSnippet:  "item1HtmlSnippet",
        link: "item1Link",},
        {title: "item2Title",
        snippet: "item2Snippet",
      htmlSnippet:  "item2HtmlSnippet",
    link: "item2Link",}]});
      results.score.should.equal(1000);
      console.log(results);
      
      //expect(results.results).to.be.empty;
    });
  });
});