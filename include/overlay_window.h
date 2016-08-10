/* Copyright (C) 2013 Opera Software AS.  All rights reserved.
 *
 * This file is part of the Opera Devices SDK.
 * It includes Opera proprietary information and distribution is prohibited
 * without Opera Software's prior, explicit and written consent.
 */

#ifndef OPERA_QA_BROWSER_HTML_VIEW_H
#define OPERA_QA_BROWSER_HTML_VIEW_H

#include <opera/Opera.h>

#include <string>

class OverlayWindow {
 public:
  OverlayWindow(const opera::Opera& opera,
                opera::Handle parent_id,
                const std::string& url);
  ~OverlayWindow();

  void Create(int x, int y, int width, int height, bool transparent = false);
  void SetBounds(int x, int y, int width, int height);
  void SetPosition(int x, int y);
  void SetOpacity(float opacity);
  void Show();
  void Hide();
  void Focus();
  void Blur();

  bool IsVisible() const;

  const std::string& url() const;
  opera::Handle window_id() const;

 private:
  opera::Opera opera_;
  std::string url_;
  opera::Handle parent_id_;
  opera::Handle overlay_window_id_;
  bool visible_;
};

#endif  // OPERA_QA_BROWSER_HTML_VIEW_H
