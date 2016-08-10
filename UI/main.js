/* Copyright (C) 2015 Opera Software AS.  All rights reserved.
 *
 * This file is part of the Opera Devices SDK.
 * It includes Opera proprietary information and distribution is prohibited
 * without Opera Software's prior, explicit and written consent.
 */

// FOR DEBUG ON DESKTOP
if (window.location.origin != "chrome://browserui") {
  NON_INTEGRATED = true;
}

var SETTINGS = {
  THUMBNAIL_WIDTH: 220,
  THUMBNAIL_HEIGHT: 124,
  PRESSED_STATE_DURATION: 500,
  SHOW_THUMBNAILS_IN_BOOKMARKS: true,
  SHOW_THUMBNAILS_IN_TABS: true,
  SHOW_THUMBNAILS_IN_SPEED_DIAL:true,
  NOTIFICATION_DISPLAY_DURATION_NORMAL: 3000,
  NOTIFICATION_DISPLAY_DURATION_EXTENDED: 23000,
  NOTIFICATION_DISPLAY_DURATION: this.NOTIFICATION_DISPLAY_DURATION_NORMAL,
  GUI_TEXT_SCROLL_FACTOR_NORMAL: 3,
  GUI_TEXT_SCROLL_FACTOR_SLOW: 6,
  GUI_TEXT_SCROLL_FACTOR: this.GUI_TEXT_SCROLL_FACTOR_NORMAL / 100
};

window.VK_LEFT = window.VK_LEFT || 37;
window.VK_RIGHT = window.VK_RIGHT || 39;
window.VK_UP = window.VK_UP || 38;
window.VK_DOWN = window.VK_DOWN || 40;
window.VK_ENTER = window.VK_ENTER || 13;
window.VK_BACK = window.VK_BACK || 46;
window.VK_TAB = window.VK_TAB || 9;
window.NON_INTEGRATED = window.NON_INTEGRATED || false;
window.VK_ESCAPE = window.VK_ESCAPE || 27;



/**
 * Singleton History controler
 */
var History = function () {
  this.init();
};
History.prototype = {
  init: function () {
    this.entries = [];
    this.current = 0;
  },
  add: function (url) {
    this.entries.splice(this.current+1, this.entries.length); //cut out the rest
    this.entries.push(url);
    this.current++;
  },
  back: function () {
    if (this.current>0) { this.current--; }
    return this.entries[this.current];
  },
  forward: function () {
    return this.entries[++this.current];
  },
  getCurrentEntry: function () {
    return this.entries[this.current];
  },
  getCurrent: function () {
    return this.current;
  },
  setCurrent: function (val) {
    this.current = val;
  },
  setCurrentEntry: function (val) {
    this.entries[this.current] = val;
  },
  getLength: function () {
    return this.entries.length;
  },
  setLength: function (val) {
    this.entries.length = val;
  },
  getEntry: function (id) {
    return this.entries[id];
  }
};

/**
 * Singleton main view
 **/

var Application = {
  init: function () {
    this.setupOptionsPopupEvents();
    this.setupZoomPopupEvents();
    this.setupTextSizePopupEvents();
    this.setupSettingsPopupEvents();
    this.setupHelpPopupEvents();
    this.setupAddToBookmarkPopupEvents();
    this.setupAddToSpeedDialPopupEvents();
    this.setupExitPopupEvents();
    this.setupClearHistoryPopupEvents();
    this.setupManageSpeedDialPopupEvents();
    this.setupEditSpeedDialPopupEvents();
    this.setupDeleteSpeedDialPopupEvents();
    this.setupManageBookmarkPopupEvents();
    this.setupDeleteBookmarkPopupEvents();
    this.setupClosePrivateTabPopupEvents();
    this.setupConfirmDialogEvents();
    this.setupAlertDialogEvents();
    this.setupPromptDialogEvents();
    this.setupAuthenticationDialogEvents();
    NativeApi.getSettings(function (settings) {
      LOG("getSettings", settings);

      SETTINGS.CUSTOM_ERROR_PAGES = settings[0]["custom_error_pages"];

      SETTINGS.SHOW_THUMBNAILS_IN_TABS = settings[0]["show_thumbnails_in_tabs"];
      SETTINGS.SHOW_THUMBNAILS_IN_BOOKMARKS = settings[0]["show_thumbnails_in_bookmarks"];
      SETTINGS.SHOW_THUMBNAILS_IN_SPEED_DIAL = settings[0]["show_thumbnails_in_speeddials"];
      SETTINGS.SELECT_TEXT = settings[0]["text_select_supported"];
      SETTINGS.LONGPRESS_ENABLED = settings[0]["longpress_enabled"];
      SETTINGS.LONGPRESS_ACCELERATION_SPEED = settings[0]["longpress_acceleration_speed"];
      SETTINGS.PLATFORM = settings[0]["platform"];
      SETTINGS.VIRTUAL_MOUSE_SCROLL_WHEN_LESS_THAN_WHILE_LOADING = settings[0]["scroll_margin_while_loading"] || 100;
      SETTINGS.VIRTUAL_MOUSE_SINGLE_MOVE_STEP_DISTANCE = settings[0]["mouse_step"];
      SETTINGS.VIRTUAL_MOUSE_SCROLL_DISTANCE = settings[0]["scroll_step"];

      SETTINGS.SPEEDDIAL_TITLE_LIMIT = parseInt(settings[0]["speeddial_title_limit"], 10) || -1;
      SETTINGS.SPEEDDIAL_URL_LIMIT = parseInt(settings[0]["speeddial_url_limit"], 10) || -1;
      SETTINGS.BOOKMARK_TITLE_LIMIT = parseInt(settings[0]["bookmark_title_limit"], 10) || -1;
      SETTINGS.BOOKMARK_URL_LIMIT = parseInt(settings[0]["bookmark_url_limit"], 10) || -1;
      SETTINGS.ACCESSIBILITY_MODE = !!settings[0]["accessibility_mode"];
      SETTINGS.ACCESSIBILITY_MENU_HIDDEN = false; //SETTINGS.ACCESSIBILITY_MODE;
      SETTINGS.GUI_TEXT_SIZE = parseFloat(settings[0]["gui_text_size"]) || 1;
      SETTINGS.GUI_STICKY_MENU = !!settings[0]['gui_sticky_menu'];

      var key_mapping = settings[0]["keys"];
      if (key_mapping) {
        for (var key_name in key_mapping) {
          window[key_name] = window[key_name] || key_mapping[key_name];
        }
      }
      if (/android/i.test(SETTINGS.PLATFORM)) {
        Application.disableFeaturesInAndroid();
      }
      if (SETTINGS.ACCESSIBILITY_MENU_HIDDEN) {
        document.getElementById("button-accessibility").remove();
      }
      Application.setTextSizeValue(SETTINGS.GUI_TEXT_SIZE);
      Application.setAccessibilityMode(SETTINGS.ACCESSIBILITY_MODE);
      Application.setMenuMode(SETTINGS.GUI_STICKY_MENU);
    });
    this.getWindowSize(); // initialize
  },
  disableFeaturesInAndroid: function () {
    document.querySelector("#manage-bookmark-popup .button-move").classList.add("hide");
    document.querySelector("#manage-bookmark-popup .button-move").removeAttribute("data-default-focus");
    document.querySelector("#manage-bookmark-popup .button-delete").setAttribute("data-default-focus", "true");

    document.addEventListener("mousewheel", function (e) {
      e.stopPropagation();
      e.preventDefault();
    }, false);
  },
  getWindowSize: function (func) {
    if (!this.__windowWidth) {
      NativeApi.getWindowSize(function (args) {
        Application.__windowWidth = args[0];
        Application.__windowHeight= args[1];
        Application.getWindowSize(func);
      });
    } else {
      var res = {
        width: this.__windowWidth,
        height: this.__windowHeight
      };
      if (func) {
        func(res);
      } else {
        return res;
      }
    }
  },
  getMatchingValueOrDefault: function (attributeToCheck, values, defaults) {
    if (values.indexOf(attributeToCheck) > -1) {
      return attributeToCheck;
    } else {
      return defaults;
    }
  },
  /**
   * Open adding to bookmark view
   */
  addToBookmarkView: function () {
    var tab = Tabs.getActiveTab();
    document.getElementById("add-to-bookmark-title").value = tab.getTitle();
    document.getElementById("add-to-bookmark-address").value = tab.getUrl();
    Popups.open("add-to-bookmark");
  },
  addToSpeedDialView: function () {
    var tab = Tabs.getActiveTab();
    document.getElementById("add-to-speed-dial-title").value = tab.getTitle();
    document.getElementById("add-to-speed-dial-address").value = tab.getUrl();
    Popups.open("add-to-speed-dial");
  },
  setupOptionsPopupEvents: function () {
//  document.getElementById("button-add-to-bookmarks").addEventListener("click", Application.addToBookmarkView);
//  document.getElementById("button-add-to-speed-dial").addEventListener("click", Application.addToSpeedDialView);
    document.getElementById("button-settings").addEventListener("click", function (e) {
      Popups.open("settings");
    });
    document.getElementById("button-help").addEventListener("click", function (e) {
      Popups.open("help");
    });
//  document.getElementById("button-page-security").addEventListener("click", function (e) {
//    var el = document.getElementById("security-info-popup");
//    el.classList.remove("secure", "ev_secure", "non-secure", "expired", "mixed");
//    el.removeAttribute('aria-describedby');
//    var tab = Tabs.getActiveTab();
//    var state = tab.getSecureState();
//    document.getElementById("security-info-url").innerText= tab.getUrl();
//
//    switch (state) {
//      case 0:
//      case 2:
//        el.classList.add("expired");
//        el.setAttribute('aria-describedby', 'security-info-description-expired');
//        break;
//      case 1:
//        el.classList.add("non-secure");
//        el.setAttribute('aria-describedby', 'security-info-description-non-secure');
//        break;
//      case 3:
//        el.classList.add("mixed");
//        el.setAttribute('aria-describedby', 'security-info-description-mixed');
//        break;
//      case 4:
//        if (tab.getEvSsl()) {
//          el.classList.add("ev_secure");
//        } else {
//          el.classList.add("secure");
//        }
//        el.setAttribute('aria-describedby', 'security-info-description-secure security-more-info');
//        document.getElementById("security-certificate").innerText = tab.getCertificate();
//        document.getElementById("security-connection").innerText = tab.getConnection();
//        break;
//    }
//    Popups.open("security-info");
//  });
//  document.getElementById("button-exit").addEventListener("click", function (e) {
//    Popups.open("exit");
//  });
//  document.getElementById("button-close-tab").addEventListener("click", function (e) {
//    Sections.removeTab();
//  });
//  document.getElementById("button-open-in-new-tab").addEventListener("click", function (e) {
//    NativeApi.addTab(this.getAttribute("data-url"));
//  });
//  document.getElementById("button-new-private-tab").addEventListener("click", function (e) {
//    NativeApi.addPrivateTab(Tabs.urls.PRIVATE);
//  });
  },
  setTextSizeValue: function (size) {
    // gets first valid option if size value isn't supported
    var option = document.querySelector("#textsize-ranges option[value='" + size + "']") || document.querySelector("#textsize-ranges option");
    var slider = document.getElementById("textsize-slider");
    if (slider.value != option.value) { slider.value = option.value; }
    var text = option.dataset.value;
    var html = document.querySelector('html');
    document.getElementById("textsize-slider-label").innerText = i18n("Text Size") + " - " + i18n(text);
    html.className = html.className.replace(/text-[\d\w]+/, '').trim();
    html.classList.add("text-" + text.toLowerCase());
  },
  setAccessibilityMode: function (mode) {
    mode = !!mode;
    SETTINGS.ACCESSIBILITY_MODE = mode;
    if (mode) {
      if (!SETTINGS.ACCESSIBILITY_MENU_HIDDEN) {
        document.querySelector('#button-accessibility .button-state').innerHTML = i18n('On');
      }
      SETTINGS.GUI_TEXT_SCROLL_FACTOR = SETTINGS.GUI_TEXT_SCROLL_FACTOR_SLOW / 100;
      SETTINGS.NOTIFICATION_DISPLAY_DURATION = SETTINGS.NOTIFICATION_DISPLAY_DURATION_EXTENDED;
      document.querySelector('html').classList.add('accessibility-mode');
    } else {
      if (!SETTINGS.ACCESSIBILITY_MENU_HIDDEN) {
        document.querySelector('#button-accessibility .button-state').innerHTML = i18n('Off');
      }
      SETTINGS.GUI_TEXT_SCROLL_FACTOR = SETTINGS.GUI_TEXT_SCROLL_FACTOR_NORMAL / 100;
      SETTINGS.NOTIFICATION_DISPLAY_DURATION = SETTINGS.NOTIFICATION_DISPLAY_DURATION_NORMAL;
      document.querySelector('html').classList.remove('accessibility-mode');
    }
    NativeApi.setAccessibility(mode);
  },
  setMenuMode: function (mode) {
    mode = !!mode;
    SETTINGS.GUI_STICKY_MENU = mode;
    if (mode) {
      document.querySelector('#button-sticky-menu .button-state').innerHTML = i18n('On');
      Menu.container.classList.add("off-animation", "partial");
      Menu.bookmarksButton.classList.remove("hide");
      Menu.bookmarksButton.setAttribute("tabindex", "1");
      // making sure class removal will be executed after code above
      window.setTimeout(function () { Menu.container.classList.remove("off-animation"); }, 0);
    } else {
      document.querySelector('#button-sticky-menu .button-state').innerHTML = i18n('Off');
      Menu.container.classList.remove("partial");
      Menu.bookmarksButton.classList.add("hide");
      Menu.bookmarksButton.removeAttribute("tabindex");
    }
  },
  setupSettingsPopupEvents: function () {
    document.getElementById("button-zoom").addEventListener("click", function (e) {
      var zoom = Application.getMatchingValueOrDefault(Math.round(Tabs.getActiveTab().getZoom() * 100), [50,75,100,150,200,300], 100);
      document.getElementById("zoom-slider-label").innerText = i18n("100% Zoom").replace(i18n.convertNumber(100), i18n.convertNumber(zoom));
      document.getElementById('zoom-slider').value = document.querySelector("#zoom-ranges option[data-value='" + zoom + "']").value;
      Popups.open("zoom");
    });
    document.getElementById("button-textsize").addEventListener("click", function (e) {
      Popups.open("textsize");
    });
    document.getElementById("button-accessibility").addEventListener("click", function (e) {
      SETTINGS.ACCESSIBILITY_MODE = !SETTINGS.ACCESSIBILITY_MODE;
      Application.setAccessibilityMode(SETTINGS.ACCESSIBILITY_MODE);
    });
    document.getElementById("button-sticky-menu").addEventListener("click", function (e) {
      SETTINGS.GUI_STICKY_MENU = !SETTINGS.GUI_STICKY_MENU;
      NativeApi.setStickyMenu(SETTINGS.GUI_STICKY_MENU);
      Application.setMenuMode(SETTINGS.GUI_STICKY_MENU);
    });
    document.getElementById("button-clear-history").addEventListener("click", function (e) {
      Popups.open("clear-history");
    });
  },
  setupZoomPopupEvents: function () {
    document.getElementById("zoom-slider").addEventListener("input", function (e) {
      var zoom = document.querySelector("#zoom-ranges option[value='" + this.value + "']").dataset.value;
      document.getElementById("zoom-slider-label").innerText = i18n("100% Zoom").replace(i18n.convertNumber(100), i18n.convertNumber(zoom));
    });
    document.querySelector("#zoom-popup .button-ok").addEventListener('click', function (e) {
      var zoomFactor = document.querySelector("#zoom-ranges option[value='" + document.getElementById("zoom-slider").value + "']").dataset.value / 100;
      NativeApi.setZoom(zoomFactor);
    });
  },
  setupTextSizePopupEvents: function () {
    document.getElementById("textsize-slider").addEventListener("input", function (e) {
      Application.setTextSizeValue(this.value);
    });
    document.querySelector("#textsize-popup .button-ok").addEventListener('click', function (e) {
      SETTINGS.GUI_TEXT_SIZE = parseFloat(document.getElementById("textsize-slider").value);
      sendCommand('setTextSize', SETTINGS.GUI_TEXT_SIZE);
      Application.setTextSizeValue(SETTINGS.GUI_TEXT_SIZE);
    });
    document.querySelector("#textsize-popup .button-cancel").addEventListener("click", function (e) {
      Application.setTextSizeValue(SETTINGS.GUI_TEXT_SIZE);
    });
  },
  setupHelpPopupEvents: function () {
    document.getElementById("button-about").addEventListener("click", function (e) {
      Popups.open("about");
      TTSHelper.speak(document.querySelector('#about-popup .scrollable-content'));
      var a = document.querySelector("#about-popup a");
      if (a) { a.classList.add("focus"); }
    });
    document.getElementById("button-opera-help").addEventListener("click", function (e) {
      Popups.open("opera-help");
      TTSHelper.speak(document.querySelector('#opera-help-popup .scrollable-content'));
      var a = document.querySelector("#opera-help-popup a");
      if (a) { a.classList.add("focus"); }
    });
  },
  _checkIfTitleAndUrlFieldsAreEmpty: function (url, title) {
    if (!url.trim() || !title.trim()) {
      new AlertNotification(i18n("Please fill in both name and address fields"));
      return true;
    }
    return false;
  },
  setupAddToBookmarkPopupEvents: function () {
    document.querySelector("#add-to-bookmark-popup .button-ok").addEventListener("click", function (e) {
      var url = document.getElementById("add-to-bookmark-address").value;
      var title = document.getElementById("add-to-bookmark-title").value;
      if (Application._checkIfTitleAndUrlFieldsAreEmpty(url, title)) { return; }
      Bookmarks.add(url, title);
    });
  },
  setupAddToSpeedDialPopupEvents: function () {
    document.querySelector("#add-to-speed-dial-popup .button-ok").addEventListener("click", function (e) {
      var url = document.getElementById("add-to-speed-dial-address").value;
      var title = document.getElementById("add-to-speed-dial-title").value;
      if (Application._checkIfTitleAndUrlFieldsAreEmpty(url, title)) { return; }
      SpeedDial.add(url, title);
    });
  },
  setupExitPopupEvents: function () {
    document.querySelector("#exit-popup .button-ok").addEventListener("click", function () {
        window.close();
    });
  },
  setupClearHistoryPopupEvents: function () {
    document.querySelector("#clear-history-popup .button-ok").addEventListener("click", function () {
      NativeApi.clearHistory(Application.clearHistoryCallback);
    });
  },
  setupManageSpeedDialPopupEvents: function () {
    document.querySelector("#manage-speed-dial-popup .button-move").addEventListener("click", function () {
      SpeedDial.enableMoveState();
    });
    document.querySelector("#manage-speed-dial-popup .button-edit").addEventListener("click", function () {
      document.getElementById("edit-speed-dial-address").value = document.querySelector(".speeddials .focus").getAttribute("data-url");
      document.getElementById("edit-speed-dial-title").value = document.querySelector(".speeddials .focus").getAttribute("data-title");
      document.getElementById("speeddial-caption").innerText = "Edit Speed Dial";
      Popups.open("edit-speed-dial", function () {
        document.getElementById("speeddial-caption").innerText = i18n("Select a Speed Dial entry to edit");
      });
    });
    document.querySelector("#manage-speed-dial-popup .button-delete").addEventListener("click", function () {
      document.getElementById("speeddial-caption").innerText = "Edit Speed Dial";
      Popups.open("delete-speed-dial", function () {
        document.getElementById("speeddial-caption").innerText = i18n("Select a Speed Dial entry to edit");
      });
    });
  },
  setupEditSpeedDialPopupEvents: function () {
    document.querySelector("#edit-speed-dial-popup .button-ok").addEventListener("click", function (e) {
      var url = document.getElementById("edit-speed-dial-address").value;
      var title = document.getElementById("edit-speed-dial-title").value;
      if (Application._checkIfTitleAndUrlFieldsAreEmpty(url, title)) { return; }
      SpeedDial.edit(document.querySelector(".speeddials .focus").getAttribute("data-url"),url,title);
    });
  },
  setupDeleteSpeedDialPopupEvents: function () {
    document.querySelector("#delete-speed-dial-popup .button-ok").addEventListener("click", function () {
      SpeedDial.remove(document.querySelector(".speeddials .focus").getAttribute("data-url"));
    });
  },
  setupManageBookmarkPopupEvents: function () {
    document.querySelector("#manage-bookmark-popup .button-move").addEventListener("click", function () {
      Sections.setEditingState(true);
    });

    document.querySelector("#manage-bookmark-popup .button-delete").addEventListener("click", function () {
      Popups.open("bookmark-delete");
    });
  },
  setupDeleteBookmarkPopupEvents: function () {
    document.querySelector("#bookmark-delete-popup .button-ok").addEventListener("click", function () {
      var index = +document.querySelector(".bookmark.focus").getAttribute("data-id");
      var url = Bookmarks.getEntry(index).url;
      var title = Bookmarks.getEntry(index).title;
      Bookmarks.remove(url, title);
    });
  },
  setupClosePrivateTabPopupEvents: function () {
    document.querySelector("#close-private-tab-popup .button-ok").addEventListener("click", function () {
      NativeApi.removeTab(Tabs.getActiveTabId());
    });
  },
  setupConfirmDialogEvents: function () {
    document.querySelector("#confirm-popup .button-cancel").addEventListener("click", function () { Popups.closeStackingPopup(false); } );
    document.querySelector("#confirm-popup .button-ok").addEventListener("click", function () { Popups.closeStackingPopup(true); } );
  },
  setupAlertDialogEvents: function(){
    document.querySelector("#alert-popup .button-ok").addEventListener("click", Popups.closeStackingPopup.bind(Application) );
  },
  setupPromptDialogEvents: function () {
    document.querySelector("#prompt-popup .button-ok").addEventListener("click", Popups.closeStackingPopup.bind(Application) );
  },
  setupAuthenticationDialogEvents: function () {
    document.querySelector("#authentication-popup .button-ok").addEventListener("click", Popups.close.bind(Popups));
    document.querySelector("#authentication-popup .button-cancel").addEventListener("click",Popups.close.bind(Popups));
  },
  back: function () {
    if (Tabs.getActiveTab().History.getLength()<=0) { return; }
    Tabs.getActiveTab().History.back();
    NativeApi.historyMove(-1);
    this.updateButtons();
  },
  forward: function () {
    if (Tabs.getActiveTab().History.getCurrent() + 1 >= Tabs.getActiveTab().History.getLength()) { return; }
    Tabs.getActiveTab().History.forward();
    NativeApi.historyMove(1);
    this.updateButtons();
  },
  updateButtons: function () {
    // back & forward buttons
    var history = Tabs.getActiveTab().History;
    if (history.getCurrent() + 1 === history.getLength()) {
      Menu.forwardButton.classList.add("disabled");
    } else {
      Menu.forwardButton.classList.remove("disabled");
    }
    if (history.getCurrent() === 0) {
      Menu.backButton.classList.add("disabled");
    } else {
      Menu.backButton.classList.remove("disabled");
    }
    var focused = document.querySelector("#navigation .focus");
    if (focused.classList.contains("disabled")) {
      focused.classList.remove("focus");
      document.querySelector("#navigation [tabindex]:not(.disabled)").classList.add("focus");
    }
    // close buttons
    var
//    popupCloseTab = document.getElementById("button-close-tab"),
      sectionsCloseTab = document.querySelector(".header .close_tab");
    if (Tabs.getLength() > 1) {
//    popupCloseTab.classList.remove("hide");
      KeyboardHandler.enableButton(sectionsCloseTab);
    } else {
//    popupCloseTab.classList.add("hide");
      KeyboardHandler.disableButton(sectionsCloseTab);
    }
  },
  newEntry: function (url) {
    Tabs.getActiveTab().History.add(url);
    this.updateUrl(url, Tabs.getActiveTabId());
    changeUrl(url);
    Menu.backButton.className = "";
    Menu.backButton.setAttribute("tabindex", "1");
    KeyboardHandler.setState(KeyboardHandler.states.VIRTUAL_MOUSE_NAVIGATION);
    return url;
  },
  onNewEntry: function (url, index, length, tab_id) {
    var history = Tabs.getActiveTab().History;
    history.setLength(length);
    history.setCurrent(index);
    this.updateUrl(url, tab_id);
    Sections.renderHistory();
  },
  updateUrl: function (url, tab_id) {
    LOG("updateURL:"+ url + " " + tab_id);

    var tab = Tabs.getTab(tab_id);
    if (url === Tabs.urls.SPEED_DIAL) {
      SpeedDial.show();
      if (KeyboardHandler.state == KeyboardHandler.states.VIRTUAL_MOUSE_NAVIGATION || KeyboardHandler.state == null) {
        KeyboardHandler.setState(KeyboardHandler.states.SPEED_DIAL_PAGE_NAVIGATION);
      }
    } else {
      SpeedDial.hide();
      // If we were in initial "showing speed-dial" mode and url started loading,
      // we should turn into page navigation mode. This happens when BrowserUI
      // window is created with initial url.
      if (KeyboardHandler.state == KeyboardHandler.states.SPEED_DIAL_PAGE_NAVIGATION || KeyboardHandler.state == null) {
        KeyboardHandler.setState(KeyboardHandler.states.VIRTUAL_MOUSE_NAVIGATION);
      }
    }

    var tab_shown = document.querySelector(".tab[data-id=\""+tab_id+"\"]");
    if (tab_shown) {
      var oldOpened = document.querySelector(".opened");
      if (oldOpened) { oldOpened.classList.remove("opened"); }
      tab_shown.classList.add("opened");
    }

    if (url === Tabs.urls.SPEED_DIAL || url === Tabs.urls.PRIVATE) {
      Menu.urlInput.value = "";
    } else if (!isCustomErrorPages(url)) {
      Menu.urlInput.value = url;
    }
    if (Menu.urlInput.value === "") {
      Menu.urlInput.parentNode.classList.add("empty-url-input");
    } else {
      Menu.urlInput.parentNode.classList.remove("empty-url-input");
    }
    NativeApi.getCertificateInfo(function (info) {
      tab.setCertificate(info[0] + " " + info[1]);
      tab.setConnection(info[2]);
    });
    this.updateSecurity(tab.getSecureState(), tab.getEvSsl(), tab_id);
    this.updateButtons();
  },
  updateSecurity: function (state, is_ev_ssl, tab_id) {
    var tab = Tabs.getTab(tab_id);
    var el = document.getElementById("security-icon");
    el.className = "";
    switch (state) {
      case 0:
      case 2:
        el.className = "expired";
        break;
      case 3:
        el.className = "mixed";
        break;
      case 4:
        if (is_ev_ssl) {
          el.className = "ev_secure";
        } else {
          el.className = "secure";
        }
        break;
    }
    tab.setSecureState(state);
    tab.setEvSsl(is_ev_ssl);
    if (tab.isPrivate()) {
      document.body.classList.add('private');
    } else {
      document.body.classList.remove('private');
    }
  },
  clearHistoryCallback: function(result) {
    if(result[0] == 0) {
      new AlertNotification(i18n("History cleared"));
      Sections.renderHistory();
    } else {
      new AlertNotification(i18n("There was a problem while clearing history"));
    }
  }
};


