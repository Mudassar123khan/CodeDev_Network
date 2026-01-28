import puppeteer from "puppeteer";

const fetchCodechefStats = async (handle)=>{
    console.log("Chrome path:", puppeteer.executablePath());
    const browser = await puppeteer.launch({
        headless:true,
        executablePath: puppeteer.executablePath(),
        args: [
     "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--disable-software-rasterizer",
    "--no-zygote",
    "--single-process"
  ]});
    try{
        
        const page =await browser.newPage();
        
        await page.goto(`https://www.codechef.com/users/${handle}`, { waitUntil: "networkidle2" });

        await page.waitForSelector(".rating-data-section");

        const getUserDetails =await page.evaluate(()=>{
            const allH3s = document.querySelectorAll(".rating-data-section.problems-solved h3");
            const rat = document.querySelector(".rating-number");
            const arr = [];
            allH3s.forEach(el=>{
                arr.push(el.innerHTML);
            });
            const problems = arr[3].split(" ")[3];
            return {
                problems:parseInt(problems),
                rating:parseInt(rat.innerText)
            }
        });

        const user = getUserDetails;
        return {
            handle,
            lastSynced:new Date(),
            solvedCount:user.problems,
            rating:user.rating
        }        
    }catch(err){
        console.log(`An error occured ${err.message}`);
        return null;
    }finally{
        await browser.close();
    }
}

export default fetchCodechefStats;