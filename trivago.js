// TRIVAGO AUTOMATION

let puppeteer = require("puppeteer");
let credentialsFile = process.argv[2];
let location = process.argv[3];
let fs = require("fs");
let selected_type = process.argv[4];
(async function() {
    try {
        let data = await fs.promises.readFile(credentialsFile);
        let {
            url,
            pwd,
            email
        } = JSON.parse(data);
        
        let browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ["--start-maximized", "--disable-notifications"],
        });
        //creating tab
        let numberofPages = await browser.pages();
        let tab = numberofPages[0];

        await tab.goto(url, {
            waitUntil: "networkidle0",
        });
        //input email
        await tab.waitForSelector("input[type=email]");
        await tab.type("input[type=email]", email, { delay: 120 });

        //submit
        await tab.waitForSelector("button[type=submit]");
        await tab.click("button[type=submit]");
    
        //input password
        await tab.waitForSelector("input[type=password]");
        await tab.type("input[type=password]", pwd, { delay: 120 });

        //submit
        await tab.waitForSelector("#login_submit");
        await tab.click("#login_submit");
        
        //site
        await tab.waitFor(2000);
        await tab.goto("https://www.trivago.co.uk/", {
            waitUntil: "networkidle0"
        });
        await tab.waitForSelector("#querytext", {
            visible: true
        })
        //Enter location
        await tab.type("#querytext", location, {
            delay: 120
        });
        //await tab.waitFor(1000);
        await tab.keyboard.press("Enter");
        await tab.waitFor(1000);

        //
        await tab.waitForSelector("button.dealform-button.dealform-button--guests.js-dealform-button-guests");
        await tab.click("button.dealform-button.dealform-button--guests.js-dealform-button-guests");
        //await tab.waitForNavigation({ waitUntil: "networkidle2" });
        
        await tab.waitForSelector(".roomtype-btn__wrap");
        let click_prop = await tab.$$(".roomtype-btn__wrap");
        for(let i=0; i<4; i++){
            let type1 = await (await click_prop[i].getProperty("innerText")).jsonValue();
            if(selected_type == type1){
                await click_prop[i].click();
                break;
            }
        }
        await tab.waitFor(4000);

        // search Hotels
        await Promise.all([tab.click(".btn.btn--primary.btn--regular.search-button.js-search-button"),
            tab.waitForNavigation({
                waitUntil: "networkidle2"
            })
        ])
        
        let hotelsData = await tab.evaluate(() => {
            //hotels array
            let hotels = [];
            let allHotels = document.querySelectorAll(".hotel-item.item-order__list-item.js_co_item");
            allHotels.forEach((hotelelement) => {

                try {
                    let hotelJson = {
                        HotelRating: hotelelement.querySelector("span[itemprop=ratingValue]").innerText,
                        HotelPrice: hotelelement.querySelector("Strong[data-qa=recommended-price]").innerText,
                        HotelName: hotelelement.querySelector("span.item-link.name__copytext").innerText,
                        HotelLocation: hotelelement.querySelector(".details-paragraph.details-paragraph--location.location-details").innerText,
                        WhereToBookFrom: hotelelement.querySelector("span[data-qa=recommended-price-partner]").innerText,
                        
                    }
                    hotels.push(hotelJson);
                } catch (error) {
                    console.log(error);
                }

            });
            return hotels
        });
        
        console.table(hotelsData);
        fs.writeFileSync("hotel.html", hotelsData);
        await tab.setViewport({
            width: 1200,
            height: 800
        });
        await tab.waitFor(2000);
        await autoScroll(tab);
        await tab.waitFor(1000);
        
        //take screenshot
        await tab.screenshot({
            path: './details.png',
            fullPage: true
        });
        await tab.waitFor(1000);

        await tab.close();
    } catch (err) {
        console.log(err);
    }


})();

//autoscroll function
async function autoScroll(tab) {
    await tab.evaluate(async () => {
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
}