var Popups = {
  _openedPopup: null,
  _popupList: [],
  init: function () {
    document.querySelector('.popups').addEventListener("click", this.handleButtonEvent, true);
  },
  open: function (id, closeCallback, modalData) {
    // Make sure that we got proper state on stack of popups
    this._handleCurrentPopupDuringOpen(modalData, closeCallback);

    // If there is no openedPopup - setup proper keyboard handling
    // skip this step if we just stacked current popup & current state is still POPUP_NAVIGATION
    if (!this._openedPopup && KeyboardHandler.getState() != KeyboardHandler.states.POPUP_NAVIGATION) {
      this._previousState = KeyboardHandler.getState();
      if (this._previousState == KeyboardHandler.states.VIRTUAL_MOUSE_NAVIGATION) {
        NativeApi.hideMouseCursor();
      }
      KeyboardHandler.setTemporaryState(KeyboardHandler.states.POPUP_NAVIGATION);
    }

    // create new popup entry
    var newPopup = {
      id: id,
      callback: closeCallback,
      element: document.getElementById(id + "-popup"),
      modalData: modalData
    };

    // In case there is already modal popup shown and new comes in, move it to stack
    // otherwise just show it
    if (this._openedPopup) {
      this._popupList.unshift(newPopup);
    } else {
      this._openedPopup = newPopup;
      this._show(this._openedPopup.element);
    }
    if (TTSHelper.ready()) {
      cvox.Api.playEarcon('OBJECT_OPEN');
    }
  },
  handleButtonEvent: function (e) {
    // handle background button close
    if (e.target.classList.contains("popup") && !e.target.classList.contains("only-button-can-close")) {
      Popups.close();
    }
    if (e.target.tagName === "BUTTON") {
      if (e.target.classList.contains('popup-close')) {
        Popups.close();
      } else if (e.target.classList.contains('popup-close-all')) {
        Popups.closeAll();
      }
    }
  },
  // Logic that handles what happens with currentOpened popup during opening new one:
  // 1. If a new popup is modal one, close all other on stack.
  // 2. Otherwise hide current popup, push it on stack and later on show newlyOpened
  _handleCurrentPopupDuringOpen: function(newPopupModalData, closeCallback) {
    if (this._openedPopup && !newPopupModalData) {
      this._popupList.push(this._openedPopup);
      this._hide(this._openedPopup.element);
      this._openedPopup = null;
    }
  },
  // Modal dialogs might contain some dynamic content, update them before showing
  _handleOpeningModalDialog: function(){
    if (this._openedPopup.modalData && this._openedPopup.modalData.type == "dialog") {
      this._setupStackingPopup(this._openedPopup.modalData);
    }
  },
  _show: function(element, retainOldFocus) {
    this._oldActive = document.querySelector(".active");
    this._handleOpeningModalDialog();
    if (this._oldActive) {
      this._oldActive.classList.remove("active");
    }
    element.classList.add("show", "active");
    NativeApi.gainFocus();

    if (retainOldFocus) { return; }

    var oldFocus = element.querySelector(".focus");
    var newFocus = element.querySelector("[data-default-focus]");
    if (oldFocus) { oldFocus.classList.remove("focus"); }
    if (newFocus) { newFocus.classList.add("focus"); }

  },
  _hide: function(element) {
    element.classList.remove("show", "active");
    if (this._oldActive) {
      this._oldActive.classList.add("active");
    }
  },
  close: function(dialog_result, dialog_value){
    this._hide(this._openedPopup.element);
    if (typeof this._openedPopup.callback == "function") { this._openedPopup.callback(this._openedPopup.modalData, dialog_result, dialog_value); }
    var previousPopup = this._popupList.pop();
    if (previousPopup) {
      this._show(previousPopup.element, true);
      this._openedPopup = previousPopup;
    } else {
      this._openedPopup = null;
      // if popup was closed after menu mode change then we need to switch nav (menu not visible anymore)
      if (this._previousState == KeyboardHandler.states.MENU_NAVIGATION && !Menu.checkClass("show")) {
        if (SpeedDial.el.classList.contains("show")) {
          KeyboardHandler.setState(KeyboardHandler.states.SPEED_DIAL_PAGE_NAVIGATION);
        } else {
          KeyboardHandler.setState(KeyboardHandler.states.VIRTUAL_MOUSE_NAVIGATION);
        }
      } else {
        KeyboardHandler.setTemporaryState(this._previousState);
        if (this._previousState == KeyboardHandler.states.VIRTUAL_MOUSE_NAVIGATION) {
          NativeApi.showMouseCursor();
        }
      }
    }
    NativeApi.blurFocus();
    if (TTSHelper.ready()) {
      cvox.Api.playEarcon('OBJECT_CLOSE');
    }
  },
  // Close All method will close all popups except the modal ones - those has to be closed manualy by user, or other action
  closeAll: function(){
    while(this._openedPopup && !this._openedPopup.modalData) { this.close(); }
  },
  // Public method to close stacking popups from OK/Cancel button events
  closeStackingPopup: function(result) {
    Popups.close(!!result, document.getElementById("prompt-input").value);
  },
  // Public method to show prompt dialog
  showPromptPopup: function(text, default_prompt, tab_id) {
    this._showStackingPopup({view: "prompt", text: text, default_prompt: default_prompt, tab_id: tab_id});
  },
  // Public method to show confirm dialog
  showConfirmPopup: function(text, tab_id) {
    this._showStackingPopup({view: "confirm", text: text, tab_id: tab_id});
  },
  // Public method to show alert dialog
  showAlertPopup: function(text, tab_id) {
    this._showStackingPopup({view: "alert", text: text, tab_id: tab_id});
  },
  // Public method to show authentication dialog
  showAuthenticationDialog: function(tab_id){
    document.getElementById("authentication-username").value = "";
    document.getElementById("authentication-password").value = "";
    Popups.open("authentication", this._authenticationDialogCallback, {type: "authentication", tab_id: tab_id});
  },
  // Helper method to prepare type and display stacking popup
  _showStackingPopup: function(popupData){
    popupData.type = "dialog";
    Popups.open(popupData.view, this._stackingDialogCallback, popupData);
  },
  _stackingDialogCallback: function(popupData, dialog_result, dialog_value){
    NativeApi.dialogClosed(popupData.tab_id, dialog_result, dialog_value);
  },
  // Ensures that dialogs get actual set of data for current popup to be shown
  _setupStackingPopup: function(popupData) {
      document.querySelector("#prompt-popup .popup-description").innerText
        = document.querySelector("#confirm-popup .popup-description").innerText
        = document.querySelector("#alert-popup .popup-description").innerText
        = popupData.text;
      document.getElementById("prompt-input").value = popupData.default_prompt || "";
  },
  // callback for authentication dialog that can be also called when BACK is pressed
  // Used for sending proper authenticationReceived values back to native part
  _authenticationDialogCallback: function(data){
    if (document.querySelector("#authentication-popup .button-ok.focus")) {
      NativeApi.authenticationReceived(
        data.tab_id,
        true,
        document.getElementById("authentication-username").value,
        document.getElementById("authentication-password").value
      );
    } else {
      NativeApi.authenticationReceived(
        data.tab_id,
        false,
        "",
        ""
      );
    }
  }

};

