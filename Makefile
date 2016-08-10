# Copyright (C) 2012-2014 Opera Software AS.  All rights reserved.
#
# This file is part of the Opera Devices SDK.
# It includes Opera proprietary information and distribution is prohibited
# without Opera Software's prior, explicit and written consent.

#CROSS ?= x86_64-unknown-linux-gnu-
CROSS ?=
TARGETDIR = output
TARGET = ${TARGETDIR}/bin/browser_ui
SRCS = ./src/main.cc ./src/browser_ui_controller.cc ./src/ime_simple.cc ./src/overlay_window.cc ./src/url_filter.cc
HDRS = ./include/browser_ui_controller.h ./include/ime_simple.h ./include/overlay_window.h ./include/url_filter.h

CXXFLAGS ?= -fno-exceptions -fno-rtti -fno-threadsafe-statics -fvisibility-inlines-hidden -Wsign-compare -std=gnu++11 -Wno-narrowing -Wno-literal-suffix
LDFLAGS ?= -Wl,--build-id -Wl,-z,now -Wl,-z,relro -Wl,--fatal-warnings -pthread -Wl,-z,noexecstack -fPIC -L/tvsdk/product/x86/x86_64-unknown-linux-gnu/gcc-4.8.3-eglibc-2.15/opera_dep/freetype-2.4.11/lib -L/tvsdk/product/x86/x86_64-unknown-linux-gnu/gcc-4.8.3-eglibc-2.15/opera_dep/fontconfig-2.11.1/lib -lfontconfig -lfreetype -L/tvsdk/product/x86/x86_64-unknown-linux-gnu/gcc-4.8.3-eglibc-2.15/opera_dep/directfb-1.7.0/lib -m64 -Wl,-O1 -Wl,--as-needed -Wl,--gc-sections -Wl,-rpath=/lib/ -Wl,-rpath-link=lib/ -ldirectfb -lfusion -ldirect -lpthread
DEFINES ?= -DVIDEO_HOLE=1 -DV8_DEPRECATION_WARNINGS -DCLD_VERSION=2 -D_FILE_OFFSET_BITS=64 -DDISABLE_NACL -DOPERA_TVSDK -DENABLE_UVA -DLINUX_EMBEDDED -DCHROMIUM_BUILD '-DLINUX_SANDBOX_BINARY=chrome-sandbox' '-DLINUX_SANDBOX_DEV_ENVVAR=CHROME_DEVEL_SANDBOX' -DENABLE_LOCALSTORAGE_LIMIT -DUI_COMPOSITOR_IMAGE_TRANSPORT -DUSE_AURA=1 -DUSE_DEFAULT_RENDER_THEME=1 -DUSE_LIBJPEG_TURBO=1 -DENABLE_ONE_CLICK_SIGNIN -DENABLE_PRE_SYNC_BACKUP -DENABLE_WEBRTC=1 -DENABLE_MEDIA_ROUTER=1 -DUSE_PROPRIETARY_CODECS -DENABLE_CONFIGURATION_POLICY -DENABLE_NOTIFICATIONS -DENABLE_HIDPI=1 -DENABLE_TOPCHROME_MD=1 -DDONT_EMBED_BUILD_METADATA -DFIELDTRIAL_TESTING_ENABLED -DENABLE_PDF=1 -DENABLE_PLUGINS=1 -DENABLE_JSPLUGINS=1 -DENABLE_AUTOFILL_DIALOG=1 -DENABLE_GOOGLE_NOW=1 -DENABLE_PRINTING=1 -DENABLE_BASIC_PRINTING=1 -DENABLE_PRINT_PREVIEW=1 -DENABLE_SPELLCHECK=1 -DENABLE_SUPERVISED_USERS=1 -DENABLE_MDNS=1 -DENABLE_SERVICE_DISCOVERY=1 -DV8_USE_EXTERNAL_STARTUP_DATA -DFULL_SAFE_BROWSING -DSAFE_BROWSING_CSD -DSAFE_BROWSING_DB_LOCAL -DMOJO_USE_SYSTEM_IMPL -DUSE_LIBPCI=1 -DUSE_OPENSSL=1 -DUSE_NSS_CERTS=1 -D__STDC_CONSTANT_MACROS -D__STDC_FORMAT_MACROS -DNDEBUG -DNVALGRIND -DDYNAMIC_ANNOTATIONS_ENABLED=0 -D_FORTIFY_SOURCE=2

OPENGLESBASEDIR ?= 

USE_DIRECTFB ?= YES
DIRECTFB_X11 ?= NO

VERBOSE ?= YES
DEBUG ?= YES
CHECK_DEPS ?= YES
OPERA_LIB_DIR ?= ${OPERA_SDK_DIR}/lib
OPERA_INCLUDE_DIRS ?= ${OPERA_SDK_DIR}/include

ifeq ($(DEBUG), YES)
	STRIP ?= NO
else
	STRIP ?= YES
endif

CXX = $(CROSS)g++
LD = $(CXX)

BUILD_DIR = $(PWD)

