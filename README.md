**To Add To Desktop Chrome Tab**

Open myflyclub, copy run.js, open inspect/developer tools and paste the contents of run.js into the console, A button should then appear to toggle the ui on or off.

**To Add To Mobile Chrome Tab**

Make a new bookmark and name it anything you like but enter this as the URL:
javascript:(function()%7B%3Ca%20href%3D%22javascript%3A(function()%257Bjavascript%253A(function()%257Bfetch('https%253A%252F%252Fraw.githubusercontent.com%252Fraid2256%252Fadvancedmyflyclub-flight-search%252Fmain%252Fflights-suite.user.js%253Ft%253D'%252BDate.now()).then(r%253D%253Er.text()).then(c%253D%253Eeval(c)).catch(e%253D%253Ealert(e))%253B%257D)()%253B%257D)()%253B%22%3Ebookmarklet%3C%2Fa%3E%7D)()%3B

When you click it the button to toggle the ui on and off should then appear.