/**
 * Singleton Keyboard handler
 */
var KeyboardHandler = {
  state: null,
  states: {
    MENU_NAVIGATION: 1,
    VIRTUAL_MOUSE_NAVIGATION: 3,
    SPEED_DIAL_PAGE_NAVIGATION: 4,
    POPUP_NAVIGATION: 5
  },
  init: function(){
    document.querySelector(".background-dummy").classList.add("show");
    window.addEventListener("keydown", KeyboardHandler.handleKey.bind(this), true);
  },

  getState: function(){
    return KeyboardHandler.state;
  },

  setTemporaryState: function(state) {
    console.log("Setting temporary keyboard state: "+ state);
    this.state = state;
  },

  isUserInteractingWithKeyboard: function(){
    return this._userInteractingWithKeyboard;
  },

  setState: function (state) {
    var clear = document.querySelector(".active");
    for (var i in this.states) { if (this.states[i] == state) {break;} }
    console.log("Setting keyboard state: "+i);
    if (clear) { clear.classList.remove("active"); }
    if (state !== KeyboardHandler.states.VIRTUAL_MOUSE_NAVIGATION) {
      NativeApi.hideMouseCursor();
    } else {
      NativeApi.showMouseCursor();
    }
    if (state == KeyboardHandler.states.POPUP_NAVIGATION) {
      return;
    }

    SpeedDial.disableEditing();

    if (state == KeyboardHandler.states.MENU_NAVIGATION) {
      NativeApi.gainFocus();
      Menu.show();
      SpeedDial.blur();
    } else if (state == KeyboardHandler.states.SPEED_DIAL_PAGE_NAVIGATION) {
      NativeApi.gainFocus();
      SpeedDial.show();
      SpeedDial.focus();
      Menu.hide();
      document.querySelector(".background-dummy").classList.remove("show");
    } else {
      SpeedDial.hide();
      /* Remove class 'show' that animates bar upwards */
      Menu.hide();
      document.querySelector(".background-dummy").classList.remove("show");
      /* Delay message to native part so animation can be visible before hiding top window completly */
      setTimeout(function () {
        NativeApi.blurFocus();
      }, 300);
    }
    this.state = state;
  },
  enableButton: function(but) {
    but.classList.remove("hide");
    but.setAttribute("tabindex", "1");
  },
  disableButton: function(but) {
    but.classList.add("hide");
    but.removeAttribute("tabindex");
  },

  userInteractedWithKeyboard: function(){
    this._userInteractingWithKeyboard = true;
    clearTimeout(this._userInteractingWithKeyboardTimeout);
    this._userInteractingWithKeyboardTimeout = setTimeout(function(){
      this._userInteractingWithKeyboard = false;
    }.bind(this), 500);
  },

  _returnMatchingValueInArray: function(array, value) {
    if (typeof array == "number") {
      return array;
    }
    return (array||[]).indexOf(value) > -1 ? value : -1;
  },

  _handleSpecialKey: function(e) {
    var tabs, activated_id, found, i;
    switch(e.keyCode) {
      case window.VK_TAB:
        if (this.state != KeyboardHandler.states.VIRTUAL_MOUSE_NAVIGATION) {
          e.preventDefault();
        }
        break;
      case this._returnMatchingValueInArray(window.VK_BROWSER_OPTIONS, e.keyCode):
        Popups.closeAll();
        Menu.operaButton.click();
        break;
      case this._returnMatchingValueInArray(window.VK_BROWSER_HISTORY_BACK, e.keyCode):
        Menu.backButton.click();
        break;
      case this._returnMatchingValueInArray(window.VK_BROWSER_HISTORY_FORWARD, e.keyCode):
        Menu.forwardButton.click();
        break;
      case this._returnMatchingValueInArray(window.VK_BROWSER_TAB_NEXT, e.keyCode):
        tabs = Tabs.getAllTabs();
        activated_id = Tabs.getActiveTabId();
        var first, next;
        for (i in tabs) {
          if (!first) { first = i; }
          if (found && !next) { next = i; }
          if (i == activated_id) { found = i; }
        }
        NativeApi.activateTab(next ? next : first);
        break;
      case this._returnMatchingValueInArray(window.VK_BROWSER_TAB_PREV, e.keyCode):
        tabs = Tabs.getAllTabs();
        activated_id = Tabs.getActiveTabId();
        var last, prev;
        for (i in tabs) {
          if (i == activated_id) { found = i; }
          if (!found) { prev = i; }
          last = i;
        }
        NativeApi.activateTab(prev ? prev : last);
        break;
      case this._returnMatchingValueInArray(window.VK_BROWSER_URL_BAR, e.keyCode):
        if (KeyboardHandler.getState() !== KeyboardHandler.states.POPUP_NAVIGATION) {
          KeyboardHandler.setState(KeyboardHandler.states.MENU_NAVIGATION);
        }
        break;
    }
  },

  _swapLeftRightKeys: function(e){
     var dummyEvent = new Event("KeyboardEvent");
     switch (KeyboardHandler.state) {
       case KeyboardHandler.states.MENU_NAVIGATION:
       case KeyboardHandler.states.SPEED_DIAL_PAGE_NAVIGATION:
       case KeyboardHandler.states.POPUP_NAVIGATION:
         if (e.keyCode == VK_LEFT) { dummyEvent.keyCode=VK_RIGHT; return dummyEvent }
         if (e.keyCode == VK_RIGHT) { dummyEvent.keyCode=VK_LEFT; return dummyEvent }
     }
     return e;
  },

  handleKey: function(e){
    this.userInteractedWithKeyboard();
    if (document.activeElement && document.activeElement.nodeName != "INPUT") {
      document.activeElement.blur();
    }
    if (this.state != KeyboardHandler.states.VIRTUAL_MOUSE_NAVIGATION) {
      NativeApi.hideMouseCursor();
    }
    this._handleSpecialKey(e);
    if (i18n.isRTL) {
       e = this._swapLeftRightKeys(e);
    }
    switch(KeyboardHandler.state) {
    case KeyboardHandler.states.MENU_NAVIGATION:
      this.handleKeyMenu(e);
      break;
    case KeyboardHandler.states.VIRTUAL_MOUSE_NAVIGATION:
      this.handleKeyVirtualMouse(e.keyCode, false, false);
      break;
    case KeyboardHandler.states.SPEED_DIAL_PAGE_NAVIGATION:
      this.handleKeySpeedDial(e);
      break;
    case KeyboardHandler.states.POPUP_NAVIGATION:
      this.handleKeyPopup(e);
      break;
    }
  },

  handleKeySpeedDial: function handleKeySpeedDial(e) {
    var focused = document.querySelector("#speeddial .focus");
    var currentLine = focused.parentNode;
    var currentLineElements = Array.prototype.slice.call(currentLine.querySelectorAll("li:not(.hide)"));
    var indexInLine = currentLineElements.indexOf(focused);
    var nextLine = currentLine.nextElementSibling;
    var prevLine = currentLine.previousElementSibling;
    var moveState = SpeedDial.isInMoveState();

    switch(e.keyCode) {
      case window.VK_LEFT:
        if (indexInLine == 0 || indexInLine == 4) {
          if (prevLine) {
            this.setFocusOrSwap(prevLine.querySelectorAll("li")[indexInLine+3], focused, moveState);
          }
        } else {
          if (currentLineElements[indexInLine-1]) {
            this.setFocusOrSwap(currentLineElements[indexInLine-1], focused, moveState);
          }
        }
        break;
      case window.VK_RIGHT:
        if (indexInLine == 3 || indexInLine == 7) {
          if (nextLine) {
            var nextLineElements = Array.prototype.slice.call(nextLine.querySelectorAll("li:not(.hide)"));

            if (!moveState || nextLineElements[0].getAttribute("data-url")) {
              if (nextLineElements[indexInLine-3]) {
                this.setFocusOrSwap(nextLineElements[indexInLine-3], focused, moveState);
              } else {
                this.setFocusOrSwap(nextLineElements[0], focused, moveState);
              }
            }
          }
        } else {
          if (currentLineElements[indexInLine+1]) {
            this.setFocusOrSwap(currentLineElements[indexInLine+1], focused, moveState);
          } else if(currentLineElements[indexInLine-3]) {
            this.setFocusOrSwap(currentLineElements[indexInLine-3], focused, moveState);
          }
        }
        break;
      case window.VK_UP:
        if (indexInLine < 4) {
          KeyboardHandler.setState(KeyboardHandler.states.MENU_NAVIGATION);
        } else {
          this.setFocusOrSwap(currentLineElements[indexInLine-4], focused, moveState);
        }
        break;
      case window.VK_DOWN:
        if (indexInLine < 4 && currentLineElements.length > 4) {
          if (currentLineElements[indexInLine+4]) {
            this.setFocusOrSwap(currentLineElements[indexInLine+4], focused, moveState);
          } else if (currentLineElements[currentLineElements.length-1]) {
            this.setFocusOrSwap(currentLineElements[currentLineElements.length-1], focused, moveState);
          }
        }
        break;
      case window.VK_ENTER:
        focused.click();
        break;
      case window.VK_BACK:
      case window.VK_ESCAPE:
        if (SpeedDial.isInEditState()) {
          SpeedDial.disableEditing();
        } else if (Menu.backButton.classList.contains("disabled")) {
//        document.getElementById("button-exit").click();
        } else {
          Menu.backButton.click();
        }
        break;
    }
    TextOverflow.check(document.querySelector('.active .focus .caption'));
    TTSHelper.focus();
  },

  handleKeyVirtualMouse: function handleKeyVirtualMouse(keyCode, longpress, top_of_page) {
    if (!longpress) {
      this._bumpShown = false;
    }

    var viewSize = Application.getWindowSize();
    var loading_state = Menu.checkClass("loading");
    switch(keyCode) {
      case window.VK_UP:
        if (SETTINGS.GUI_STICKY_MENU) {
          if (MouseHandler.y < 90)
            KeyboardHandler.setState(KeyboardHandler.states.MENU_NAVIGATION);
          break;
        }

	// Hide menu if longpress in over it
	if (loading_state && longpress && (MouseHandler.y < 90)) {
            this._bumpShown = true;
            Menu.bump();
	    break;
	}

	// Focus menu if stepping into it while loading
	if (loading_state && !longpress && (MouseHandler.y < 90)) {
	    KeyboardHandler.setState(KeyboardHandler.states.MENU_NAVIGATION);
	    break;
	}

        if (loading_state || !top_of_page || MouseHandler.y > SETTINGS.VIRTUAL_MOUSE_SINGLE_MOVE_STEP_DISTANCE) {
          break;
        }

        if (!longpress) {
          KeyboardHandler.setState(KeyboardHandler.states.MENU_NAVIGATION);
        } else if (!this._bumpShown) {
          this._bumpShown = true;
          Menu.bump();
        }
        break;
      case window.VK_ENTER:
        if (longpress) {
          Menu.operaButton.click();
        }
        break;
      case window.VK_BACK:
      case window.VK_ESCAPE:
        if (Menu.backButton.classList.contains("disabled")) {
//        document.getElementById("button-exit").click();
        } else {
          Menu.backButton.click();
        }
        break;
    }
  },

  _getLeftPositionInside: function(el, untilElement){ // For scrolling...
    var left = 0;
    if (!untilElement) untilElement = document.body;
    while(el != untilElement) {
      left += +el.offsetLeft;
      el = el.parentNode;
    }
    return left
  },
  _findULInParent: function(el){
    while(el.parentNode && el.nodeName != "UL") {
      el = el.parentNode;
    }
    return el;
  },
  _checkPrivateTab: function (tab) {
    Menu.container.classList.remove("private", "normal");
    var container = findParentContainingClass("line", tab);
    if (container && container.id !== "elements") { return; }
    if (tab.classList.contains("tab")) {
      if (tab.classList.contains("private")) {
        Menu.container.classList.add("private");
      } else {
        Menu.container.classList.add("normal");
      }
    } else if (tab.classList.contains("new_tab")) {
      Menu.container.classList.add("normal");
    }
  },

  setFocus: function(newFocus, oldFocus, forced_type) {
    var type = null;

    if (oldFocus) {
      oldFocus.classList.remove("focus");
      if (oldFocus.classList.contains("bookmark")) {
        oldFocus.classList.remove("focus_editing");
      }
      oldFocus.blur();
    }
    newFocus.classList.add("focus");
    newFocus.dispatchEvent(new CustomEvent("customfocus"));

    if (forced_type) {
      type = forced_type; // force focus to override mouse movement protection
    } else if (!findParentContainingClass("active", newFocus)) {
      return; // This check is for when mouse focus inactive line
    } else {
      type = document.querySelector('.active').id;
    }

    this._checkPrivateTab(newFocus);
    switch (type) {
      case 'elements':
        this.updateFocusInScrollableArea(newFocus);
        break;
      case 'speeddial':
        this.updateFocusInSpeedDialScrollableArea(newFocus);
        break;
    }
    if (document.querySelector(".done_bookmarks") && document.querySelector(".done_bookmarks").classList.contains("hide") !== true && newFocus.classList.contains("bookmark")) {
      newFocus.classList.add("focus_editing");
    }
    if (newFocus.nodeName == "INPUT" && newFocus.type == "range") { newFocus.focus(); }
  },

  updateFocusInScrollableArea: function(newFocus) {
    var offset_fix = 0;
    if (newFocus.offsetLeft == 0 && newFocus.previousSibling) {
      newFocus = newFocus.previousSibling; // this is because offset cannot be calculated for elements injected after transitioned element
    }
    if(newFocus.nextSibling && newFocus.nextSibling.nodeType == Node.ELEMENT_NODE && newFocus.nextSibling.classList.contains('slide')) {
      offset_fix = newFocus.offsetWidth;
    }

    var parent = this._findULInParent(newFocus);
    if (parent && parent.style) {
      var offset = this._getLeftPositionInside(newFocus, parent);
      var oldValue = parseInt(parent.style && parent.style.transform.replace("translate3d(",""), 10) || 0;

      if (i18n.isRTL) {
        if (offset + oldValue < 0) {
          parent.style.transform = "translate3d(" + Math.min(parent.scrollWidth - document.body.clientWidth + 400 - offset_fix, -(newFocus.offsetLeft - parent.offsetWidth + 150)) + "px, 0, 0)";
        }
        if (offset + newFocus.offsetWidth + oldValue  + 300 > document.body.clientWidth) {
          parent.style.transform = "translate3d(" + Math.max(75, -newFocus.offsetLeft) + "px, 0, 0)";
        }
      } else {
        if (offset + newFocus.offsetWidth + oldValue  + 300 > document.body.clientWidth) {
          parent.style.transform = "translate3d(" + Math.max(-(parent.scrollWidth - document.body.clientWidth + 300 - offset_fix), -newFocus.offsetLeft) + "px, 0, 0)";
        }
        if (offset + oldValue < 0) {
          parent.style.transform = "translate3d(" + Math.min(0, -newFocus.offsetLeft + document.body.clientWidth - newFocus.offsetWidth - 300) + "px, 0, 0)";
        }
      }
    }
  },
  updateFocusInSpeedDialScrollableArea: function(newFocus) {
    var container = document.querySelector(".speeddials");
    container.style.transform = "translate3d(" + (-newFocus.parentNode.offsetLeft) + "px,0,0)";

  },
  setFocusOrSwap: function(newFocus, oldFocus, swap) {
    if (!swap) {
      this.setFocus(newFocus, oldFocus);
    } else {
      // only swap items with data-url (only speeddials)
      if (newFocus.getAttribute("data-url") && oldFocus.getAttribute("data-url")) {
        var oldParent = oldFocus.parentNode;
        var newParent = newFocus.parentNode;
        var oldIndex = Array.prototype.slice.call(oldParent.children).indexOf(oldFocus);
        var newIndex = Array.prototype.slice.call(newParent.children).indexOf(newFocus);

        oldParent.removeChild(oldFocus);

        if (oldParent.nextElementSibling) {
          oldParent.appendChild(oldParent.nextElementSibling.firstChild);
        }

        newParent.insertBefore(oldFocus, newParent.children[newIndex]);

        if (newParent.children.length>8) {
          newParent.nextElementSibling.insertBefore(newParent.children[8], newParent.nextElementSibling.firstChild);
        }
        if (oldParent.children.length>8) {
          oldParent.nextElementSibling.insertBefore(oldParent.children[8], oldParent.nextElementSibling.firstChild);
        }

        this.setFocus(oldFocus); // makes sure that proper view scrolling is applied
      }
    }
  },

  handleKeyMenu: function (e) {
    var lines = Array.apply(null, document.querySelectorAll(".line"));
    var currentLine = document.querySelector(".line.active");
    if (!currentLine) { return; }
    var lineIndex = lines.indexOf(currentLine);
    var currentLineItems = Array.apply(null, currentLine.querySelectorAll("[tabindex]:not(.disabled)"));
    var currentLineActiveItem = currentLine.querySelector(".focus");
    var currentIndex = currentLineItems.indexOf(currentLineActiveItem);
    var editing = document.activeElement.nodeName == "INPUT";
    var allowWrap = currentLine.classList.contains("wrap");
    var toFocus;

    if (!currentLineActiveItem) {
      currentLineItems[0] && KeyboardHandler.setFocus(currentLineItems[0]);
      currentLineActiveItem = currentLine.querySelector(".focus");
    }

    switch (e.keyCode) {
      case window.VK_LEFT:
        if (editing) { return; }
        if (currentIndex > 0) {
          toFocus = currentLineItems[currentIndex - 1];
        } else if (allowWrap) {
          toFocus = currentLineItems[currentLineItems.length - 1];
        }
        if (toFocus) {
          this.setFocus(toFocus, currentLineActiveItem);
        }
        e.preventDefault();
        break;
      case window.VK_RIGHT:
        if (editing) { return; }
        if (currentIndex < currentLineItems.length-1) {
          toFocus = currentLineItems[currentIndex + 1];
        } else if (allowWrap) {
          toFocus = currentLineItems[0];
        }
        if (toFocus) {
          this.setFocus(toFocus, currentLineActiveItem);
        }
        e.preventDefault();
        break;
      case window.VK_DOWN:
        if (lineIndex == lines.length - 1) {
          if (SpeedDial.el.classList.contains("show")) {
            this.setState(KeyboardHandler.states.SPEED_DIAL_PAGE_NAVIGATION);
          } else {
            this.setState(KeyboardHandler.states.VIRTUAL_MOUSE_NAVIGATION);
          }
        } else {
          currentLine.classList.remove("active");
          lines[lineIndex+1].classList.add("active");
          toFocus = lines[lineIndex+1].querySelector(".focus");
          if (!toFocus) { toFocus = lines[lineIndex+1].querySelector("[tabindex]"); }
          KeyboardHandler.setFocus(toFocus);
        }
        e.preventDefault();
        document.activeElement.blur();
        break;
      case window.VK_UP:
        if (lineIndex > 0 && Menu.checkClass("show")) {
          currentLine.classList.remove("active");
          lines[lineIndex-1].classList.add("active");
          toFocus = lines[lineIndex-1].querySelector(".focus");
          if (!toFocus) { toFocus = lines[lineIndex-1].querySelector("[tabindex]"); }
          KeyboardHandler.setFocus(toFocus);
        } else if (lineIndex === 2 && SETTINGS.GUI_STICKY_MENU) {
          NativeApi.scrollBy(0, -SETTINGS.VIRTUAL_MOUSE_SCROLL_DISTANCE);
        }
        e.preventDefault();
        document.activeElement.blur();
        break;
      case window.VK_ENTER:
        if (editing) {
          var input_element = document.activeElement;
          Application.newEntry(input_element.value);
          input_element.blur();
        } else if (currentLineActiveItem.nodeName == "INPUT") {
          if (SETTINGS.SELECT_TEXT) {
            currentLineActiveItem.focus(); // needed to show linux IME, must be before select()
            currentLineActiveItem.select();
          } else { // diamond platform hack (select & focus order does matter)
            currentLineActiveItem.select();
            currentLineActiveItem.focus();
            currentLineActiveItem.setSelectionRange(currentLineActiveItem.selectionEnd, currentLineActiveItem.selectionEnd);
          }
          editing = true;
        } else {
          currentLineActiveItem.click();
        }
        e.stopPropagation();
        e.preventDefault();
        break;
      case window.VK_BACK:
      case window.VK_ESCAPE:
        if (editing) { return; }
        if (SpeedDial.el.classList.contains("show")) {
          this.setState(KeyboardHandler.states.SPEED_DIAL_PAGE_NAVIGATION);
        } else {
          this.setState(KeyboardHandler.states.VIRTUAL_MOUSE_NAVIGATION);
        }
        break;
    }
    TextOverflow.check(document.querySelector('.active .focus .caption'));
    if (!editing) TTSHelper.focus();
  },
  _isElementVisibleInScrollableContent: function(element, container) {
    return (element.offsetTop>=container.scrollTop && (element.offsetTop + element.offsetHeight) <= (container.offsetHeight + container.scrollTop));
  },
  _moveScrollableContentOrSelectLink: function(container,moveUp) {
    var links = Array.apply(null, container.querySelectorAll("a"));
    var focused = container.querySelector(".focus");
    var index = links.indexOf(focused);

    if (moveUp){
      if (index > 0 && this._isElementVisibleInScrollableContent(links[index-1], container)) {
        KeyboardHandler.setFocus(links[index-1], focused);
      } else {
        container.scrollTop-=50;
      }
    } else {
      if (index<links.length - 1 && this._isElementVisibleInScrollableContent(links[index+1], container)) {
        KeyboardHandler.setFocus(links[index+1], focused);
      } else {
        container.scrollTop+=50;
      }
    }
  },

  handleKeyPopup: function(e){
    var currentPopupElement = document.querySelector(".popup.active");
    var current = currentPopupElement.querySelector(".focus");
    var leftRight = current ? Array.apply(null, currentPopupElement.querySelectorAll("[tabindex=\""+ current.getAttribute("tabindex") +"\"]:not(.hide)")) : [];
    var leftRightIndex = leftRight.indexOf(current);
    var upDownIndex = current ? +current.getAttribute("tabindex") : 0;
    var lastItem = current ? Array.apply(null, currentPopupElement.querySelectorAll("[tabindex]")).pop() : null ;
    var lastItemIndex = lastItem ? lastItem.getAttribute("tabindex") : -1;
    var editing = document.activeElement.nodeName == "INPUT";
    var scrollableContent = currentPopupElement.querySelector(".scrollable-content");
    var isScrollablePopupContent = !!scrollableContent;
    var toFocus;

    switch (e.keyCode) {
    case VK_BACK:
    case window.VK_ESCAPE:
      e.preventDefault();
      e.stopPropagation();
      document.activeElement.blur(); // hide IME if visible before hiding popup
      Popups.close();
      break;
    case VK_LEFT:
      e.stopPropagation();
      if (editing) {
        if (isScrollablePopupContent) { return; }
        if (current.type == "range" && TTSHelper.ready()) {
          e.stopImmediatePropagation(); // disable ChromeVox range handling
        }
      } else if (leftRightIndex == 0) {
        if (document.querySelector(".popup.active").classList.contains("left-button-can-close")) {
          Popups.close();
        }
      } else if (current && leftRight[leftRightIndex-1]) {
        KeyboardHandler.setFocus(leftRight[leftRightIndex-1], current);
      }
      break;
    case VK_RIGHT:
      e.stopPropagation();
      if (editing) {
        if (isScrollablePopupContent) { return; }
        if (current.type == "range" && TTSHelper.ready()) {
          e.stopImmediatePropagation(); // disable ChromeVox range handling
        }
      } else if (leftRightIndex < leftRight.length - 1) {
        KeyboardHandler.setFocus(leftRight[leftRightIndex+1], current);
      } else if (current && current.classList.contains("button-right-arrow")) {
        current.click();
      }
      break;
    case VK_UP:
      e.preventDefault();
      e.stopPropagation();
      if (isScrollablePopupContent) {
        this._moveScrollableContentOrSelectLink(scrollableContent, true);
      } else {
        while (!toFocus && upDownIndex>0) {
          toFocus = currentPopupElement.querySelector("[tabindex=\""+ (--upDownIndex) + "\"]:not(.hide)");
        }
        if (toFocus) {
          KeyboardHandler.setFocus(toFocus, current);
          if (editing && current.type == "range" && TTSHelper.ready()) {
            e.stopImmediatePropagation(); // disable ChromeVox range handling
            cvox.Api.syncToNode(toFocus, true);
          }
        }
      }
      break;
    case VK_DOWN:
      e.preventDefault();
      e.stopPropagation();
      if (isScrollablePopupContent) {
        this._moveScrollableContentOrSelectLink(scrollableContent, false);
      } else {
        while (!toFocus && upDownIndex < lastItemIndex) {
          toFocus = currentPopupElement.querySelector("[tabindex=\""+ (++upDownIndex) + "\"]:not(.hide)");
        }
        if (toFocus) {
          KeyboardHandler.setFocus(toFocus, current);
          if (editing && current.type == "range" && TTSHelper.ready()) {
            e.stopImmediatePropagation(); // disable ChromeVox range handling
            cvox.Api.syncToNode(toFocus, true);
          }
        }
      }
      break;
    case VK_ENTER:
      e.preventDefault();
      e.stopPropagation();
      if (!current) { Popups.close(); break; }
      if (current.nodeName == "INPUT") {
        if (current.type == "range") { return; }
        if (editing) {
          document.activeElement.blur();
        }  else {
          current.focus();
          editing = true;
        }
      } else {
        current.click();
      }
      break;
    }
    if (!editing) TTSHelper.focus();
  }

};

