**To Add To Desktop Chrome Tab**

Open myflyclub, copy run.js, open inspect/developer tools and paste the contents of run.js into the console, A button should then appear to toggle the ui on or off.

**To Add To Mobile Chrome Tab**

Make a new bookmark and name it anything you like but enter this as the URL:


javascript:(function(){fetch('https://raw.githubusercontent.com/raid2256/advancedmyflyclub-flight-search/main/flights-suite.user.js?t='+Date.now()).then(r=>r.text()).then(c=>eval(c)).catch(e=>alert(e));})();


When you click it the button to toggle the ui on and off should then appear.
