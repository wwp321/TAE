/* Copyright (C) 2014 Opera Software AS.  All rights reserved.
 *
 * This file is part of the Opera Devices SDK.
 * It includes Opera proprietary information and distribution is prohibited
 * without Opera Software's prior, explicit and written consent.
 */

#ifndef OPERA_BROWSER_UI_URL_FILTER_H
#define OPERA_BROWSER_UI_URL_FILTER_H

#include <vector>
#include <string>

#include <opera/components/opera_controller.h>
#include <opera/events/BeforeURLRequest.h>

class UrlFilter {
 public:
  UrlFilter(opera::components::OperaController& opera_controller);

 private:
  void OnBeforeURLRequest(opera::evt::BeforeURLRequest ime_msg);
  bool IsBlocked(const std::string& url);
  bool NeedRedirection(const std::string& url, std::string* redirection_url);

  std::vector<std::string> blocked_;
  std::vector<std::pair<std::string, std::string> > redirect_;
};

#endif  // OPERA_BROWSER_UI_URL_FILTER_H