var Tab = function (url, title, private_mode) {
  this.initHistory();
  this._url = "";
  this.setUrl(url);
  this.setTitle(title);
  this.setPrivateMode(private_mode);
};
Tab.prototype = {
  initHistory: function(){
    this.History = new History();
  },
  setSecureState: function(val) {
    this._secureState = val;
  },
  setEvSsl: function(val) {
    this._ev_ssl = val;
  },
  setUrl: function(val) {
    this._url = val || this._url;
    this.History.setCurrentEntry(this._url);
  },
  setTitle: function(val) {
    switch (val) {
      case Tabs.urls.SPEED_DIAL:
        this._title = i18n("Speed Dial");
        break;
      case Tabs.urls.PRIVATE:
        this._title = i18n("Private Browsing");
        break;
      default:
        this._title = val || i18n("No Name");
    }
  },
  setCertificate: function(val) {
    this._certificate = val;
  },
  setConnection: function(val) {
    this._connection = val;
  },
  setPrivateMode: function(val) {
    this._private_mode = val;
  },
  getSecureState: function() {
    return this._secureState;
  },
  getEvSsl: function() {
    return this._ev_ssl;
  },
  getUrl: function() {
    return this._url;
  },
  getTitle: function() {
    return this._title;
  },
  getCertificate: function() {
    return this._certificate;
  },
  getConnection: function() {
    return this._connection;
  },
  setZoom: function(val) {
    this._zoom = val;
  },
  getZoom: function() {
    return this._zoom;
  },
  isPrivate: function () {
    return !!this._private_mode;
  }
};

