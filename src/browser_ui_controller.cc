/* Copyright (C) 2014 Opera Software AS.  All rights reserved.
 *
 * This file is part of the Opera Devices SDK.
 * It includes Opera proprietary information and distribution is prohibited
 * without Opera Software's prior, explicit and written consent.
 */

#include "browser_ui_controller.h"

#include <opera/messages/DestroyWindow.h>
#include <opera/messages/GetPref.h>
#include <opera/messages/SetPref.h>
#include <opera/OperaLogging.h>

#include "ime_simple.h"

namespace {
const char kBrowserUIUrl[] = "chrome://browserui/";

bool has_ctrl_modifier(const opera::msg::KeyInput& key_input) {
  return key_input.key_modifiers & opera::msg::KeyInput::MODIFIER_CTRL;
}
}

using namespace opera;

BrowserUIController::InputInterceptor::InputInterceptor(
    components::OperaController& controller,
    Handle window_id)
    : controller_(controller),
      window_id_(window_id) {
}

bool BrowserUIController::InputInterceptor::InterceptKeyEvent(
    const msg::KeyInput& key_input) {
  if (key_input.event_type == msg::KeyInput::KEYDOWN) {
    switch (key_input.virtual_key) {
      case msg::KeyInput::OMI_KEY_POWER:
      case msg::KeyInput::OMI_KEY_F12:
        controller_.Stop();
        return true;
      case msg::KeyInput::OMI_KEY_LEFT:
        if (has_ctrl_modifier(key_input)) {
          controller_.opera().post(msg::KeyInput(msg::KeyInput::KEYDOWN,
                                                 msg::KeyInput::OMI_KEY_BACK));
          return true;
        }
        break;
      case msg::KeyInput::OMI_KEY_F10:
        if (!has_ctrl_modifier(key_input)) {
          break;
        }
        // else fall-through
      case msg::KeyInput::OMI_KEY_SUBTITLE: {
        msg::GetPref::Result get_result = controller_.opera().post(msg::GetPref(
            window_id_,
            "chromevox_enabled.override")).get();
        if (get_result.error == msg::GetPref::NO_ERR) {
          controller_.opera().post(opera::msg::SetPref(
              window_id_,
              "chromevox_enabled.override",
              get_result.value.compare("false") ? "false" : "true"));
        }
        return true;
      }
      default:
        break;
    }
  } else if (key_input.event_type == msg::KeyInput::KEYUP) {
    switch (key_input.virtual_key) {
      case msg::KeyInput::OMI_KEY_LEFT:
        if (has_ctrl_modifier(key_input)) {
          controller_.opera().post(
              msg::KeyInput(msg::KeyInput::KEYUP, msg::KeyInput::OMI_KEY_BACK));
          return true;
        }
        break;
      default:
        break;
    }
  }
  return false;
}

BrowserUIController::BrowserUIController(
    components::OperaController& opera_controller,
    components::input::InputReader* reader,
    Handle window_id,
    bool url_filter_enabled)
    : opera_controller_(opera_controller),
      window_id_(window_id),
      ime_simple_(NULL),
      url_filter_(opera_controller_),
      input_interceptor_(opera_controller_, window_id),
      input_helper_(opera_controller_.opera(), reader) {
  opera_controller_.AddEventHandler(&BrowserUIController::LoadingStarted, this);
  opera_controller_.AddEventHandler(&BrowserUIController::LoadingFinished,
                                    this);
  opera_controller_.AddEventHandler(
      &BrowserUIController::ScriptRequestCloseWindow, this);

  input_helper_.SetEventsInterceptor(&input_interceptor_);
  input_helper_.Attach(&opera_controller_);

  if (url_filter_enabled) {
    opera_controller_.opera().post(
        msg::SetPref(window_id_, "urlfilter.dynamic_enabled", "true"));
  } else {
    opera_controller_.opera().post(
        msg::SetPref(window_id_, "urlfilter.dynamic_enabled", "false"));
  }
}

void BrowserUIController::CreateSimpleImeHandler() {
  ime_simple_.reset(new ImeSimple(opera_controller_, window_id_));
}

void BrowserUIController::LoadingStarted(evt::LoadingStarted event) {
  OLOG(INFO,
       "Loading started window: %d %s",
       event.window_id,
       event.url.c_str());
}

void BrowserUIController::LoadingFinished(evt::LoadingFinished event) {
  std::string status_str;
  switch (event.status) {
    case evt::LoadingFinished::LOAD_SUCCEEDED:
      status_str = "succeeded";
      break;
    case evt::LoadingFinished::LOAD_FAILED:
      status_str = "failed";
      break;
    case evt::LoadingFinished::LOAD_ABORTED:
      status_str = "aborted";
      break;
    default:
      status_str = "other";
  }

  OLOG(INFO,
       "Loading finished (%s) window: %d %s",
       status_str.c_str(),
       event.window_id,
       event.url.c_str());
}

void BrowserUIController::ScriptRequestCloseWindow(
    evt::ScriptRequestCloseWindow event) {
  OLOG(INFO,
       "Got ScriptRequestCloseWindow window_id %d opened_by_dom %d url %s",
       event.id,
       event.opened_by_dom,
       event.url.c_str());
  if (event.url.compare(kBrowserUIUrl) == 0) {
    opera_controller_.opera().post(msg::DestroyWindow(event.id));
    OLOG(INFO, "Browser UI window destroyed!");
    opera_controller_.Stop();
  }
}

void BrowserUIController::Run() {
  input_helper_.Start();
  opera_controller_.Run();
}
