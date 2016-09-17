var xhr = new XMLHttpRequest();
var xhrPrototype = XMLHttpRequest.prototype;

var handler = function() {
  if (this.readyState != this.DONE) return;
  if ((this.status === 200 || this.status === 0) && this.response) { // Android & Firefox reporting 0 for local & blob urls
    parseEbook(this.response);
  }
};

if (!('overrideMimeType' in xhrPrototype)) {
  // IE10 might have response, but not overrideMimeType
  Object.defineProperty(xhrPrototype, 'overrideMimeType', {
    value: function xmlHttpRequestOverrideMimeType(mimeType) {}
  });
}

xhr.onreadystatechange = handler;
xhr.open("GET", "/books/mere-christianity.epub", true);
xhr.responseType = "arraybuffer";
xhr.send();

function parseEbook(response) {
  var files = new JSZip(response).files;
  addContentToDOM(extractText(sanitizeMarkup(concatMarkup(files))), "#target");
}

function concatMarkup(files) {
  var wrapper = $("<div></div>"),
    keys = Object.keys(files).sort(sortFileNames);
  _.chain(keys).filter(function (key) {
    return key.indexOf(".html") > -1 || key.indexOf(".xhtml") > -1;
  }).each(function (key) {
    wrapper.append(files[key].asText());
  }).value();

  return wrapper;
}

function sanitizeMarkup(markup) {
  markup.find("title").remove();
  markup.find("meta").remove();
  markup.find("img").remove();
  markup.find("link[rel='stylesheet']").remove();
  return markup;
}

function extractText(markup) {
  var goodText = markup.find("p, h1, h2, h3, h4, h5, h6");
  goodText.removeClass();
  return goodText;
}

function addContentToDOM(markup, selector) {
  $(selector).append(markup);
}

function sortFileNames(wOne, wTwo) {
  wOne = wOne.toLowerCase();
  wTwo = wTwo.toLowerCase();

  var i = 0,
    alphabet = "abcdefghijklmnopqrstuvwxyz-_/.,:0123456789",
    numbers = "0123456789",
    wOneIndex = alphabet.indexOf(wOne[i]),
    wTwoIndex = alphabet.indexOf(wTwo[i]);

  if (wOneIndex && !wTwoIndex) {return -1;}
  if (wTwoIndex && !wOneIndex) {return 1;}
  if (!wTwoIndex && !wOneIndex) {return 0;}

  while (wOneIndex != null && wTwoIndex != null && wOneIndex === wTwoIndex) {
    i++;
    wOneIndex = alphabet.indexOf(wOne[i]);
    wTwoIndex = alphabet.indexOf(wTwo[i]);
  }

  if (wOneIndex && !wTwoIndex) {return -1;}
  if (wTwoIndex && !wOneIndex) {return 1;}
  if (!wTwoIndex && !wOneIndex) {return 0;}

  // adjust for poorly formatted numbers
  // eg, "part2" should come before "part10"
  if (numbers.indexOf(wTwo[i]) > -1 && numbers.indexOf(wOne[i]) > -1) {
    if (numbers.indexOf(wOne[i + 1]) > -1 && numbers.indexOf(wTwo[i + 1]) < 0) {
      return 1;
    } else if (numbers.indexOf(wOne[i + 1]) < 0 && numbers.indexOf(wTwo[i + 1]) > -1) {
      return -1;
    }
  }

  if (wOneIndex < wTwoIndex) {return -1;}
  if (wOneIndex > wTwoIndex) {return 1;}
  if (wOneIndex === wTwoIndex) {return 1;}

  return 0;
}
