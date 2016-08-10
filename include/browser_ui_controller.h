/* Copyright (C) 2014 Opera Software AS.  All rights reserved.
 *
 * This file is part of the Opera Devices SDK.
 * It includes Opera proprietary information and distribution is prohibited
 * without Opera Software's prior, explicit and written consent.
 */

#ifndef BROWSER_UI_CONTROLLER_H
#define BROWSER_UI_CONTROLLER_H

#include <opera/components/async_input_helper.h>
#include <opera/components/input/input_reader.h>
#include <opera/events/LoadingFinished.h>
#include <opera/events/LoadingStarted.h>
#include <opera/events/ScriptRequestCloseWindow.h>

#include "ime_simple.h"
#include "url_filter.h"

#include <memory>

class BrowserUIController {
 public:
  BrowserUIController(opera::components::OperaController& opera_controller,
                      opera::components::input::InputReader* reader,
                      opera::Handle window_id,
                      bool url_filter_enabled);
  void CreateSimpleImeHandler();
  void Run();
  void LoadingStarted(opera::evt::LoadingStarted event);
  void LoadingFinished(opera::evt::LoadingFinished event);
  void ScriptRequestCloseWindow(opera::evt::ScriptRequestCloseWindow event);

 private:
  class InputInterceptor
      : public opera::components::AsyncInputHelper::InputEventsInterceptor {
   public:
    InputInterceptor(opera::components::OperaController& controller,
                     opera::Handle window_id);

    virtual bool InterceptKeyEvent(const opera::msg::KeyInput& key_input)
        OPERA_OVERRIDE;

   private:
    InputInterceptor(InputInterceptor&);
    InputInterceptor& operator=(InputInterceptor&);

    opera::components::OperaController& controller_;
    opera::Handle window_id_;
  };

  opera::components::OperaController& opera_controller_;
  opera::Handle window_id_;
  std::auto_ptr<ImeSimple> ime_simple_;
  UrlFilter url_filter_;
  InputInterceptor input_interceptor_;
  opera::components::AsyncInputHelper input_helper_;
};

#endif  // BROWSER_UI_CONTROLLER_H