var Tabs = {
  _tabs: {},
  _activeTab: null,
  _count: 0,
  urls: {
    SPEED_DIAL: "about:blank",
    PRIVATE: "chrome://browserui/private"
  },
  getActiveTab: function(){
    return this._tabs[this._activeTab];
  },
  getActiveTabId: function(){
    return this._activeTab;
  },
  setActiveTab: function(val){
    this._activeTab = val;
  },
  addTab: function (id, url, private_mode) {
    if (id === undefined || this._tabs[id]) { return; }
    this._tabs[id] = new Tab(url, "", !!private_mode);
    NativeApi.getZoom(id, function (res) {
      console.log("Current zoom level: " + res[0]);
      this._tabs[id].setZoom(res[0]);
    }.bind(this));
    this._count++;
    Sections.renderTabs(1);
    if (this._activeTab === null) {
      this.setActiveTab(id);
    }
  },
  removeTab: function (id) {
    delete this._tabs[id];
    this._count--;
  },
  updateTabUrl: function(id, url) {
    if (!this._tabs[id]) {
      this.addTab(id, url);
    } else {
      this._tabs[id].setUrl(url);
    }
  },
  updateTabTitle: function(id, title) {
    this._tabs[id].setTitle(title);
    if (this._toNotify) { this._toNotify(); }
  },
  addTitleNotifier: function(callback) {
    this._toNotify = callback;
  },
  getTab: function(id) {
    return this._tabs[id];
  },
  getAllTabs: function(){
    return this._tabs;
  },
  updateTabThumbnail: function(args){
    var el = document.querySelector("#tabs-elements .tab[data-id='" + args[0] + "'] img");
    if (el) { el.src = args[3]; }
  },
  getLength: function(){
    return this._count;
  }
};

var Menu = {
  init: function () {
    this.container = document.querySelector(".header");
    this.urlbar = document.getElementById("navigation");
    this.urlInput = document.getElementById("url");
    this.backButton = document.getElementById("back");
    this.forwardButton = document.getElementById("forward");
    this.reloadStopButton = document.getElementById("reloadStop");
    this.openHomeButton = document.getElementById("openHome");
    this.bookmarksButton = document.getElementById("open-bookmarks");
    this.speedDialButton = document.getElementById("open-speeddial");
    this.operaButton = document.getElementById("opera");
    this.urlbar.addEventListener("click", this.handleButtonEvent, false);
    LoadingBar.init();
    Sections.init();
    Bookmarks.init();
  },
  handleButtonEvent: function (e) {
    switch (e.target.id) {
      case "back":
        if (!/disabled/.test(e.target.className)) { Application.back(); }
        break;
      case "forward":
        if (!/disabled/.test(e.target.className)) { Application.forward(); }
        break;
      case "reloadStop":
        if (e.target.classList.contains("stop")) { NativeApi.stopLoad(); }
        else { NativeApi.reload(); }
        break;
      case "openHome":
      	KeyboardHandler.setState(KeyboardHandler.states.SPEED_DIAL_PAGE_NAVIGATION);
      	break;
      case "open-bookmarks":
//      Menu.toggleBookmarks();
        break;
      case "open-speeddial": /*not open speeddial,open the url your inputed*/
//      KeyboardHandler.setState(KeyboardHandler.states.SPEED_DIAL_PAGE_NAVIGATION);
//      NativeApi.loadUrl(Tabs.urls.SPEED_DIAL);
		NativeApi.loadUrl(Menu.urlInput.value);
        break;
      case "opera":
        Menu.openOperaPopup();
        break;
    }
  },
  openOperaPopup: function () {
      document.activeElement.blur(); // hide IME if visible
//    var openTab = document.getElementById("button-open-in-new-tab");
      NativeApi.getHighlightedUrl(function (url) {
        Popups.open("options");
//      if (url[0]) {
//        openTab.classList.remove("hide");
//        openTab.setAttribute("data-url", url[0]);
//        KeyboardHandler.setFocus(openTab, document.querySelector("#options-popup .focus"));
//      } else {
//        openTab.classList.add("hide");
//      }
        
        KeyboardHandler.setFocus(document.getElementById("button-settings"), document.querySelector("#options-popup .focus"));
      });
  },
  toggleBookmarks: function () {
    if (this.container.classList.contains("show")) {
      this.hide();
      SpeedDial.el.classList.remove("initial-state");
    } else {
      KeyboardHandler.setState(KeyboardHandler.states.MENU_NAVIGATION);
      setTimeout(function () {
        Menu.container.classList.add("show");
        var upKeyEvent = new Event("KeyboardEvent");
        upKeyEvent.keyCode = VK_UP;
        KeyboardHandler.handleKeyMenu(upKeyEvent);
      }, 10);
      SpeedDial.el.classList.add("initial-state");
      SpeedDial.disableEditing();
    }
  },
  show: function () {
    /* Set active focus to URL bar */
    this.container.querySelectorAll(".line")[2].classList.add("active");
    document.querySelector("#navigation .focus").classList.remove("focus");
    this.urlInput.classList.add("focus");
    if (!SETTINGS.GUI_STICKY_MENU) {
      /* Delay adding css class so it can be animated after window is shown */
      setTimeout(function () {
        Menu.container.classList.add("show");
      }, 10);
    }
  },
  hide: function () {
    this.container.classList.remove("show");
  },
  bump: function () {
    if (SETTINGS.GUI_STICKY_MENU) return;
    NativeApi.gainFocus();
    this.container.classList.add("loading");
    setTimeout(function () {
      Menu.container.classList.remove("loading");
      setTimeout(function () {
        NativeApi.blurFocus();
      }, 400);
    },200);
  },
  checkClass: function (className) {
    return this.container.classList.contains(className);
  }
};

var Sections = {
  init: function () {
    this.elementsContainer = document.getElementById("elements");
    this.historyContainer = document.getElementById("history-elements");
    this.tabsContainer = document.getElementById("tabs-elements");
    this.bookmarksContainer = document.getElementById("bookmarks-elements");
    this._setupEvents();
    KeyboardHandler.setFocus(document.querySelectorAll("#sections button")[1]);
    Tabs.addTitleNotifier(this._updateTitles);
    setInterval(this.queueForShowingThumbnails.bind(this), 100);
    this.renderTabs();
    this.showTabs();
  },
  _setupEvents: function () {
    var buttons = document.querySelectorAll("#sections button");
    for (var i=0,l=buttons.length; i<l; i++) {
      buttons[i].addEventListener("customfocus", this.handleTabChangeEvent, false);
    }
    this.elementsContainer.addEventListener("click", this.handleButtonEvent.bind(this), false);
  },
  handleButtonEvent: function (e) {
    if (e.target.nodeName != "LI" && e.target.parentNode.nodeName != "LI") { return; } // Cancel mouse clicks outside elements
    var element = findParentContainingClass("focus", e.target);
    if (element.classList.contains("new_tab")) {
      document.querySelector(".active").classList.remove("active");
      Menu.urlbar.classList.add("active");
      KeyboardHandler.setFocus(Menu.urlInput, document.querySelector("#navigation .focus"));
      NativeApi.addTab(Tabs.urls.SPEED_DIAL);
    }
    if (element.classList.contains("tab")) {
      NativeApi.activateTab(element.getAttribute("data-id"));
      KeyboardHandler.setState(KeyboardHandler.states.VIRTUAL_MOUSE_NAVIGATION);
    }
    if (element.classList.contains("history_item")) {
      NativeApi.loadUrl(element.getAttribute("data-url"));
      KeyboardHandler.setState(KeyboardHandler.states.VIRTUAL_MOUSE_NAVIGATION);
    }
    if (element.classList.contains("bookmark")) {
      if (this._editing) {
        if (this._editingState) {
          var movedItem = document.querySelector(".bookmark.focus"); // Moving one is always in focus
          var index = Array.prototype.slice.call(document.querySelectorAll(".bookmark")).indexOf(movedItem);
          if (index > -1) {
            Bookmarks.move(Bookmarks.getEntry(this._movingID).url, index);
          }
          this.setEditingState(false);
        } else {
          Popups.open("manage-bookmark");
        }
      } else {
        NativeApi.loadUrl(Bookmarks.getEntry(+element.getAttribute("data-id")).url);
        KeyboardHandler.setState(KeyboardHandler.states.VIRTUAL_MOUSE_NAVIGATION);
      }
    }
    if (element.classList.contains("close_tab")) {
      this.removeTab();
    }
    if (element.classList.contains("clear_history")) {
      Popups.open("clear-history");
    }
    if (element.classList.contains("edit_bookmarks")) {
      this._editingBookmarks(true);
    }
    if (element.classList.contains("done_bookmarks")) {
      this.editingOff();
    }
    if (element.classList.contains("add_bookmark")) {
      Application.addToBookmarkView();
    }
  },
  _editingBookmarks: function (turnOn) {
    var done = document.querySelector(".done_bookmarks");
    var edit = document.querySelector(".edit_bookmarks");
    if (turnOn) {
      KeyboardHandler.enableButton(done);
      KeyboardHandler.disableButton(edit);
      KeyboardHandler.disableButton(document.querySelector(".add_bookmark"));
      if (edit.classList.contains("focus")) {
        KeyboardHandler.setFocus(done, edit);
      }
      this._editing = true;

      var caption = document.getElementById("sections_caption");

      document.getElementById("sections_buttons").classList.add("hide");
      caption.classList.add("show");
      caption.innerText= i18n("Select a bookmark to edit");

      window.addEventListener("keydown", this._editingEvent, false);
    } else {
      KeyboardHandler.disableButton(done);
      KeyboardHandler.enableButton(edit);
      KeyboardHandler.enableButton(document.querySelector(".add_bookmark"));
      if (done.classList.contains("focus")) {
        KeyboardHandler.setFocus(edit);
      }
      this._editing = false;
    }
  },
  _editingEvent: function (e) {
    if ([VK_UP, VK_DOWN].indexOf(e.keyCode) > -1) {
      e.preventDefault();
      e.stopPropagation();
      Sections.editingOff();
    }
    if (!Sections._editingState) { return; }
    var currentFocus = document.querySelector(".line.active .focus");
    var currentMoving = document.querySelector(".bookmark[data-id=\""+ Sections._movingID +"\"]");
    if (e.keyCode == VK_LEFT || e.keyCode == VK_RIGHT) {
      if (currentMoving != currentFocus) {
        if (e.keyCode == VK_LEFT) {
          currentMoving.parentNode.insertBefore(currentMoving, currentFocus);
        } else {
          currentMoving.parentNode.insertBefore(currentMoving, currentFocus.nextSibling);
        }
        KeyboardHandler.setFocus(currentMoving, currentFocus);
      }
    }
  },
  editingOff: function () {
    Sections.setEditingState(false);
    Sections._editingBookmarks(false);
    document.getElementById("sections_buttons").classList.remove("hide");
    document.getElementById("sections_caption").classList.remove("show");
    window.removeEventListener("keydown", this._editingEvent, false);
    if (document.querySelector(".focus_editing")) {
      document.querySelector(".focus_editing").classList.remove("focus_editing");
    }
  },
  handleTabChangeEvent: function (e) {
    var cl= e.target.classList;
    if (cl.contains("tabs")) {
      Sections.showTabs();
    }
    if (cl.contains("history")) {
      Sections.showHistory();
    }
    if (cl.contains("bookmarks")) {
      Sections.showBookmarks();
    }
  },
  _insertAnimationTab: function (offset) {
    var tab = document.createElement('li');
    if (offset < 0) {
      tab.classList.add('tab', 'slide', 'slide-out');
      this.tabsContainer.appendChild(tab);
    } else {
      tab.classList.add('tab', 'slide', 'slide-in');
      this.tabsContainer.insertBefore(tab, this.tabsContainer.lastChild);
    }
  },
  _startAnimationTab: function () {
    var tab = Sections.tabsContainer.querySelector('.slide:not(.start)');
    if (tab) {
      tab.addEventListener('webkitTransitionEnd', function (e) { this.remove(); });
      getComputedStyle(tab).width;
      tab.classList.add('start');
    }
    window.setTimeout(function () { // animation safe check
      if (tab.parentNode) { tab.remove(); }
      tab = null;
    }, 1000);
  },
  _updateTitles: function () {
    var tabs = Tabs.getAllTabs();
    for (var el in tabs) if (tabs.hasOwnProperty(el)) {
      document.querySelector("#tabs-elements [data-id=\"" + el + "\"] .caption").innerText = tabs[el].getTitle();
    }
  },
  _clearContainer: function (container) {
    container.innerHTML = "";
    container.style.transform="translate3d(0,0,0)";
  },
  _getThumb: function (title, props, options) {
    var li = document.createElement('li');
    li.innerHTML = this._getImage(options) + this._getCaption(options);
    if (options && options.type === "bookmark") {
      li.querySelector('.bookmark-label').innerText = title;
    } else {
      li.querySelector('.caption').innerText = title;
    }
    for (var name in props) { li.setAttribute(name, props[name]); }
    return li;
  },
  _getImage: function (options) {
    if (options && options.tag === 'img') {
      return '<img class="thumb" alt="">';
    } else {
      return '<div class="thumb"></div>'
    }
  },
  _getCaption: function (options) {
    if (!options) { options = {} }
    switch (options.type) {
      case 'tab':
        return (options.private ? '<i class="private-ico"></i><div class="ico-spacer">' : '')
          + '<p class="caption"></p>'
          + (options.private ? '</div>' : '');
      case 'bookmark':
        return '<p class="caption"><span class="bookmark-editing-prefix">' +i18n("Edit bookmark")+ '</span><span class="bookmark-editing-divider"> - </span><span class="bookmark-label"></span></p>';
      default:
        return '<p class="caption"></p>';
    }
  },
  renderTabs: function (offset) {
    var tabs = Tabs.getAllTabs();
    var lastFocus = 0;
    this._clearContainer(this.tabsContainer);
    for (var id in tabs) {
      if (tabs.hasOwnProperty(id)) {
        this.tabsContainer.appendChild(this._getThumb(tabs[id].getTitle(), {
          'class'  : 'tab' + (tabs[id] == Tabs.getActiveTab() ? ' opened' : '') + (tabs[id].isPrivate() ? ' private': ''),
          'data-id': id,
          'data-last-focus': lastFocus++,
          'tabindex': 1
        }, {'type': 'tab', 'private': tabs[id].isPrivate(), 'tag': 'img'}));

        if (SETTINGS.SHOW_THUMBNAILS_IN_TABS) {
          NativeApi.createThumbnail(+id, SETTINGS.THUMBNAIL_WIDTH, SETTINGS.THUMBNAIL_HEIGHT, Tabs.updateTabThumbnail);
        }
      }
    }
    if (offset) { this._insertAnimationTab(offset); }
    this.tabsContainer.appendChild(this._getThumb(i18n("New Tab"), {'class': 'new_tab', 'data-last-focus': 100, 'tabindex': 1}));
    this.tabsContainer.appendChild(this._getThumb(i18n("Close Current Tab"), {'class': 'close_tab', 'data-last-focus': 101, 'tabindex': 1}));
    var select = this.tabsContainer.querySelector('.tab[data-id="'+ Tabs.getActiveTabId() +'"]');
    if (select) {
      KeyboardHandler.setFocus(select);
    } else {
      KeyboardHandler.setFocus(this.tabsContainer.firstChild);
    }
    if (offset) { this._startAnimationTab(); }
  },
  renderBookmarks: function (index) {
    var bookmarks = Bookmarks.getList();
    this._clearContainer(this.bookmarksContainer);
    for (var i = 0; i < bookmarks.length; i++) {
      this.bookmarksContainer.appendChild(this._getThumb(Bookmarks.getEntry(i).title, {
        'class': 'bookmark',
        'data-id': i,
        'data-url': Bookmarks.getEntry(i).url,
        'tabindex': 1
      }, {'type': 'bookmark', 'tag': 'img'}));
    }
    this.bookmarksContainer.appendChild(this._getThumb(i18n("Add to Bookmarks"), {'class': 'add_bookmark', 'tabindex': 1}));
    this.bookmarksContainer.appendChild(this._getThumb(i18n("Edit Bookmarks"), {'class': 'edit_bookmarks', 'tabindex': 1}));
    this.bookmarksContainer.appendChild(this._getThumb(i18n("Done"), {'class': 'done_bookmarks hide'}));
    if (this._editing) { this._editingBookmarks(true); }

    this.checkNoMoreBookmarks();

    if (index) {
      KeyboardHandler.setFocus(this.bookmarksContainer.querySelector('.bookmark[data-id="' + index + '"'));
    } else {
      KeyboardHandler.setFocus(this.bookmarksContainer.firstChild);
    }
  },
  checkNoMoreBookmarks: function () {
    if (document.querySelectorAll("li.bookmark").length == 0) {
      var el = document.querySelector(".edit_bookmarks");
      if (el) { KeyboardHandler.disableButton(el); }
    }
  },
  renderHistory: function () {
    NativeApi.getHistory(function (result) {
      if (result[1] != 0) {
        new Notification(i18n("Could not load history from memory"));
        return;
      }
      this._clearContainer(this.historyContainer);
      var history = result[0];
      var uniqueHistory = {}, uniqueHistoryArray = [];
      for (var i = history.length - 1; i>=0; i--) {
        var entry = history[i];
        if (!uniqueHistory[entry.url]) {
          uniqueHistory[entry.url] = true;
          uniqueHistoryArray.push(entry);
        }
      }

      for (var el = 0; el < uniqueHistoryArray.length; el++) {
        this.historyContainer.appendChild(this._getThumb(uniqueHistoryArray[el].title, {
          'class': 'history_item',
          'data-url': uniqueHistoryArray[el].url,
          'tabindex': 1
        }, {'tag': 'img'}));
      }
      this.historyContainer.appendChild(this._getThumb(i18n("Clear History"), {'class': 'clear_history', 'tabindex': 1}));
      KeyboardHandler.setFocus(this.historyContainer.firstChild);
    }.bind(this));
  },
  setState: function(state){
    this._state = state;
  },
  setEditingState: function(state){
    var caption = document.getElementById("sections_caption");
    var done_bookmarks = this.elementsContainer.querySelector(".done_bookmarks");
    if (done_bookmarks) {
      KeyboardHandler.enableButton(done_bookmarks);
    }
    if (state){
      if (done_bookmarks) {
        KeyboardHandler.disableButton(done_bookmarks);
      }
      this._movingID = document.querySelector(".bookmark.focus").getAttribute("data-id");
      caption.innerText = i18n("Select a new location for the bookmark");
      this.elementsContainer.classList.remove('wrap');
    } else {
      caption.innerText = i18n("Select a bookmark to edit");
      this.elementsContainer.classList.add('wrap');
    }

    this._editingState = state;
  },
  getState: function(){
    return this._state;
  },
  hideOldContainer: function(){
    var old = this.elementsContainer.firstChild;
    if (old) {
      document.getElementById("hidden-elements").appendChild(old);
    }
  },
  clearMarqueesOnElementsContainer: function(){
    var elements = this.elementsContainer.querySelectorAll(".marquee-animate");
    for (var i = elements.length-1; i>=0; i--) {
      elements[i].setAttribute("style", "");
      elements[i].classList.remove("marquee-animate");
    }
  },
  showTabs: function(stillEditing){
    if (this._state == "tabs") { return; }
    this._editing = stillEditing;
    this.setState("tabs");
    this.hideOldContainer();
    this.elementsContainer.appendChild(this.tabsContainer);
    this.clearMarqueesOnElementsContainer();
  },
  showHistory: function(){
    if (this._state == "history") { return; }
    this.setState("history");
    this.hideOldContainer();
    this.elementsContainer.appendChild(this.historyContainer);
    this.clearMarqueesOnElementsContainer();
  },
  showBookmarks: function(stillEditing){
    if (this._state == "bookmarks") { return; }
    this._editing = stillEditing;
    this.setState("bookmarks");
    this.hideOldContainer();
    this.elementsContainer.appendChild(this.bookmarksContainer);
    this.clearMarqueesOnElementsContainer();
  },
  queueForShowingThumbnails: function(){
    var el, url;
    if (Date.now() - this._queueMutex > 10000) { this._queueMutex = false; } // Make sure that mutex is cleared so it won't stuck in some edge case
    if (this._queueMutex) { return; }
    if (Menu.checkClass("show")) {
      var currentSection = this.getState();
      if (currentSection == "bookmarks" && SETTINGS.SHOW_THUMBNAILS_IN_BOOKMARKS) {
        el = this.elementsContainer.querySelector(".bookmark:not(.thumbnail-handled)");
        if (el) {
          url = el.getAttribute("data-url");
          console.log("Loading Thumbnail for: " + url);
          el.classList.add("thumbnail-handled");
          this._queueMutex = Date.now();
          NativeApi.createThumbnailForUrl(url, SETTINGS.THUMBNAIL_WIDTH, SETTINGS.THUMBNAIL_HEIGHT, Bookmarks.updateBookmarksThumbnail);
        }
      }
    }

    if (SpeedDial.el.classList.contains("show") && SETTINGS.SHOW_THUMBNAILS_IN_SPEED_DIAL) {
      el = document.querySelector(".speed-dial-entry:not(.thumbnail-handled)");
      if (el) {
        var size = SpeedDial.thumbnailSize();
        url = el.getAttribute("data-url");
        console.log("Loading Thumbnail for: " + url);
        el.classList.add("thumbnail-handled");
        this._queueMutex = Date.now();
        NativeApi.createThumbnailForUrl(url, size[0], size[1], SpeedDial.updateSpeedDialThumbnail.bind(el));
      }
    }
  },
  unblockThumbnailMutex: function(){
    this._queueMutex = false;
    this.queueForShowingThumbnails(); // When image was loaded, call the function immediately to speedup getting images from cache
  },
  removeTab: function() {
    if (Tabs.getLength() > 1) {
      if (Tabs.getActiveTab().isPrivate()) {
        Popups.open("close-private-tab");
      } else {
        NativeApi.removeTab(Tabs.getActiveTabId());
      }
    }
  }
};

