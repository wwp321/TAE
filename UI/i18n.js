window.location.__GET__ = null;
window.location.__defineGetter__("GET", function () {
  if (! this.__GET__) {
    var GET = {};
    if (this.search) {
      var search = this.search.substr(1);     // get rid of "?"
      search.split("&").forEach(function (vk) {
        vk = vk.split("=");
        GET[vk[0]] = vk[1];
      });
    }
    this.__GET__ = GET;
  }
  return this.__GET__;
});

// For now just return english text
var i18n = function(text) { return i18n.translations[text] || text; };
i18n.translations = {};
// As there is currently no way of testing if given file exists in Browser UI scope languages list have to be hardcoded for now
i18n._languageList = [
  "af","ar","as","bg","bn","bs",
  "ca","cs","da","de","el","en-GB","en",
  "es-419","es-ES","es-LA","et","fa","fi",
  "fr-CA","fr","gu","he","hi",
  "hr","hu","id","it","ja","kk","kn",
  "ko","lt","lv","mk","ml","mr","nb",
  "nl","or","pa","pl","pt-BR","pt",
  "ro","ru","sk","sl",
  "sr","sv","sw","ta","te","th","tr","uk",
  "vi","zh-CN","zh-TW","zu"
];
i18n._rtlLanguages = [
  'ar', 'arc', 'bcc', 'bqi', 'ckb', 'dv',
  'fa', 'glk', 'he', 'ku', 'mzn', 'pnb',
  'ps', 'sd', 'ug', 'ur', 'yi'
];
i18n.lang = window.location.GET.lang || navigator.language;
console.log("Detected language: " + i18n.lang);
switch (i18n.lang) {
  case "es-US": // Spanish - United States
    i18n.lang = "es-419"; // Spanish - Latin America
    break;

  default:
    if (i18n._languageList.indexOf(i18n.lang) == -1) { i18n.lang = i18n.lang.replace(/-.*/,""); }
    if (i18n._languageList.indexOf(i18n.lang) == -1) { i18n.lang = "en"; }
}
console.log("Using translations for: " + i18n.lang);
i18n.isRTL = i18n._rtlLanguages.indexOf(i18n.lang) != -1;
i18n.convertNumber = function(input) {
  var buffer = '';
  var offset = 0;
  var s = input.toString();
  var c = 0;

  if (this.lang == 'ar') {
    offset = 1632; // Arabic numbers start at this unicode codepoint
  } else if (this.lang == 'fa') {
    offset = 1776; // Persian numbers start at this unicode codepoint
  } else {
    return s;
  }

  for (var i = 0; i < s.length; i++) {
    c = parseInt(s[i]);
    buffer += isNaN(c) ? s[i] : String.fromCharCode(offset + c);
  }
  return buffer;
};
i18n.loadResource = function(name, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "lang/" + name + "/" + i18n.lang + ".html", true);
  xhr.onreadystatechange = function (e) {
    if (xhr.readyState == 4 && xhr.status == 200) {
      callback(xhr);
    }
  };
  xhr.send();
};
i18n.init = function () {
  var elements = document.querySelectorAll("[data-translation]");
  for (var i=0, l=elements.length;i<l; i++) {
    if (elements[i].nodeName == "INPUT") {
      elements[i].setAttribute("placeholder", i18n(elements[i].getAttribute("data-translation")));
    } else {
      elements[i].innerHTML = i18n(elements[i].getAttribute("data-translation"));
    }
  }
  if(i18n.isRTL) {
    document.querySelector("#navigation").insertBefore(document.querySelector("#forward"), document.querySelector("#back"));
  }
  i18n.loadResource("about", function (xhr) {
    document.querySelector("#about-popup .scrollable-content").innerHTML = xhr.response;
  });
  i18n.loadResource("help", function (xhr) {
    document.querySelector("#opera-help-popup .scrollable-content").innerHTML = xhr.response;
  });
};

// injecting localisation resources as fast as we can (we need lang and rtl)
(function () {
  if(i18n.isRTL) {
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "main-rtl.css";
    document.head.appendChild(link);
  }
  var script = document.createElement("script");
  script.src = "lang/" + i18n.lang + ".lang";
  document.head.appendChild(script);
})();