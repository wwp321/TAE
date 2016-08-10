/* Copyright (C) 2014 Opera Software AS.  All rights reserved.
 *
 * This file is part of the Opera Devices SDK.
 * It includes Opera proprietary information and distribution is prohibited
 * without Opera Software's prior, explicit and written consent.
 */

#ifndef OPERA_BROWSER_UI_IME_SIMPLE_H
#define OPERA_BROWSER_UI_IME_SIMPLE_H

#include <opera/events/IMECancelled.h>
#include <opera/events/IMEStart.h>
#include <opera/events/PlatformMessage.h>

#include "overlay_window.h"

namespace opera {
namespace components {
class OperaController;
}
}

class ImeSimple {
 public:
  ImeSimple(opera::components::OperaController& opera_controller,
            opera::Handle window_id);
  virtual ~ImeSimple();

 private:
  void OnIMEStart(opera::evt::IMEStart ime_msg);
  void OnIMECancelled(opera::evt::IMECancelled ime_msg);
  void OnPlatformMessage(opera::evt::PlatformMessage platform_msg);
  void CreateUI();

  static std::string EscapeSpecialCharacters(const std::string& str);

  opera::components::OperaController& opera_controller_;
  opera::Handle window_id_;
  opera::Handle ime_origin_;

  OverlayWindow* ime_ui_;
};

#endif  // OPERA_BROWSER_UI_IME_SIMPLE_H