/**
 * Singleton Loading holder
 */
var LoadingBar = {
  init: function () {
    this.el = document.getElementById("progress");
  },
  progress: function (e) {
    NativeApi.show(); // Make sure we got progress visible during loading
    if (e.progress && e.progress>-1) {
      LoadingBar.el.style.transform = "scale(" + (Math.max(0,Math.min(1,+e.progress))) + ",1)";
    }
    if (e.progress == 1) {
      setTimeout(LoadingBar.hide, 700);
    }
  },
  show: function () {
    NativeApi.gainFocus();
    LoadingBar.el.classList.add("show");
    if (MouseHandler.y < 90) { // URL bar height
      NativeApi.moveCursor(MouseHandler.x, SETTINGS.VIRTUAL_MOUSE_SCROLL_WHEN_LESS_THAN_WHILE_LOADING);
    }
    Menu.container.classList.add("loading");
    Menu.reloadStopButton.classList.add("stop");
  },
  hide: function () {
    LoadingBar.el.style.transform = "scale(0,0)";
    LoadingBar.el.classList.remove("show");
    Menu.container.classList.remove("loading");
    Menu.reloadStopButton.classList.remove("stop");
    NativeApi.blurFocus();
  },
  isShown: function () {
    return LoadingBar.el.classList.contains("show");
  }
};

var Bookmarks = {
  _list: [],
  init: function(){
    this.container = document.querySelector(".speeddials");
    NativeApi.getAllBookmarks(this.onGetAllBookmarks.bind(this));
  },
  getList: function(){
    return this._list;
  },
  getEntry: function(i){
    return this._list[i];
  },
  add: function(url, title) {
    NativeApi.saveBookmark(url, title, function(result){
      this.saveCallback(result, url, title);
    }.bind(this));
  },
  move: function(url, position) {
    NativeApi.moveBookmark(url, position, function(result){
      this.moveCallback(result, position);
    }.bind(this));
  },
  remove: function(url, title) {
    NativeApi.deleteBookmark(url, title, this.removeCallback.bind(this));
  },
  findItemByUrl: function(url) {
    var index = -1;
    for (var i=0;i<this._list.length; i++) {
      if (this._list[i].url == url) { index = i; }
    }
    return index;
  },
  saveCallback: function(result, url, title) {
    switch (result[1]) {
    case 0: // OK
      this._list.push({
          url: SETTINGS.BOOKMARK_URL_LIMIT == -1 ? url : url.substr(0, SETTINGS.BOOKMARK_URL_LIMIT),
          title: SETTINGS.BOOKMARK_TITLE_LIMIT == -1 ? title : title.substr(0, SETTINGS.BOOKMARK_TITLE_LIMIT)
      });
      new AlertNotification(i18n("Bookmark saved"));
      Sections.renderBookmarks(this._list.length-1);
      break;
    case 1: // could not save
    case 3: // could not load
      new AlertNotification(i18n("Could not save bookmark in memory"));
      break;
    case 2: // bookmark is on list
      new AlertNotification(i18n("Bookmark is already on the list!"));
      break;
    case 7:
      new AlertNotification(i18n("Bookmark not saved: you have reached the maximum number"));
      break;
    case 8:
      new AlertNotification(i18n("Bookmark not saved: the address is too long"));
      break;
    }
  },
  moveCallback: function(result, position) {
    switch (result[1]) {
    case 0: // OK
      var index = this.findItemByUrl(result[0]);
      if (index > -1) {
        this._list.splice(position,0,(this._list.splice(index,1))[0]);
      }
      new AlertNotification(i18n("Bookmark moved"));
      break;
    case 1: // could not save
    case 3: // could not load
    case 5: // wrong positon
      new AlertNotification(i18n("Could not modify bookmark in memory"));
      break;
    case 4: // bookmark no longer exist on list
      new AlertNotification(i18n("Bookmark not found in device memory"));
      break;
    }
    Sections.renderBookmarks(position);
  },
  removeCallback: function(result) {
    switch (result[1]) {
    case 0: // OK
      var index = this.findItemByUrl(result[0]);
      if (index > -1) {
        this._list.splice(index,1);
        var el = document.querySelector(".bookmark[data-id=\""+ index +"\"");
        if (el) {
          el.parentNode.removeChild(el);
          KeyboardHandler.setFocus(document.querySelector("#elements li[tabindex]"));
        }
      }
      if (this._list.length === 0) { Sections.editingOff() }
      new AlertNotification(i18n("Bookmark deleted"));
      break;
    case 1: // could not save
    case 3: // could not load
      new AlertNotification(i18n("Could not delete bookmark from memory"));
      break;
    case 4: // bookmark no longer exist on list
      new AlertNotification(i18n("Bookmark not found in device memory"));
      break;
    }
    Sections.renderBookmarks();
  },
  onGetAllBookmarks: function(obj){
    if (obj[1] != 3) {
      for (var i = 0; i< obj[0].length; i++) {
        this._list.push({
            title: obj[0][i].title,
            url: obj[0][i].url
        });
      }
      Sections.renderBookmarks();

    } else {
      new Notification(i18n("Could not load bookmarks file!"));
    }
  },
  updateBookmarksThumbnail: function(args){
    var el = document.querySelector(".bookmark[data-url='" + args[1] + "'] img");
    if (el) {
      el.src = args[5];
    }
    Sections.unblockThumbnailMutex();
  }
};