CXXFlags = $(DEFINES) $(filter-out "", $(CXXFLAGS))

ifeq ($(VERBOSE),YES)
  HUSH =
  HUSH_ECHO = @echo
else
  HUSH = @
  HUSH_ECHO = @true
endif

ifeq ($(DEBUG),YES)
  CXXFlags += -O0 -g
else
ifeq ($(strip $(OPT_LEVEL)),)
  CXXFlags += -O2
else
  CXXFlags += -O$(OPT_LEVEL)
endif
endif

#if available, add OpenGL to the include path and lib path
ifneq ($(OPENGLESBASEDIR),)
  CXXFlags += -I$(OPENGLESBASEDIR)/include
  LDFlags  += -L$(OPENGLESBASEDIR)/lib
endif

CXXFlags += -I./include

CXXFlags += -Wall $(addprefix -I, $(abspath $(OPERA_INCLUDE_DIRS)))
LDFlags += -Wl,-rpath-link=$(abspath $(OPERA_LIB_DIR)) -L$(abspath $(OPERA_LIB_DIR)) -lomi_components -lomi -ldl
LDFlags += $(LDFLAGS)

CXXFlags += $(shell pkg-config --cflags freetype2)
LDFlags += $(shell pkg-config --libs freetype2)
CXXFlags += $(shell pkg-config --cflags expat)
LDFlags += $(shell pkg-config --libs expat)
CXXFlags += $(shell pkg-config --cflags fontconfig)
LDFlags += $(shell pkg-config --libs fontconfig)

CXXFlags += $(shell pkg-config --cflags jsoncpp)
LDFlags += $(shell pkg-config --libs jsoncpp)

ifeq ($(USE_DIRECTFB), YES)
  CXXFlags += $(shell pkg-config --cflags directfb) -DUSE_DIRECTFB
  LDFlags += $(shell pkg-config --libs directfb)
endif

ifeq ($(DIRECTFB_X11), YES)
  CXXFlags += -DDIRECTFB_X11
endif

OBJS   = $(SRCS:.cc=.o)
DEPS   = $(SRCS:.cc=.d)

.phony: clean clobber all

all: $(TARGET) $(TARGET).sym

init:
	$(HUSH) cp -a $(OPERA_SDK_DIR)/lib $(TARGETDIR)
	$(HUSH) cp -a $(OPERA_SDK_DIR)/fonts $(TARGETDIR)
	$(HUSH) cp -a $(OPERA_SDK_DIR)/opera_dir $(TARGETDIR)
	$(HUSH) cp -a $(OPERA_SDK_DIR)/opera_home $(TARGETDIR)
	$(HUSH) cp -a $(OPERA_SDK_DIR)/opera_env.sh $(TARGETDIR)
	$(HUSH) cp -a $(OPERA_SDK_DIR)/run_opera.sh $(TARGETDIR)
	$(HUSH) cp -a $(OPERA_SDK_DIR)/setup_fontconfig.sh $(TARGETDIR)
	$(HUSH) cp -a $(OPERA_SDK_DIR)/setup_sandbox.sh $(TARGETDIR)
	$(HUSH) cp -a $(OPERA_SDK_DIR)/utils $(TARGETDIR)
	$(HUSH) cp -a $(OPERA_SDK_DIR)/pkg-info.json $(TARGETDIR)
	$(HUSH) mkdir $(TARGETDIR)/bin

init-clean:
	$(HUSH) rm -rf $(TARGETDIR)/*

clean:
	$(HUSH_ECHO) Cleaning $(TARGET)
	$(HUSH) rm -f $(OBJS) $(DEPS)
	$(HUSH) rm -f $(TARGET)
	$(HUSH) rm -f $(TARGET).sym
	$(HUSH) rm -f $(TARGET).unstripped

clobber:
	$(HUSH_ECHO) Clobbering $(TARGET)
	$(HUSH) rm -f $(TARGET) $(OBJS) $(DEPS)

.cc.o:
	$(HUSH_ECHO) Compiling $< ...
	$(HUSH) $(CXX) $(CXXFlags) -c $< -o $(abspath $@)

%.d: %.cc
	$(HUSH_ECHO) Generating dependencies for $< ...
	$(HUSH) $(CXX) -M $(CXXFlags) $< > $@

$(TARGET).unstripped: $(OBJS)
	$(HUSH_ECHO) Linking $(TARGET) ...
	$(HUSH) $(LD) $(realpath $(OBJS)) $(LDFlags) -o $(abspath $(TARGET).unstripped)

$(TARGET).sym: $(TARGET).unstripped
	$(HUSH) $(CROSS)objcopy --only-keep-debug $< $@

$(TARGET): $(TARGET).unstripped
	$(HUSH) cp $(TARGET).unstripped $(TARGET)
ifeq ($(STRIP),YES)
	$(HUSH_ECHO) Stripping symbols in $(TARGET) ...
	$(HUSH) $(CROSS)strip --strip-unneeded --strip-debug --discard-all $(TARGET)
endif

ifeq ($(CHECK_DEPS), YES)
-include $(DEPS)
endif
