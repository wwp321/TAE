/* Copyright (C) 2014 Opera Software AS.  All rights reserved.
 *
 * This file is part of the Opera Devices SDK.
 * It includes Opera proprietary information and distribution is prohibited
 * without Opera Software's prior, explicit and written consent.
 */

#include <vector>

#include <opera/components/opera_controller.h>
#include <opera/messages/CancelIME.h>
#include <opera/messages/CommitIME.h>
#include <opera/messages/Focus.h>
#include <opera/messages/SendPlatformEvent.h>
#include <opera/OperaLogging.h>

#include "ime_simple.h"

namespace {
std::string OperaDirFileURL(const std::string& file) {
  std::string opera_dir_path = getenv("OPERA_DIR");
  return "file://" + opera_dir_path + '/' + file;
}

void SplitString(const std::string& s,
                 char delim,
                 std::vector<std::string>& elems) {
  std::stringstream ss(s);
  std::string item;
  while (std::getline(ss, item, delim))
    elems.push_back(item);
}

void ParseCommand(const std::string commandString,
                  std::string& command,
                  std::vector<std::string>& elems) {
  SplitString(commandString, ';', elems);
  if (elems.size() > 0) {
    command = elems[0];
    elems.erase(elems.begin());
  }
}
}

ImeSimple::ImeSimple(opera::components::OperaController& opera_controller,
                     opera::Handle window_id)
    : opera_controller_(opera_controller),
      window_id_(window_id),
      ime_origin_(window_id),
      ime_ui_(NULL) {
  opera_controller_.AddEventHandler(&ImeSimple::OnIMEStart, this);
  opera_controller_.AddEventHandler(&ImeSimple::OnIMECancelled, this);
  opera_controller_.AddEventHandler(&ImeSimple::OnPlatformMessage, this);
}

ImeSimple::~ImeSimple() {
  delete ime_ui_;
}

std::string ImeSimple::EscapeSpecialCharacters(const std::string& str)
{
   const char* value = str.c_str();
   std::string result("\"");
   for (const char* c=value; *c != 0; ++c) {
      switch(*c) {
         case '\"':
            result += "\\\"";
            break;
         case '\\':
            result += "\\\\";
            break;
         case '\b':
            result += "\\b";
            break;
         case '\f':
            result += "\\f";
            break;
         case '\n':
            result += "\\n";
            break;
         case '\r':
            result += "\\r";
            break;
         case '\t':
            result += "\\t";
            break;
         default:
            result += *c;
            break;
      }
   }
   result += "\"";
   return result;
}

void ImeSimple::OnIMEStart(opera::evt::IMEStart ime_msg) {
  OLOG(INFO,
       "Got IMEStart: window_id=%s string=%s, x=%i , y=%i, type=%i",
       ime_msg.id.str().c_str(),
       ime_msg.original_text.c_str(),
       ime_msg.caret_position.x,
       ime_msg.caret_position.y,
       ime_msg.input_type);

  if (ime_ui_ && ime_msg.id == ime_ui_->window_id())
    return;

  if (!ime_ui_)
    CreateUI();

  ime_msg.Accept(ime_msg.id);

  ime_ui_->SetPosition(
      std::max(ime_msg.caret_position.x, 0),
      std::max(ime_msg.caret_position.y, 0) + ime_msg.caret_position.height);
  ime_ui_->Show();

  std::string msg("{\"cmd\":\"ime-text\", \"text\":");
  if (ime_msg.input_type != opera::evt::IMEStart::INPUT_PASSWORD) {
    std::string substr =
            ime_msg.original_text.substr(ime_msg.caret_position.offset,
                                         ime_msg.caret_position.length);
    msg += ImeSimple::EscapeSpecialCharacters(substr);
  }
  msg += "}";
  opera_controller_.opera().post(
        opera::msg::SendPlatformEvent(ime_ui_->window_id(), msg));

  ime_ui_->Focus();
  ime_origin_ = ime_msg.id;
}

void ImeSimple::OnIMECancelled(opera::evt::IMECancelled ime_msg) {
  OLOG(INFO, "IME cancelled by Opera: window_id=%s", ime_msg.id.str().c_str());

  if (ime_ui_->IsVisible()) {
    ime_ui_->Hide();
    if (ime_origin_.IsValid())
      opera_controller_.opera().post(opera::msg::Focus(ime_origin_));
  }
}

void ImeSimple::OnPlatformMessage(opera::evt::PlatformMessage platform_msg) {
  std::string command;
  std::vector<std::string> arguments;
  ParseCommand(platform_msg.message, command, arguments);

  if (command == "commit-ime") {
    if (!ime_origin_.IsValid())
      OLOG(FATAL, "Ime origin is not valid.");
    opera_controller_.opera().post(opera::msg::Focus(ime_origin_));
    ime_ui_->Hide();
    std::string text = "";
    if (arguments.size() >= 1)
      text = arguments[0];
    std::string replace = "false";
    if (arguments.size() >= 2)
      replace = arguments[1];
    std::string submit = "false";
    if (arguments.size() >= 3)
      submit = arguments[2];
    opera_controller_.opera().post(
            opera::msg::CommitIME(ime_origin_, text,
                                  replace == "true",
                                  submit == "true"));
  } else if (command == "cancel-ime") {
    if (!ime_origin_.IsValid())
      OLOG(FATAL, "Ime origin is not valid.");
    opera_controller_.opera().post(opera::msg::Focus(ime_origin_));
    ime_ui_->Hide();
    opera_controller_.opera().post(opera::msg::CancelIME(ime_origin_));
  }
}

void ImeSimple::CreateUI() {
  ime_ui_ = new OverlayWindow(opera_controller_.opera(), window_id_,
                              OperaDirFileURL("browser_ui/imeui.html"));
  ime_ui_->Create(0, 0, 200, 100, true);
}