var SpeedDial = {
  init: function () {
    this._list = [];
    this.el = document.getElementById('speeddial');
    this._note = null;
    this.container = this.el.querySelector(".speeddials");
    this.el.addEventListener("click",this.handleButtonEvent.bind(this), false);

    this.waitForContainerSize(function () {
      var thumbnailSize = SpeedDial.thumbnailSize();
      NativeApi.changePreferences(true, thumbnailSize[0], thumbnailSize[1]);
      NativeApi.getSpeedDials(function (result) {
        if (result[1]==0) {
          this.setList(result[0]);
        } else {
          new Notification(i18n("Could not load Speed Dial entries"));
        }
        this.render();
      }.bind(this));
    }.bind(this));
  },
  // In some rare cases container might not be ready to take measurements from,
  // this method will wait for proper size
  waitForContainerSize: function (callback) {
    if (SpeedDial.container.offsetWidth > 0) {
      callback();
    } else {
      setTimeout(function () {
        SpeedDial.waitForContainerSize(callback);
      }, 100);
    }
  },
  thumbnailSize: function () {
      var width = SpeedDial.container.offsetWidth;
      var oneTileSizeWithMarginIncluded = (width/4)-10; // 10px of margins
      return [oneTileSizeWithMarginIncluded, Math.floor(oneTileSizeWithMarginIncluded*0.6)];
  },
  handleButtonEvent: function (e) {
    var focused = findParentContainingClass("focus", e.target);
    if (SpeedDial.el.classList.contains('initial-state')) {
      KeyboardHandler.setState(KeyboardHandler.states.SPEED_DIAL_PAGE_NAVIGATION);
    }
    if (!focused) { return; }
    if (focused.classList.contains("edit_speed_dial")) {
      this.enableEditing();
    } else if (focused.classList.contains("add_speed_dial")) {
      document.getElementById("add-to-speed-dial-title").value = "";
      document.getElementById("add-to-speed-dial-address").value = "";
      Popups.open("add-to-speed-dial");
    } else if (focused.classList.contains("done_speed_dial")) {
      this.disableEditing();
    } else {
      if (this._editing) {
        if (this._moving) {
          var el = document.querySelector(".speeddials .focus");
          this.move(this._list[this._movingID].url, +el.parentNode.getAttribute("data-start-index") + Array.prototype.slice.call(el.parentNode.children).indexOf(el));
          this.disableMoveState();
        } else {
          var captionElement = document.getElementById("speeddial-caption");
          var previousText = captionElement.innerText;
          captionElement.innerText = i18n("Select action");
          Popups.open("manage-speed-dial", function(){
            captionElement.innerText = previousText;
          });
        }
      } else {
        NativeApi.loadUrl(focused.getAttribute("data-url"));
      }
    }
  },
  enableEditing: function(){
    var focused = document.querySelector(".edit_speed_dial");
    focused.classList.remove("edit_speed_dial");
    focused.classList.add("done_speed_dial");
    this._editing = true;
    this.el.classList.add("show-caption");
    document.getElementById("speeddial-caption").innerText = i18n("Select a Speed Dial entry to edit");
  },
  disableEditing: function(){
    var focused = document.querySelector(".done_speed_dial");
    this._moving = false;
    if(focused) {
      focused.classList.add("edit_speed_dial");
      focused.classList.remove("done_speed_dial");
      this._editing = false;
      this.render();
    }
    this.el.classList.remove("show-caption");
  },
  getList: function(){
    return this._list;
  },
  getEntry: function(i){
    return this._list[i];
  },
  setList: function(list) {
    this._list = list;
  },
  findItemByUrl: function(url) {
    var index = -1;
    for (var i=0;i<this._list.length; i++) {
      if (this._list[i].url == url) { index = i; }
    }
    return index;
  },
  add: function(url, title) {
    NativeApi.addSpeedDial(url, title, function(res){
      this.addCallback(res, title);
    }.bind(this));
  },
  move: function(url, position) {
    NativeApi.moveSpeedDial(url, position, function(res){
      this.moveCallback(res, position);
    }.bind(this));
  },
  remove: function(url) {
    NativeApi.removeSpeedDial(url, this.removeCallback.bind(this));
  },
  edit: function(url, newUrl, newTitle) {
    var index = this.findItemByUrl(url);
    if (index > -1) {
      NativeApi.removeSpeedDial(url, function(r){
        NativeApi.addSpeedDial(newUrl, newTitle, function(r){
          NativeApi.moveSpeedDial(newUrl, index, function(r){
            this.editCallback(r, index, newUrl, newTitle);
          }.bind(this));
        }.bind(this));
      }.bind(this));
    } else {
      this.editCallback();
    }
  },
  editCallback: function(result, index, url, title) {
    if (result && result[1] === 0) {
      new AlertNotification(i18n("Speed Dial entry modified"));
      this._list[index] = {url: url, title: title};
      this.render();
    } else {
      new AlertNotification(i18n("Could not modify Speed Dial entry"));
    }
  },
  addCallback: function(result, title) {
    switch (result[1]) {
    case 0:
      this._list.push({
          url: SETTINGS.SPEEDDIAL_URL_LIMIT == -1 ? result[0] : result[0].substr(0, SETTINGS.SPEEDDIAL_URL_LIMIT),
          title: SETTINGS.SPEEDDIAL_TITLE_LIMIT == -1 ? title : title.substr(0, SETTINGS.SPEEDDIAL_TITLE_LIMIT)
      });
      this.render();
      new AlertNotification(i18n("Speed Dial entry saved"));
      break;
    case 1:
    case 3:
        new AlertNotification(i18n("Could not save Speed Dial entry"));
      break;
    case 2:
        new AlertNotification(i18n("Speed Dial with given address already exists"));
      break;
    case 7:
      new AlertNotification(i18n("Speed Dial entry not saved: you have reached the maximum number"));
      break;
    case 8:
      new AlertNotification(i18n("Speed Dial entry not saved: the address is too long"));
      break;
    }
  },
  moveCallback: function(result, position) {
    switch (result[1]) {
    case 0:
      var index = this.findItemByUrl(result[0]);
      if (index > -1) {
        this._list.splice(position,0,(this._list.splice(index,1))[0]);
      }
      new AlertNotification(i18n("Speed Dial entry moved"));
      this.render();
      break;
    case 1:
    case 3:
    case 4:
    case 5:
        new AlertNotification(i18n("Could not move Speed Dial entry"));
      break;
    }
  },
  removeCallback: function(result) {
    switch (result[1]) {
    case 0:
      var index = this.findItemByUrl(result[0]);
      if (index > -1) {
        this._list.splice(index,1);
      }
      if (this._list.length === 0) { this.disableEditing(); }
      this.render();
      new AlertNotification(i18n("Speed Dial entry deleted"));
      break;
    case 1:
    case 3:
    case 4:
        new AlertNotification(i18n("Could not delete Speed Dial entry"));
      break;
    }
  },
  render: function(){
    var lastIndex = 0, selectableLiArray;
    if (this.container.innerHTML) {
      var currentFocus = this.container.querySelector(".focus");
      selectableLiArray = Array.prototype.slice.call(this.container.querySelectorAll("li")||[]);
      lastIndex = selectableLiArray.indexOf(currentFocus);
    }
    this.container.innerHTML = "";
    this.container.style.transform = "translate3d(0,0,0)";
    var ul, li;
    var list = this._list.concat({edit: true}, { add: true} );

    for (var i = 0; i< list.length; i++) {
      if (i % 8 == 0) {
        ul = this.container.appendChild(document.createElement("ul"));
        ul.setAttribute("data-start-index", i);
        ul.setAttribute("role", "grid");
        ul.setAttribute("aria-label", i18n("Speed Dial"));
      }
      li = ul.appendChild(document.createElement("li"));
      li.setAttribute("tabindex", "1");
      li.setAttribute("data-focus-group", "speeddial");
      if (list[i].url) {
        li.setAttribute("data-url", list[i].url);
        li.setAttribute("data-title", list[i].title);
        li.setAttribute("data-id", i);
        li.classList.add("speed-dial-entry");
        li.innerHTML = '<img alt=""><p class="caption"></p>';
        li.querySelector(".caption").innerText = list[i].title;
      } else {
        if (list[i].edit) {
          li.className = "edit_speed_dial";
          li.innerHTML = '<p class="caption edit">' + i18n("Edit Speed Dial") +  '</p><p class="caption done">' + i18n("Done") + '</p>';
          if (this._editing) {
            li.className = "done_speed_dial";
          }
        }
        if (list[i].add) {
          li.className = "add_speed_dial";
          li.innerHTML = '<p class="caption">' + i18n("Add to Speed Dial") + '</p>';
        }
      }
    }
    selectableLiArray = Array.prototype.slice.call(this.container.querySelectorAll("li")||[]);
    KeyboardHandler.setFocus(selectableLiArray[lastIndex], null, "speeddial");
  },
  updateSpeedDialThumbnail: function(args){
    if (this) { this.querySelector("img").src = args[5]; }
    Sections.unblockThumbnailMutex();
  },
  show: function () {
    this.el.classList.add("show");
  },
  hide: function () {
    this.el.classList.remove("show");
    this.blur();
  },
  focus: function () {
    if (this.el.classList.contains("active")) return; // we don't want to double message

    this.el.classList.add("active");
    this.el.classList.remove("initial-state");
    if (!SETTINGS.GUI_STICKY_MENU) {
      this._note = new Notification(i18n("Move <b>Up</b> to access the address bar"), { level : Notification.levels.LOW });
    }
  },
  blur: function () {
    this.el.classList.remove("active");
    if (!SETTINGS.GUI_STICKY_MENU) { this.el.classList.add("initial-state"); }
    if (this._note) {
      this._note.hide();
      this._note = null;
    }
  },
  enableMoveState: function(){
    this._moving = true;
    this._movingID = document.querySelector(".speeddials .focus").getAttribute("data-id");
    document.getElementById("speeddial-caption").innerText = i18n("Move Speed Dial entry");
  },
  disableMoveState: function(){
    this._moving = false;
    document.getElementById("speeddial-caption").innerText = i18n("Select a Speed Dial entry to edit");
  },
  isInMoveState: function(){
    return this._moving && this._editing;
  },
  isInEditState: function(){
    return this._editing;
  }
};


var TextOverflow = {
  direction: "left",
  current: null,
  note: null,

  init: function () {
    this.direction = i18n.isRTL ? "right" : "left";
  },
  check : function (el) {
    if (!el || this.current != el) { // focused element changed
      this.current = null;
      this.removeNote();
      if(!el) return;
    }
    this.current = el;
    // marquee animation
    if (!el.classList.contains("marquee-animate") && el.scrollWidth - el.offsetWidth > 1) {
      this.add(el);
    }
    // footer notification (only visible if accessibility mode on or text size is bigger than standard)
    if (el.classList.contains("marquee-animate") && !this.note && (SETTINGS.ACCESSIBILITY_MODE || SETTINGS.GUI_TEXT_SIZE > 1)) {
      var content = el.querySelector('*') ? el.lastElementChild.innerText : el.innerText;
      this.note = new Notification(content, { type: Notification.types.STICKY, level: Notification.levels.LOW });
    }
  },
  _animateEvt: function (e) {
    if (e.propertyName != TextOverflow.direction) { return; } // events filtering
    if (this.style[TextOverflow.direction] != "") { // descending
      setTimeout(function () {
        this.style[TextOverflow.direction] = "";
        this.style.width = "";
      }.bind(this), 1000);
    } else if (!findParentContainingClass('focus', this) || !findParentContainingClass('active', this)) { // lost focus, remove
      TextOverflow.remove(this);
    } else { // ascending
      setTimeout(function () {
        if(findParentContainingClass('focus', this) && findParentContainingClass('active', this)) { // if still has focus
          var scrollLength = this.scrollWidth - this.offsetWidth + 5;
          this.style.webkitTransitionDuration = scrollLength * SETTINGS.GUI_TEXT_SCROLL_FACTOR + "s";
          this.style[TextOverflow.direction] = -scrollLength + "px";
          this.style.width = this.scrollWidth + 5 + "px";
        } else {
          TextOverflow.remove(this);
        }
      }.bind(this), 1500);
    }
  },
  add: function (el) {
    el.classList.add("marquee-animate");
    el.addEventListener("webkitTransitionEnd", this._animateEvt, false);

    var evt = document.createEvent('Event');
    evt.initEvent("webkitTransitionEnd", true, true);
    evt.propertyName = this.direction;
    el.dispatchEvent(evt);
  },
  remove: function (el) {
    if (!el) { return; }
    el.removeEventListener("webkitTransitionEnd", this._animateEvt, false);
    el.classList.remove('marquee-animate');
    el = null;
    if(!this.current) {
      this.removeNote();
    }
  },
  removeNote: function () {
    if(this.note) { this.note.hide(); }
    this.note = null;
  }
};


var Notification = function (text, options) {
  this.level = (options && typeof options.level !== "undefined") ? options.level : Notification.levels.NORMAL;
  this.type = (options && options.type) ? options.type : Notification.types.STACKING;
  this.makeNotification(text);

  if (this.type == Notification.types.STICKY || Notification.stack.length == 0) {
    this.show();
  }
  if(this.type == Notification.types.STACKING) {
    Notification.stack.push(this);
  }
};
Notification.stack = [];
Notification.levels = {
  LOW   : 0, // do not read
  NORMAL: 1,
  HIGH  : 2
};
Notification.types = {
  STACKING: 0, // showed one after another
  STICKY  : 1  // showed instantly every notification (no auto close)
};
Notification.prototype = {
  makeNotification: function(text){
    var sticky = document.querySelector(".notifications .sticky");
    if (sticky) {
      this.el = document.querySelector(".notifications").insertBefore(document.createElement("div"), sticky);
    } else {
      this.el = document.querySelector(".notifications").appendChild(document.createElement("div"));
    }
    switch (this.level) {
      case Notification.levels.NORMAL:
        this.el.setAttribute('role', 'status');
        break;
      case Notification.levels.HIGH:
        this.el.setAttribute('role', 'alert');
        break;
    }
    this.el.innerHTML = text;
  },
  show: function() {
    NativeApi.gainFocus();
    setTimeout(function() {
      this.el.classList.add("show");
    }.bind(this), 10);
    if (this.type == Notification.types.STACKING) {
      setTimeout(function () {
        this.hide();
      }.bind(this), SETTINGS.NOTIFICATION_DISPLAY_DURATION);
    }
  },
  hide: function() {
    if(!this.el) { return; }
    this.el.classList.remove("show");
    setTimeout(function(){
      if(!this.el) { return; } // removing might be queued, so double checking
      NativeApi.blurFocus();
      this.el.parentNode.removeChild(this.el);
      this.el = null;
      if(this.type == Notification.types.STACKING) {
        Notification.stack.shift();
        if (Notification.stack.length > 0) {
          Notification.stack[0].show();
        } else {
          NativeApi.blurFocus();
        }
      }
    }.bind(this), 500);
  }
};


var AlertNotification = function (text, options) {
  options = options ? options : {};
  options.level = Notification.levels.HIGH;
  Notification.apply(this, [text, options]);
};
AlertNotification.prototype = Object.create(Notification.prototype);


