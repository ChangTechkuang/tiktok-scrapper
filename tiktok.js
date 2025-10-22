const puppeteer = require("puppeteer");
const fs = require('fs');
const https = require('https');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

main();
async function main() {
  //pptr.use(stealthPlugin())
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  await page.evaluateOnNewDocument(() => {
    delete navigator.__proto__.webdriver;
  });
  //We stop images and stylesheet to save data
  await page.setRequestInterception(true);

  page.on('request', (request) => {
    if (['image', 'stylesheet', 'font'].includes(request.resourceType())) {
      request.abort();
    } else {
      request.continue();
    }
  })

  const args = process.argv.slice(2)
  const userLink = (args[0])
  if (userLink.includes("@")) {
    console.log("Getting links from " + userLink)
  } else {
    console.log("Syntax error: \n\r use it like that: node bulktok https://www.tiktok.com/@profile")
    process.exit()
  }
  var nVideos = parseInt(args[1])

  await page.goto(userLink); //change this to user url page
  let username = page.url().slice(23, ).replace(/[-:.\/*<>|?]/g, "");

  //scroll down until no more videos
  await autoScroll(page);

  const urls = await page.evaluate(() =>
    Array.from(document.querySelectorAll('div.tiktok-1qb12g8-DivThreeColumnContainer > div > div > div.tiktok-16ou6xi-DivTagCardDesc > a'), element => element.href));

  var videoDes = await page.evaluate(() => Array.from(document.querySelectorAll('div.tiktok-1qb12g8-DivThreeColumnContainer.eegew6e2 > div > div > div > a')).map((items) => items.innerText))

  if (urls.length == 0) {
    console.log('Retry Again');
    browser.close;
  }

  for (var i = videoDes.length; i--;) {
    videoDes[i] = videoDes[i].replace('\n', '').replace('|', '');
  }; //append #shorts for each video title

  fs.appendFile('hashtags.txt', videoDes + '', function (err) {
    if (err) throw err;
    console.log('Hashtages Saved!');
  });

  console.log('now it downloading ' + urls.length + ' video')

  //becareful that can be alot of gigas if profile has a lot of videos
  for (var i = 0; i < urls.length; i++) //you can limit number of videos by replace url.length by number
  {
    function getRandomNumber() {
      var random = Math.floor(Math.random() * (500 - 300 + 1)) + 300;
      return random;
    };
    function getHighNumber() {
      var random = Math.floor(Math.random() * (500 - 300 + 1)) + 1150;
      return random;
    };
    //await page.waitForTimeout(getHighNumber());
    await page.goto('https://snaptik.app/');
    //await page.waitForTimeout(getRandomNumber());

    await page.waitForSelector('input[name="url"]');
    await page.type('input[name="url"]', (urls[i]), { delay: 50 }); //type result of links
    let link = StrGrab(urls[i], '/video/', '');

    if (!link) {
      console.log('ERROR_SITE_INVALID');
      browser.close;
    }

    await page.waitForTimeout(getRandomNumber());

    await page.click('.button-go');
    await page.waitForTimeout(getHighNumber());

    await page.waitForXPath('//*[@id="download"]/div/div[2]/a[1]');
    const featureArticle = (await page.$x('//*[@id="download"]/div/div[2]/a[1]'))[0];

    const text = await page.evaluate(el => {
      // do what you want with featureArticle in page.evaluate
      return el.href;
    }, featureArticle);
    var noWaterMark = text
    const content = decodeURIComponent(noWaterMark);

    // link to file you want to download
    const pathInput = './DownloadVideo/VideoInput/'; // location to save videos
    const pathOutput = './DownloadVideo/VideoOutput/' // location to output edit videos
    try {
      if (!fs.existsSync(pathInput)) {
        fs.mkdirSync(pathInput);
      } else if (!fs.existsSync(pathOutput)) {
        fs.mkdirSync(pathOutput);
      }
    } catch (err) {
      console.error(err)
    }

    const request = https.get(content, function (response) {
      if (response.statusCode === 200) {
        sleep(500);
        var file = fs.createWriteStream(pathInput + link + '.mp4');
        response.pipe(file);
        console.log(file.path + ' Saved!')

        // Equalizer settings for a colorful effect
        const eqSettings = 'saturation=1.5:gamma=1.2';

        // Upscale video resolution to 1080x1920 (Vertical Full HD)
        const targetWidth = 1080;
        const targetHeight = 1920;

        // After Video (Modified)
        command = ffmpeg(file.path)
          .videoFilter(`hflip, eq=${eqSettings}`) // Apply horizontal flip
          .noAudio() // Disable audio in the output
          .output(pathOutput + link + '.mp4');
        
        // Execute the command and handle the result
        command.on('error', (err) => {
          console.error('An error occurred:', err.message);
        })
        .on('end', () => {
          console.log('Video processing complete!');
        })
        .run();

        fs.appendFile('names.txt', file.path + "\r\n", function (err) {
          if (err) throw err;
          console.log('names Saved!');
        });
      }

      request.setTimeout(60000, function() { // if after 60s file not downlaoded, we abort a request 
          request.destroy();
          console.log("Can't download video "+urls[i]);
      });
    });
    ;
  };

  console.log('File Download Competed!');
  browser.close;
};

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      var totalHeight = 0;
      var distance = 100;
      var timer = setInterval(() => {
        var scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
};

function StrGrab(str, prefix, surfix, aIndex)
{
    if(str == "") return "";

    var count;

    if(aIndex == undefined) count = 1;
    else count = aIndex;

    var start, end, idx;

    idx = 0;

    for(var i = 0;i < count;i++){
        if(prefix == ""){
            start = 0;
        }else{
            start = str.indexOf(prefix, idx);
            //찾았으면...
            if(start >= 0)
                start += prefix.length;
            else return "";
        }
        //right trim
        //str = str.substr(start);
        idx=start;

        if(start == 0) break;
    }

    if(surfix == ""){
        return str.substr(idx);
    }else{
        end = str.indexOf(surfix,idx);
        //찾았으면..
        if(end >= 0){
            return str.substr(idx, end-idx);
        }else return "";
    }
};

function sleep (milliseconds) {
  var start = new Date().getTime();
  while (true) {
      if ((new Date().getTime() - start) > milliseconds) {
          break;
      }
  }
};