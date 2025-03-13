import puppeteer from 'puppeteer';
import lighthouse from 'lighthouse';
import fs from 'fs';

const iterations = 10;
const url = 'https://example.com';
const reportFilename = 'report.csv';

async function runLighthouse(url) {

  // Uncomment the args section to enable any custom extensions you need to load into Chrome
  const browser = await puppeteer.launch({
    headless: true, // Set to false for a visible browser
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    // args: [
    //   '--load-extension=c:\\myBrowserExtension',
    //   '--disable-extensions-except=c:\\myBrowserExtension'
    // ]
  });

  const wsEndpoint = browser.wsEndpoint();

  const { lhr } = await lighthouse(url, {
    port: (new URL(wsEndpoint)).port,
    output: 'html',
    logLevel: 'silent',
    emulatedFormFactor: 'mobile',
    throttlingMethod: 'provided',
    throttling: {
      cpuSlowdownMultiplier: 4,
      rttMs: 150,
      throughputKbps: 1600,
    },
    disableDeviceEmulation: false,
    networkConditions: {
      offline: false,
      downloadThroughputKbps: 1500,
      uploadThroughputKbps: 1500,
      latencyMs: 400,
    },
    disableNetworkCache: true,
    chromeFlags: [ ]
  });

  const scores = {
    performance: lhr.categories.performance.score,
    accessibility: lhr.categories.accessibility.score,
    best_prac: lhr.categories['best-practices'].score,
    seo: lhr.categories.seo.score,
    fcp: roundScore(lhr.audits['first-contentful-paint'].numericValue, 2),
    lcp: roundScore(lhr.audits['largest-contentful-paint'].numericValue, 2),
    speed_index: roundScore(lhr.audits['speed-index'].numericValue, 2),
    blocking: roundScore(lhr.audits['total-blocking-time'].numericValue, 2),
    cls: lhr.audits['cumulative-layout-shift'].numericValue,
    interactive: roundScore(lhr.audits.interactive.numericValue, 2)
  }

  console.log(scores);
  
  await browser.close();

  return scores;
}

function addScores(scores, previousScores) {
  const result = {};
  for (const key in scores) {
    result[key] = scores[key] + previousScores[key];
  }
  return result;
}

function recordMinScore(scores, minScores) {
  const result = {};
  for (const key in scores) {
    result[key] = Math.min(scores[key], minScores[key]);
  }
  return result;
}

function recordMaxScore(scores, maxScores) {
  const result = {};
  for (const key in scores) {
    result[key] = Math.max(scores[key], maxScores[key]);
  }
  return result;
}

function averageScores(scores, totalCount) {
  const result = {};
  for (const key in scores) {
    const decimalPlaces = key === 'cls' ? 6 : 2; // Round everything to DP=2 except CLS
    result[key] = roundScore(scores[key] / totalCount, decimalPlaces);
  }
  return result;
}

function roundScore(score, dp) {
  return parseFloat(Number(score).toFixed(dp));
}

var scoresTotal = {
  performance: 0,
  accessibility: 0,
  best_prac: 0,
  seo: 0,
  fcp: 0,
  lcp: 0,
  speed_index: 0,
  blocking: 0,
  cls: 0,
  interactive: 0
};

var minScores = scoresTotal;
var maxScores = scoresTotal;

const parameter = process.argv[2] || 'no name provided';
fs.appendFileSync(reportFilename, `New run - ${parameter}\n`);
fs.appendFileSync(reportFilename, 'Performance,Accessibility,Best Practices,SEO,FCP,LCP,Speed Index,Blocking,CLS,Interactive\n');

for (let i = 0; i < iterations; i++) {
  console.log(`Running iteration ${i + 1} ...`);
  var scores = await runLighthouse(url, reportFilename);
  scoresTotal = addScores(scores, scoresTotal);
  
  if(i==0) {
    minScores = scores;
    maxScores = scores;
  } else {
    minScores = recordMinScore(scores, minScores);
    maxScores = recordMaxScore(scores, maxScores);
  }
  
  const tableRow = `${scores.performance},${scores.accessibility},${scores.best_prac},${scores.seo},${scores.fcp},${scores.lcp},${scores.speed_index},${scores.blocking},${scores.cls},${scores.interactive}\n`;
  fs.appendFileSync(reportFilename, tableRow);
}

const average = averageScores(scoresTotal, iterations);
const averageRow = `${average.performance},${average.accessibility},${average.best_prac},${average.seo},${average.fcp},${average.lcp},${average.speed_index},${average.blocking},${average.cls},${average.interactive},AVG\n`;
fs.appendFileSync(reportFilename, averageRow);

const minRow = `${minScores.performance},${minScores.accessibility},${minScores.best_prac},${minScores.seo},${minScores.fcp},${minScores.lcp},${minScores.speed_index},${minScores.blocking},${minScores.cls},${minScores.interactive},MIN\n`;
fs.appendFileSync(reportFilename, minRow);

const maxRow = `${maxScores.performance},${maxScores.accessibility},${maxScores.best_prac},${maxScores.seo},${maxScores.fcp},${maxScores.lcp},${maxScores.speed_index},${maxScores.blocking},${maxScores.cls},${maxScores.interactive},MAX\n`;
fs.appendFileSync(reportFilename, maxRow);

console.log('============================================');
console.log('====          COMPLETED RUN          =======');
console.log('============================================');