var NativeApi = {
  init: function(){
    sendCommand("addEventListener", 'loadingstarted', 'NativeApi.eventUrlChanged');
    sendCommand("addEventListener", 'loadurl', 'NativeApi.eventLoadingFinished');
    sendCommand("addEventListener", 'historychanged', 'NativeApi.eventAddHistory');
    sendCommand("addEventListener", 'tabadded', 'NativeApi.eventAddedTab');
    sendCommand("addEventListener", 'privatetabadded', 'NativeApi.eventAddedPrivateTab');
    sendCommand("addEventListener", 'loadingprogress', 'LoadingBar.progress');
    sendCommand("addEventListener", 'tabactivated', 'NativeApi.eventTabActivated');
    sendCommand("addEventListener", 'tabremoved', 'NativeApi.eventTabRemoved');
    sendCommand("addEventListener", 'sslstatechanged', 'NativeApi.eventSslStateChanged');
    sendCommand("addEventListener", 'dialogshow', 'NativeApi.eventDialogShow');
    sendCommand("addEventListener", 'topmarginreached', 'NativeApi.eventTopMarginReached');
    sendCommand("addEventListener", 'titleupdated', 'NativeApi.eventTitleUpdated');
    sendCommand("addEventListener", 'authenticationdialogshow', 'NativeApi.eventAuthenticationDialog');
    sendCommand("addEventListener", 'tablimitreached', 'NativeApi.eventTabLimitReached');
    sendCommand("addEventListener", 'zoomchanged', 'NativeApi.eventZoomChanged');
    sendCommand("addEventListener", 'virtualcursorkeypress', 'NativeApi.eventVirtualCursorKeyPress');
  },
  eventAddHistory: function(e) {
    LOG("eventHistoryChanged",e);
    if (e.url && !isCustomErrorPages(e.url)) {
      Application.onNewEntry(e.url, e.history_index, e.history_size, e.tab_id);
      Tabs.updateTabUrl(e.tab_id, e.url);
    }
  },
  eventUrlChanged: function(e) {
    LOG("eventLoadingStarted",e);
    if (e.url) {
      LoadingBar.show();
      Application.updateUrl(e.url, e.tab_id);
      Tabs.updateTabUrl(e.tab_id, e.url);
    }
  },
  eventLoadingFinished: function(e) {
    LOG("eventLoadingFinished", e);
    NativeApi.getZoom(e.tab_id, function(res){
      console.log("Setting Page Zoom Level to: " + res[0]);
      Tabs.getTab(e.tab_id).setZoom(res[0]);
    });
    NativeApi.getTabTitle(function(i) {
      Tabs.updateTabTitle(+e.tab_id, i[0]);
    }, +e.tab_id);
    if (SETTINGS.SHOW_THUMBNAILS_IN_TABS) {
      NativeApi.createThumbnail(e.tab_id, SETTINGS.THUMBNAIL_WIDTH, SETTINGS.THUMBNAIL_HEIGHT, Tabs.updateTabThumbnail);
    }
  },
  eventAddedTab: function(e) {
    LOG("eventAddedTab",e);
    Tabs.addTab(e.id);
    Application.updateButtons();
  },
  eventAddedPrivateTab: function(e) {
    LOG("eventAddedPrivateTab",e);
    Tabs.addTab(e.id, "", true);
    Application.updateButtons();
  },
  eventTabActivated: function(e){
    LOG("eventTabActivated",e);
    LoadingBar.hide();
    Tabs.setActiveTab(e.id);
    Application.updateUrl(Tabs.getTab(e.id).getUrl(), e.id);
    var newFocus = Sections.tabsContainer.querySelector(".tab[data-id=\""+ Tabs.getActiveTabId() +"\"]");
    KeyboardHandler.setFocus(newFocus, Sections.tabsContainer.querySelector(".focus"), "elements");
  },
  eventTabRemoved: function(e){
    LOG("eventTabRemoved",e);
    Tabs.removeTab(e.id);
    Sections.renderTabs(-1);
    Application.updateButtons();
  },
  eventSslStateChanged: function(e){
    LOG("eventSslStateChanged", e);
    Application.updateSecurity(+e.state, +e.is_ev_ssl, +e.tab_id);
  },
  eventDialogShow: function(e) {
    switch (e.type) {
    case 0:
      Popups.showAlertPopup(e.message, e.tab_id);
      break;
    case 1:
      Popups.showConfirmPopup(e.message, e.tab_id);
      break;
    case 2:
      Popups.showPromptPopup(e.message, e.default_prompt, e.tab_id);
      break;
    }
  },
  eventTopMarginReached: function() {
    if (!KeyboardHandler.isUserInteractingWithKeyboard() && KeyboardHandler.getState() !== KeyboardHandler.states.POPUP_NAVIGATION) {
      KeyboardHandler.setState(KeyboardHandler.states.MENU_NAVIGATION);
    }
  },
  eventTitleUpdated: function(e) {
    Tabs.updateTabTitle(+e.tab_id, e.title);
  },
  eventAuthenticationDialog: function(e) {
    Popups.showAuthenticationDialog(e.tab_id);
  },
  eventTabLimitReached: function(e) {
    new AlertNotification(i18n("You cannot open additional tabs"));
  },
  eventVirtualCursorKeyPress: function(e) {
    MouseHandler.updateCursorPosition(e.cursor_x, e.cursor_y);
    KeyboardHandler.userInteractedWithKeyboard();
    KeyboardHandler.handleKeyVirtualMouse(e.key_code, e.is_longpress, e.top_of_page);
  },
  authenticationReceived: function(tab_id, okPressed, login, password){
    sendCommand("authenticationReceived", +tab_id, okPressed, login, password);
  },
  eventZoomChanged: function(e) {
    LOG("Zoom changed: ", e);
    new Notification(i18n("100% Zoom").replace(i18n.convertNumber(100), i18n.convertNumber(Math.round(e.factor * 100))));
    Tabs.getTab(e.tab_id).setZoom(e.factor);
  },
  addTab: function(url){
    sendCommand("addTab", url);
  },
  addPrivateTab: function(url) {
    sendCommand("addPrivateTab", url);
  },
  removeTab: function(id){
    sendCommand("removeTab", +id);
  },
  activateTab: function(id){
    sendCommand("activateTab", +id);
  },
  loadUrl: function(url) {
    if (url) {
      sendCommand("loadUrl", url);
    }
  },
  scrollBy: function(dx, dy) {
    sendCommand("scrollBy", dx, dy);
  },
  mouseClick: function(x, y, button) {
    sendCommand("mouseClick", x, y, button);
  },
  moveCursor: function(x,y) {
    var viewSize = Application.getWindowSize();
    sendCommand("moveCursor", Math.min(Math.max(0, x), viewSize.width), Math.min(Math.max(0,y), viewSize.height));
  },
  showMouseCursor: function() {
//  sendCommand("showMouseCursor");
  },
  hideMouseCursor: function() {
    sendCommand("hideMouseCursor");
  },
  setAccessibility: function (mode) {
    sendCommand("setAccessibilityMode", mode);
  },
  setStickyMenu: function (mode) {
    sendCommand("setStickyMenu", mode);
  },
  setZoom: function(zoomlevel) {
    sendCommand("zoom", zoomlevel);
  },
  getZoom: function(tab_id, callback) {
    sendCommand("getZoomFactor", tab_id, makeCallback(callback));
  },
  historyMove: function(direction) {
    sendCommand("historyMove", direction);
  },
  reload: function() {
    sendCommand("reload");
  },
  stopLoad: function() {
    sendCommand("stopLoad");
  },
  gainFocus: function(){
    if (!this.UIFocused) {
      sendCommand("focus");
      this.UIFocused = true;
      this.show();
    }
  },
  blurFocus: function () {
    // Blur only for VIRTUAL_MOUSE_NAVIGATION
    if (KeyboardHandler.states.VIRTUAL_MOUSE_NAVIGATION === KeyboardHandler.getState()
        && Notification.stack.length == 0
        && !LoadingBar.isShown()
    ) {
      this.UIVisible = false;
      this.UIFocused = false;
      sendCommand("blur");
    }
  },
  show: function(){
    if (!this.UIVisible) {
      sendCommand("show");
      this.UIVisible = true;
    }
  },
  getWindowSize: function(callback){
    sendCommand("getWindowSize", makeCallback(callback));
  },
  getTabTitle: function(callback, id) {
    sendCommand("getTabTitle", makeCallback(callback), id);
  },
  getCertificateInfo: function(callback, id) {
    sendCommand("getCertificateInfo", makeCallback(callback), id);
  },
  isVirtualKeyboardVisible: function(callback) {
    sendCommand("isVirtualKeyboardVisible", makeCallback(callback));
  },
  createThumbnail: function(id, width, height, callback) {
    sendCommand("createThumbnail", id, width, height, makeCallback(callback));
  },
  createThumbnailForUrl: function(url, width, height, callback) {
    sendCommand("createThumbnailForUrl", url, width, height, makeCallback(callback));
  },
  saveBookmark: function(url, title, callback){
    sendCommand("saveBookmark", url, title, makeCallback(callback));
  },
  moveBookmark: function(url, position, callback){
    sendCommand("moveBookmark", url, position, makeCallback(callback));
  },
  deleteBookmark: function(url, title, callback){
    sendCommand("deleteBookmark", url, title, makeCallback(callback));
  },
  getAllBookmarks: function(callback){
    sendCommand("getAllBookmarks", makeCallback(callback));
  },
  getHistory: function(callback){
    sendCommand("getHistory", makeCallback(callback));
  },
  clearHistory: function(callback){
    sendCommand("clearHistory", makeCallback(callback));
  },
  getSpeedDials: function(callback){
    sendCommand("getSpeedDials", makeCallback(callback));
  },
  addSpeedDial: function(url, title, callback){
    sendCommand("addSpeedDial", url, title, makeCallback(callback));
  },
  moveSpeedDial: function(url, position, callback){
    sendCommand("moveSpeedDial", url, position, makeCallback(callback));
  },
  removeSpeedDial: function(url, callback){
    sendCommand("removeSpeedDial", url, makeCallback(callback));
  },
  dialogClosed: function(id, success, user_input) {
    sendCommand("dialogclosed", id, success||false, user_input||"");
  },
  getSettings: function(callback){
    sendCommand("getSettings", makeCallback(callback));
  },
  getHighlightedUrl: function(callback){
    sendCommand("getHighlightedUrl", makeCallback(callback));
  },
  changePreferences: function(enable_cookies, speeddial_width, speeddial_height) {
      sendCommand("changePreferences", enable_cookies, speeddial_width, speeddial_height);
  },
  isFeatureEnabled: function(name, callback) {
    sendCommand("isFeatureEnabled", name, makeCallback(callback));
  },
  loadTvApp:function(url){
  	// open the app by url
  	//TODO
  	  	
  }
};

function changeUrl(url) {
  NativeApi.loadUrl(url);
}

function LOG(message, e) {
  console.log(message + ": "+ JSON.stringify(e));
}

function findParentContainingClass(whatClass, whatElement) {
  while (whatElement && whatElement.classList && whatElement.parentNode && !whatElement.classList.contains(whatClass)) {
    whatElement = whatElement.parentNode;
  }
  return (whatElement.classList && whatElement.classList.contains(whatClass)) ? whatElement : null;

}

function isCustomErrorPages(url) {
  var n = url.indexOf('?');
  var current_url = url.substring(0, n == -1 ? url.length : n).toLowerCase();
  if (!(SETTINGS.CUSTOM_ERROR_PAGES && SETTINGS.CUSTOM_ERROR_PAGES.length)) { return false; }
  for (var i = 0; i < SETTINGS.CUSTOM_ERROR_PAGES.length; i++) {
    if (current_url == SETTINGS.CUSTOM_ERROR_PAGES[i].toLowerCase()) {
      return true;
    }
  }
  return false;
}

var TTSHelper = {
  ready: function () {
    return (typeof (cvox) !== 'undefined') && cvox && cvox.Api.isChromeVoxActive();
  },
  focus: function () {
    if (!this.ready()) return;

    var current = document.querySelector('.active .focus');
    current.focus();
    if (current.nodeName == "INPUT" && current.type != "range") {
      current.blur();
    }
  },
  speak: function (content) {
    if (!this.ready()) return;
    switch (content.nodeType) {
      case Node.TEXT_NODE:
        cvox.Api.speak(content);
        break;
      case Node.ELEMENT_NODE:
        cvox.Api.speakNode(content);
        break;
    }
    console.log('SPEAK ' + content);
  }
};

var MouseHandler = {
  x: 0,
  y: 0,

  updateCursorPosition: function (x, y) {
    this.x = x;
    this.y = y;
  },

  init: function () {
    var self = this;

    Application.getWindowSize(function (viewSize) {
      self.x = viewSize.width/2|0;
      self.y = viewSize.height/2|0;
      NativeApi.moveCursor(self.x, self.y);
      NativeApi.hideMouseCursor();
    });

    window.addEventListener("mousemove", function (e) {
      self.updateCursorPosition(e.screenX, e.screenY);
    }, true);

    window.addEventListener("click", function (e) {
      self.updateCursorPosition(e.screenX, e.screenY);
      var clickedSpeeddial = findParentContainingClass("speeddial", e.target);
      var state = KeyboardHandler.getState();
      if (e.target == document.body || clickedSpeeddial) {
        if (!clickedSpeeddial && state === KeyboardHandler.states.VIRTUAL_MOUSE_NAVIGATION) {
          NativeApi.mouseClick(e.x, e.y, 0);
          e.preventDefault();
        }
        if (state === KeyboardHandler.states.MENU_NAVIGATION) {
          if (clickedSpeeddial) {
            KeyboardHandler.setState(KeyboardHandler.states.SPEED_DIAL_PAGE_NAVIGATION);
          } else {
            KeyboardHandler.setState(KeyboardHandler.states.VIRTUAL_MOUSE_NAVIGATION);
          }
        }
      } else {
        e.target.classList.add("clicked");
        setTimeout(function () {
          e.target.classList.remove("clicked");
        }, SETTINGS.PRESSED_STATE_DURATION);
      }

      if (e.target.nodeName === "A") {
        e.preventDefault();
        Popups.closeAll();
        NativeApi.loadUrl(e.target.getAttribute("href"));
      }
    }, false);

    window.addEventListener("mouseover", function (e) {
      self.updateCursorPosition(e.screenX, e.screenY);
      if (KeyboardHandler.isUserInteractingWithKeyboard()) { return; }
      var element = e.target;
      if (!element.hasAttribute("tabindex") && element.parentNode) { element = element.parentNode; }
      if (element.hasAttribute("tabindex")) {
        var oldFocus = document.querySelector(".active .focus");
        var active = document.querySelector(".active");
        // Sections navigation
        var rootNode = findParentContainingClass("line", element);
        if (rootNode && !rootNode.classList.contains("active")) {
          if (active) { active.classList.remove("active"); }
          rootNode.classList.add("active");
          oldFocus = document.querySelector(".active .focus");
          KeyboardHandler.setTemporaryState(KeyboardHandler.states.MENU_NAVIGATION);
        }
        // Speeddial navigation
        var focusGroup = element.getAttribute("data-focus-group");
        if (focusGroup && !SpeedDial.el.classList.contains("active")) {
          if (active) { active.classList.remove("active"); }
          SpeedDial.el.classList.add('active');
          oldFocus = document.querySelector("#speeddial .focus");
          KeyboardHandler.setTemporaryState(KeyboardHandler.states.SPEED_DIAL_PAGE_NAVIGATION);
        }
        KeyboardHandler.setFocus(element, oldFocus);
        TextOverflow.check(document.querySelector('.active .focus .caption'));
      }
    }, false);
  }
};


function sendCommand(cmd, args) {
  if (window.chrome) {
    args = Array.prototype.slice.call(arguments, 1);
    chrome.send(cmd, args);
  }
}

function makeCallback(callback){
  var funcName = "func"+Date.now()+((Math.random()*100)|0);

  window[funcName] = function(){
    callback(arguments);
    setTimeout(function(){
      window[funcName] = null;
      delete window[funcName];
    },1);
  };
  return funcName;
}

// FOR DEBUG ON DESKTOP
// FOR DEBUG ON DESKTOP
if (NON_INTEGRATED) {
  window.chrome = window.chrome || {};
  chrome.send = function(func){
    window[arguments[1]] && window[arguments[1]](0,0);
    console.log("Called: " + JSON.stringify(arguments));
  };

  NativeApi.getTabTitle = function(c) {
    c(["",""]);
  };
  NativeApi.isVirtualKeyboardVisible = function(c) {
    c([false]);
  };
  NativeApi.getWindowSize = function(c) {
    c([document.body.offsetWidth, document.body.offsetHeight]);
  };
  NativeApi.getHistory = function(c) {
    c([[{url: "http://onet.pl", title: "Onet"}],0]);
  };
  NativeApi.getAllBookmarks =
  NativeApi.getSpeedDials = function(c) {
    c([
        [
        { url: "Test Url1", title: "Super very long Test Url1"},
        { url: "Test Url1", title: "Even longer Url title ideal for Marquee tests"},
        { url: "Test Url1", title: "Lorizzle ipsizzle dolizzle sit amizzle, consectetuer adipiscing yo mamma"},
        { url: "Test Url1", title: "TestUrl1"}
        ],0
    ]);
  };
  NativeApi.getHighlightedUrl = function(c) {
    c([""]);
  }
}

window.onload = function () {
  i18n.init();
  KeyboardHandler.init();
  Menu.init(); // after KeyboardHandler & Tabs, inits LoadingBar, Sections & Bookmarks
  SpeedDial.init();
  Popups.init();
  NativeApi.init();
  Application.init(); // after NativeApi & Menu
  MouseHandler.init(); // after Application & NativeApi
  TextOverflow.init();

  // FOR DEBUG ON DESKTOP
  if (NON_INTEGRATED) {
    Tabs.addTab(1, Tabs.urls.SPEED_DIAL);
    Tabs.getTab(1).setSecureState(0);
    Tabs.addTab(2, Tabs.urls.PRIVATE, true);
    Tabs.getTab(2).setSecureState(0);
    Tabs.setActiveTab(1);
    Application.updateButtons();
//    Application.updateSecurity(0, false, 2);
//    NativeApi.eventTabActivated({id: 2});
    KeyboardHandler.setState(KeyboardHandler.states.SPEED_DIAL_PAGE_NAVIGATION);
    Sections.renderHistory();
  }
};

// TRANSLATIONS FOR LATER USE
if (false) {
    i18n("Select action");
    i18n("Speed Dial Error");
    i18n("Move down to hide address bar");
    i18n("Back");
    i18n("Forward");
    i18n("Reload");
    i18n("Stop");
    i18n("Speed Dial");
    i18n("Menu");
    i18n("Add Link to Speed Dial");
    i18n("Add Link to bookmarks");
    i18n("Webpage address is too long. Please reduce the length of the address.");
    i18n("Change Zoom in Menu > Settings");
    i18n("JavaScript Enabled");
    i18n("JavaScript Disabled");
    i18n("A script on this page is slowing down the browser. Do you want to disable JavaScript for this page?");
    i18n("Cookies Enabled");
    i18n("Cookies Disabled");
    i18n("Clear All Cookies");
    i18n("Restore Default Settings");
    i18n("Untrusted Connection");
    i18n("Unsecured Connection");
    i18n("Secure Connection");
    i18n("First Visited");
    i18n("Edit bookmark");
    i18n("Bookmark Error");
    i18n("Close Tab");
    i18n("Do you want to close the tab \"$title\"?");
    i18n("Show All History");
    i18n("All");
    i18n("Today");
    i18n("Yesterday");
    i18n("Last Week");
    i18n("Last Month");
    i18n("Monday");
    i18n("Tuesday");
    i18n("Wednesday");
    i18n("Thursday");
    i18n("Friday");
    i18n("Saturday");
    i18n("Sunday");
}
