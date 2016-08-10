/* Copyright (C) 2014 Opera Software AS.  All rights reserved.
 *
 * This file is part of the Opera Devices SDK.
 * It includes Opera proprietary information and distribution is prohibited
 * without Opera Software's prior, explicit and written consent.
 */

#include <algorithm>

#include "url_filter.h"

namespace {
class StartsWith {
 public:
  StartsWith(const std::string& value);
  bool operator()(const std::string& prefix);
  bool operator()(const std::pair<std::string, std::string>& prefix);

 private:
  const std::string& value_;
};

StartsWith::StartsWith(const std::string& value) : value_(value) {}

bool StartsWith::operator()(const std::string& prefix) {
  if (prefix.length() > value_.length())
    return false;
  return (value_.compare(0, prefix.length(), prefix) == 0);
}

bool StartsWith::operator()(const std::pair<std::string, std::string>& prefix) {
  return operator()(prefix.first);
}
}

UrlFilter::UrlFilter(opera::components::OperaController& opera_controller) {
  opera_controller.AddEventHandler(&UrlFilter::OnBeforeURLRequest, this);

  // example of blocked and redirected pages
  blocked_.push_back("http://yahoo.com");
  blocked_.push_back("http://www.yahoo.com");
  blocked_.push_back("https://yahoo.com");
  blocked_.push_back("https://www.yahoo.com");
  redirect_.push_back(std::make_pair("http://msn.com", "http://opera.com"));
  redirect_.push_back(std::make_pair("http://www.msn.com", "http://opera.com"));
  redirect_.push_back(std::make_pair("https://msn.com", "http://opera.com"));
  redirect_.push_back(
      std::make_pair("https://www.msn.com", "http://opera.com"));
}

void UrlFilter::OnBeforeURLRequest(opera::evt::BeforeURLRequest ime_msg) {
  std::string redirection_url;
  if (IsBlocked(ime_msg.original_url)) {
    ime_msg.Deny();
    return;
  }
  if (NeedRedirection(ime_msg.original_url, &redirection_url)) {
    ime_msg.Redirect(redirection_url);
    return;
  }
  ime_msg.Allow();
}

bool UrlFilter::IsBlocked(const std::string& url) {
  return std::find_if(blocked_.begin(), blocked_.end(), StartsWith(url)) !=
         blocked_.end();
}

bool UrlFilter::NeedRedirection(const std::string& url,
                                std::string* redirection_url) {
  std::vector<std::pair<std::string, std::string> >::const_iterator it =
      std::find_if(redirect_.begin(), redirect_.end(), StartsWith(url));
  if (it != redirect_.end()) {
    *redirection_url = it->second;
    return true;
  }
  return false;
}
