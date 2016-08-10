/* Copyright (C) 2012-2014 Opera Software AS.  All rights reserved.
 *
 * This file is part of the Opera Devices SDK.
 * It includes Opera proprietary information and distribution is prohibited
 * without
 * Opera Software's prior, explicit and written consent.
 */

#include <string>

#include <opera/components/async_input_helper.h>
#include <opera/components/command_line.h>
#include <opera/components/integration_utils.h>
#include <opera/components/opera_controller.h>
#include <opera/components/input/linux_input.h>
#include <opera/messages/CreateBrowserUIWindow.h>
#include <opera/messages/SetInputMethod.h>
#include <opera/events/PlatformMessage.h>
#include <opera/messages/DestroyWindow.h>
#include <opera/messages/StackAtTop.h>
#include <opera/messages/Focus.h>
#include <opera/messages/CreateTVStoreWindow.h>
#include <opera/messages/Hide.h>
#include <opera/messages/LoadURL.h>
#include <opera/Opera.h>
#include <opera/OperaLogging.h>

#if defined(USE_DIRECTFB)
#include <opera/components/directfb/directfb_utils.h>
#endif  // defined(USE_DIRECTFB)

#include <json/json.h>

#include "browser_ui_controller.h"

// "Home" URL if none is given on the command line.
static const std::string kHelpIntro =
    "Browser UI Demo, Opera Software.\n"
    "Usage: %s [ Browser UI options ] [ Chromium options ]\n\n"
    "Browser UI options:\n";

static const char kSwitchNoIME[] = "no-ime";
static const char kNoIMEHelp[] = "Disable IME";
static const char kNoIMEAbbr = 'i';

static const char kSwitchNoVirtualKeyboard[] = "no-virtual-keyboard";
static const char kNoVBHelp[] = "Disable the virtual keyboard";
static const char kNoVBAbbr = 'K';

static const char kSwitchEnableUrlFilter[] = "enable-url-filter";
static const char kEnableUrlFilterHelp[] = "Enable the URL filtering";
static const char kEnableUrlFilterAbbr = 'f';

using namespace opera;

enum CMD_ID_LIST{
    CMD_ID_OPEN_APP,
};

opera::Handle g_tvapp_window;
opera::Opera *g_opera;

void onPlatformMessage(evt::PlatformMessage event)
{
    fprintf(stderr,"%s\n",__PRETTY_FUNCTION__);
    OLOG(INFO,"%s,%s",__PRETTY_FUNCTION__,event.message.c_str());
    Json::Reader reader;
    Json::Value value;
    bool parse_result = reader.parse(event.message,value);
    if(parse_result)
    {
        int cmd_id = value.get("cmdId",-1).asInt();
        switch(cmd_id)
        {
            case CMD_ID_OPEN_APP:
                std::string url = value.get("url","").asString();
                if(!url.empty())
                {
                    OLOG(INFO,"LoadUrl:%s",url.c_str());
                    g_opera->post(msg::DestroyWindow(g_tvapp_window));
                    g_opera->post(msg::CreateTVStoreWindow(url));
                    g_opera->post(msg::StackAtTop(g_tvapp_window));
                    g_opera->post(msg::Focus(g_tvapp_window));
                }
            break;
        }
    }
    else
    {
        OLOG(ERROR,"wrong message\n");
    }
}


int main(int argc, char* argv[]) {
  using namespace opera::components;

  CommandLine command_line(argc, argv, kHelpIntro, "");
  command_line.AddOption(kSwitchNoIME, kNoIMEAbbr, true, kNoIMEHelp);
  command_line.AddOption(
      kSwitchNoVirtualKeyboard, kNoVBAbbr, true, kNoVBHelp);
  command_line.AddOption(
      kSwitchEnableUrlFilter, kEnableUrlFilterAbbr, true, kEnableUrlFilterHelp);
  command_line.Parse();

  system_clock::VerifyClock(system_clock::ATTEMPT_ADJUSTING_FROM_NTP |
                            system_clock::SET_TO_EXE_DATE |
                            system_clock::TERMINATE_IF_INVALID);

  bool vkb_enabled = !command_line.HasOption(kSwitchNoVirtualKeyboard);
  bool no_ime = command_line.HasOption(kSwitchNoIME);
  bool url_filter_enabled = command_line.HasOption(kSwitchEnableUrlFilter);

  input::InputReader* input_reader = NULL;
  StaticConfiguration config;
  config.backend = command_line.GetGraphicsBackend();

#if defined(USE_DIRECTFB)
  DirectFBInstance dfb_instance;
  DirectFBDisplay dfb_display;

  if (!directfb_utils::InitializeDirectFBComponents(
          config.backend, command_line,
          dfb_instance, dfb_display,
          &input_reader)) {
    return 1;
  }
  // Required by the DirectFB graphics backend, ignored by
  // the other backends so we can always set it here.
  config.directfb = dfb_instance.directfb();
#endif  // defined(USE_DIRECTFB)

  if (!input_reader) {
    input_reader = new input::LinuxInput(command_line);
    if (!input_reader->Initialize()) {
      OLOG(ERROR, "Failed to initialize the Linux input reader");
      return 1;
    }
  }

  Opera opera(command_line.argc(), command_line.argv(), config);
  OperaController opera_controller(
        opera, command_line.QuitOnRenderProcessCrash()
               ? OperaController::ACTION_ON_CRASH_QUIT_BROWSER
               : OperaController::ACTION_ON_CRASH_LOG);
    g_opera = &opera;
  opera_controller.AddEventHandler(&onPlatformMessage);

#if defined(USE_DIRECTFB)
  // Start rendering to the DirectFB display using the OperaController
  if (config.backend != StaticConfiguration::OPENGLES)
    dfb_display.Attach(&opera_controller);
#endif  // defined(USE_DIRECTFB)

  msg::CreateBrowserUIWindow::Result result =
      opera_controller.opera()
          .post(msg::CreateBrowserUIWindow(command_line.GetUrl()))
          .get();
  if (result.error == msg::CreateBrowserUIWindow::NOT_SUPPORTED)
    return 1;

  opera::Handle window_id = result.window_id;

  BrowserUIController browser_ui_controller(
      opera_controller, input_reader, window_id, url_filter_enabled);

  if (no_ime) {
    opera.post(msg::SetInputMethod(window_id,
                                   msg::SetInputMethod::MULTITAP_INPUT_METHOD));
  } else {
    if (vkb_enabled) {
      opera.post(msg::SetInputMethod(window_id,
                                     msg::SetInputMethod::VIRTUAL_KEYBOARD));
    } else {
      browser_ui_controller.CreateSimpleImeHandler();
      opera.post(msg::SetInputMethod(
          window_id, msg::SetInputMethod::OMI_EVENTS_INPUT_METHOD));
    }
  }

  /*init tv app window*/
  //g_tvapp_window = opera.post(msg::CreateTVStoreWindow("http://www.baidu.com")).get().window_id;
  //opera.post(msg::Hide(g_tvapp_window));

  browser_ui_controller.Run();

  return 0;
}
