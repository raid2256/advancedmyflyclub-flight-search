fetch('https://raw.githubusercontent.com/raid2256/advancedmyflyclub-flight-search/main/flights-suite.user.js')
  .then(response => response.text())
  .then(code => eval(code))
  .catch(err => console.error('Failed to inject suite loader:', err));
