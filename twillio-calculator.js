(function () {
  var TWILIO_PRICE_API_URL = 'https://pricing.twilio.com/v1/Messaging/Countries/',
    TWILIO_LOOKUP_API_URL = 'https://lookups.twilio.com/v1/PhoneNumbers/',
    ACCOUNT_SID = 'AC54ce4017dd25da36960f6b993d3f1813',
    AUTH_TOKEN = '13dddb254d5c50890a45f8e2d132f167',

    generatePriceLink = function (countryCode) {
      return TWILIO_PRICE_API_URL + countryCode;
    },

    generateLookupLink = function(number) {
      return TWILIO_LOOKUP_API_URL + number + '?Type=carrier';
    };


  window.TwilioCalculator = function TwilioCalculator() {};

  TwilioCalculator.calculatePriceSMS = function(fromNumber, toNumber, cb, errCb) {
    getPhonesData(fromNumber, toNumber, function (phoneNumbers) {
      var countryCode = phoneNumbers[0].country_code,
        mcc = Number(phoneNumbers[0].carrier.mobile_country_code).toString(),
        mnc = Number(phoneNumbers[0].carrier.mobile_network_code).toString(),
        type = phoneNumbers[1].carrier.type;

      Ajax.get(generatePriceLink(countryCode), function (country) {
        try {
          var currentPrice = country.outbound_sms_prices.filter(function (tariff) {
            return tariff.mcc === mcc && tariff.mnc === mnc;
          })[0].prices.filter(function (tariff) {
            return tariff.number_type = type;
          })[0].current_price;
        } catch (ex) {
          errCb()
        }

        cb(currentPrice);
      }, errCb);
    }, errCb);
  };

  function getPhonesData(first, second, cb, errCb) {
    var counter = 2,
      phoneNumbers = [],
      listener = function (number) {
        counter -= 1;
        phoneNumbers.push(number);
        runCb();
      },

      runCb = function () {
        if (!counter) {
          cb(phoneNumbers);
        }
      };

    Ajax.get(generateLookupLink(first), listener, errCb);
    Ajax.get(generateLookupLink(second), listener, errCb);
  }

  window.TwilioCalculatorForm = function TwilioCalculatorForm(form) {
    var firstNumberEl = form.querySelector('.twilio-calculator-first-number'),
      secondNumberEl = form.querySelector('.twilio-calculator-second-number'),
      resultInput = form.querySelector('.twilio-calculator-result');

    form.addEventListener('submit', function(e) {
      e.preventDefault();

      resultInput.value = 'Loading...';
      TwilioCalculator.calculatePriceSMS(
        normilizePhoneNumber(firstNumberEl.value),
        normilizePhoneNumber(secondNumberEl.value),
        function (price) {
          resultInput.value = price + ' USD';
        },
        function () {
          resultInput.value = 'Something went wrong :(';
        }
      )
    });
  };

  var Ajax = {
    get: function (url, cb, errCb) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url);
      xhr.setRequestHeader('Authorization', 'Basic ' + btoa(ACCOUNT_SID + ':' + AUTH_TOKEN) );
      xhr.onload = function() {
        if (xhr.status === 200) {
          cb(JSON.parse(xhr.responseText));
        } else {
          errCb();
        }
      };
      xhr.send();
    }
  };

  function normilizePhoneNumber(number) {
    return number.replace(/[^0-9]/g, '');
  }


  TwilioCalculatorForm(document.querySelector('.twilio-calculator-form'));
})();
