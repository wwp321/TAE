/* Copyright (C) 2013 Opera Software AS.  All rights reserved.
 *
 * This file is part of the Opera Devices SDK.
 * It includes Opera proprietary information and distribution is prohibited
 * without Opera Software's prior, explicit and written consent.
 */

#include "overlay_window.h"
#include <opera/messages/Blur.h>
#include <opera/messages/CreateWindow.h>
#include <opera/messages/DestroyWindow.h>
#include <opera/messages/Focus.h>
#include <opera/messages/Hide.h>
#include <opera/messages/LoadURL.h>
#include <opera/messages/SetBounds.h>
#include <opera/messages/SetOpacity.h>
#include <opera/messages/SetPref.h>
#include <opera/messages/StackAbove.h>
#include <opera/messages/Show.h>

using namespace opera;

OverlayWindow::OverlayWindow(const Opera& opera, opera::Handle parent_id,
                             const std::string& url)
    : opera_(opera)
    , url_(url)
    , parent_id_(parent_id)
    , overlay_window_id_()
    , visible_(false) {
}

OverlayWindow::~OverlayWindow() {
  if (!overlay_window_id_.IsValid())
    return;

  opera_.post(msg::DestroyWindow(overlay_window_id_));
}

void OverlayWindow::Create(int x, int y, int width, int height,
                           bool transparent) {
  msg::CreateWindow::Result create_result = opera_.post(msg::CreateWindow(
      false, true, Rect(x, y, width, height))).get();
  if (create_result.error != msg::CreateWindow::NO_ERR)
    return;
  overlay_window_id_ = create_result.window_id;
  opera_.post(msg::SetPref(overlay_window_id_, "transparent",
                           transparent ? "true" : "false"));
  opera_.post(msg::LoadURL(overlay_window_id_, url_));
  opera_.post(msg::StackAbove(overlay_window_id_, parent_id_));
}

void OverlayWindow::SetBounds(int x, int y, int width, int height) {
  if (!overlay_window_id_.IsValid())
    return;
  opera_.post(msg::SetBounds(overlay_window_id_, Rect(x, y, width, height)));
}

void OverlayWindow::SetPosition(int x, int y) {
  if (!overlay_window_id_.IsValid())
    return;
  opera_.post(msg::SetBounds(overlay_window_id_, Rect(x, y, -1, -1)));
}

void OverlayWindow::SetOpacity(float opacity) {
  if (!overlay_window_id_.IsValid())
    return;
  opera_.post(msg::SetOpacity(overlay_window_id_, opacity));
}

void OverlayWindow::Show() {
  if (!overlay_window_id_.IsValid())
    return;
  visible_ = true;
  opera_.post(msg::Show(overlay_window_id_));
}

void OverlayWindow::Hide() {
  if (!overlay_window_id_.IsValid())
    return;
  visible_ = false;
  opera_.post(msg::Hide(overlay_window_id_));
}

void OverlayWindow::Focus() {
  if (!overlay_window_id_ .IsValid())
    return;
  opera_.post(msg::Focus(overlay_window_id_));
}

void OverlayWindow::Blur() {
  if (!overlay_window_id_.IsValid())
    return;
  opera_.post(msg::Blur());
}

const std::string& OverlayWindow::url() const {
  return url_;
}

opera::Handle OverlayWindow::window_id() const {
  return overlay_window_id_;
}

bool OverlayWindow::IsVisible() const {
  return visible_;
}
