import mkdirp = require('mkdirp');
import { writeFile } from 'fs';
import { Market, MarketsSummary, Prediction, Price, MarketType } from '../src/generated/markets_pb';

const myMS = new MarketsSummary();
myMS.setBlock(2478383);
myMS.setTotalMarkets(573);
myMS.setTotalMarketsCapitalization((() => {
  const p = new Price();
  p.setEth(23*1);
  p.setBtc(23*0.07080270);
  p.setUsd(23*474.76);
  return p;
})())
myMS.setMarketsList([
  (() => {
    const m = new Market();
    m.setId('potato');
    m.setMarketType(MarketType.CATEGORICAL);
    m.setName("Who will be President in 2020?");
    m.setCommentCount(42);
    m.setCategory('Sports');
    m.setPredictionsList([
      (() => {
        const p = new Prediction();
        p.setName("Bernie Gerald Sanders")
        p.setPercent(23.1);
        return p;
      })(),
    ]);
    m.setMarketCapitalization((() => {
      const p = new Price();
      p.setEth(137300);
      p.setBtc(137300 * 0.07080270);
      p.setUsd(137300 * 474.76);
      return p;
    })());
    m.setEndDate((() => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return Math.round(d.getTime() / 1000);
    })());
    return m;
  })(),
  (() => {
    const m = new Market();
    m.setId('klajsdf');
    m.setMarketType(MarketType.CATEGORICAL);
    m.setName("Who will be Chief Justice in 2023?");
    m.setCommentCount(42);
    m.setCategory('Politics');
    m.setPredictionsList([
      (() => {
        const p = new Prediction();
        p.setName("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec lacinia neque vel quam malesuada, bibendum fermentum massa euismod. Nulla massa mauris, elementum eu convallis in, vulputate in ipsum.")
        p.setPercent(54.2);
        return p;
      })(),
    ]);
    m.setMarketCapitalization((() => {
      const p = new Price();
      p.setEth(137300);
      p.setBtc(137300 * 0.07080270);
      p.setUsd(137300 * 474.76);
      return p;
    })());
    m.setEndDate((() => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return Math.round(d.getTime() / 1000);
    })());
    return m;
  })(),
  (() => {
    const m = new Market();
    m.setId('3938');
    m.setMarketType(MarketType.YESNO);
    m.setName("Will Augur have more than 650 markets created a week after launch?");
    m.setCommentCount(638);
    m.setCategory('Cryptocurrency');
    m.setPredictionsList([
      (() => {
        const p = new Prediction();
        p.setName("Yes")
        p.setPercent(84.6);
        return p;
      })(),
    ]);
    m.setMarketCapitalization((() => {
      const p = new Price();
      p.setEth(123);
      p.setBtc(123 * 0.07080270);
      p.setUsd(123 * 474.76);
      return p;
    })());
    m.setEndDate((() => {
      const d = new Date();
      d.setDate(d.getDate() + 4);
      return Math.round(d.getTime() / 1000);
    })());
    return m;
  })(),
  (() => {
    const m = new Market();
    m.setId('scalar-3');
    m.setMarketType(MarketType.SCALAR);
    m.setName("How many markets will have been created in Augur mainnet by Fri Jul 13, 2018? Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec lacinia neque vel quam malesuada, bibendum fermentum massa euismod. Nulla massa mauris, elementum eu convallis in, vulputate in ipsum.");
    m.setCommentCount(37);
    m.setCategory('Cryptocurrency');
    m.setPredictionsList([
      (() => {
        const p = new Prediction();
        p.setName("Markets")
        p.setValue(170);
        return p;
      })(),
    ]);
    m.setMarketCapitalization((() => {
      const p = new Price();
      p.setEth(3);
      p.setBtc(3 * 0.07080270);
      p.setUsd(3 * 474.76);
      return p;
    })());
    m.setEndDate((() => {
      const d = new Date();
      d.setDate(d.getDate() + 5);
      return Math.round(d.getTime() / 1000);
    })());
    return m;
  })(),
  (() => {
    const m = new Market();
    m.setId('scalar-8');
    m.setMarketType(MarketType.SCALAR);
    m.setName("Why did this market end already?");
    m.setCommentCount(37);
    m.setCategory('Cryptocurrency');
    m.setPredictionsList([
      (() => {
        const p = new Prediction();
        p.setName("Ended-early-points Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec lacinia neque vel quam malesuada, bibendum fermentum massa euismod. Nulla massa mauris, elementum eu convallis in, vulputate in ipsum.")
        p.setValue(42);
        return p;
      })(),
    ]);
    m.setMarketCapitalization((() => {
      const p = new Price();
      p.setEth(3);
      p.setBtc(3 * 0.07080270);
      p.setUsd(3 * 474.76);
      return p;
    })());
    m.setEndDate((() => {
      const d = new Date();
      d.setDate(d.getDate() - 5);
      return Math.round(d.getTime() / 1000);
    })());
    return m;
  })(),
]);

const dir = "/tmp/predictions.global";
const path = dir + "/data";

mkdirp(dir, err => {
  if (err) {
    // tslint:disable-next-line
    console.error(err);
  } else {
    writeFile(path, myMS.serializeBinary(), err2 => {
      if (err2) {
        // tslint:disable-next-line
        console.error(err2);
      } else {
        process.stderr.write(`wrote data to ${path}\n`);
        // tslint:disable-next-line
        console.log(path); // emit data file path on stdout for programmatic consumption
      }
    });
  }
});
