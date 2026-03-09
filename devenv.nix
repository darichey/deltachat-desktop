{ pkgs, lib, ... }:

{
  languages.javascript = {
    enable = true;
    package = pkgs.nodejs_22;
    pnpm = {
      enable = true;
      install.enable = true;
    };
  };

  languages.typescript.enable = true;

  languages.rust = {
    enable = true;
    channel = "stable";
  };

  languages.python.enable = true;

  packages = with pkgs; [
    # Build tools
    pkg-config
    gobject-introspection
    cargo-tauri

    # Electron (version should match packages/target-electron/package.json)
    electron

    # GTK and UI dependencies
    at-spi2-atk
    atkmm
    cairo
    gdk-pixbuf
    glib
    gtk3
    harfbuzz
    librsvg
    libsoup_3
    pango
    webkitgtk_4_1
    openssl
    libayatana-appindicator

    # GStreamer for video/audio playback
    gst_all_1.gstreamer
    gst_all_1.gst-plugins-base
    gst_all_1.gst-plugins-good
    gst_all_1.gst-plugins-bad
    gst_all_1.gst-libav
    gst_all_1.gst-vaapi

    # LSP and dev tools
    rust-analyzer
    typescript-language-server
  ];

  env = {
    LD_LIBRARY_PATH = lib.makeLibraryPath (with pkgs; [
      at-spi2-atk
      atkmm
      cairo
      gdk-pixbuf
      glib
      gtk3
      harfbuzz
      librsvg
      libsoup_3
      pango
      webkitgtk_4_1
      openssl
      libayatana-appindicator
      gst_all_1.gstreamer
      gst_all_1.gst-plugins-base
      gst_all_1.gst-plugins-good
      gst_all_1.gst-plugins-bad
      gst_all_1.gst-libav
      gst_all_1.gst-vaapi
    ]);
    XDG_DATA_DIRS = "${pkgs.gsettings-desktop-schemas}/share/gsettings-schemas/${pkgs.gsettings-desktop-schemas.name}:${pkgs.gtk3}/share/gsettings-schemas/${pkgs.gtk3.name}";
    # Needed with nvidia driver to show UI; may slow performance but helps with glitches
    WEBKIT_DISABLE_COMPOSITING_MODE = "1";
  };

  enterShell = ''
    # On NixOS, npm electron doesn't work, so remove it and use system electron
    rm ./packages/target-electron/node_modules/.bin/electron 2>/dev/null || true

    # Create alias for e2e tests that unsets LD_LIBRARY_PATH to avoid GLIBC conflicts
    # with Playwright's bundled Chromium
    alias e2e='env -u LD_LIBRARY_PATH pnpm -w e2e'
  '';
}
