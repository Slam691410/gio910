#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-all}"

build_opsi3() {
  rm -rf dist-opsi3
  mkdir -p dist-opsi3
  cp index.html robots.txt sitemap.xml dist-opsi3/
  cp -r pages assets dist-opsi3/
  echo "OK: dist-opsi3/ siap untuk Cloudflare Pages (gio910gerai.io)"
}

build_opsi5() {
  rm -rf dist-opsi5
  mkdir -p dist-opsi5
  cp copy-hub.html dist-opsi5/index.html
  echo "OK: dist-opsi5/ siap untuk 4EVERLAND IPFS (geraiinovasiolahan.gio910)"
}

build_opsi4() {
  rm -rf dist-opsi4
  mkdir -p dist-opsi4
  cp dao/hybrid/dao-hybrid-widget.html dist-opsi4/index.html
  echo "OK: dist-opsi4/ siap untuk 4EVERLAND IPFS (gio910gerai.dao)"
}

build_opsi1() {
  rm -rf dist-opsi1
  mkdir -p dist-opsi1
  cp wrappers/opsi1/index.html dist-opsi1/index.html
  echo "OK: dist-opsi1/ siap untuk 4EVERLAND IPFS (gio910gerai.eth)"
}

build_blog() {
  rm -rf dist-blog
  mkdir -p dist-blog
  cp copy-hub.html dist-blog/index.html
  cp -r assets dist-blog/
  cp robots.txt dist-blog/
  echo "OK: dist-blog/ siap untuk Cloudflare Pages (gio910.blog)"
}

case "$TARGET" in
  opsi1) build_opsi1 ;;
  opsi3) build_opsi3 ;;
  opsi4) build_opsi4 ;;
  opsi5) build_opsi5 ;;
  blog) build_blog ;;
  all)
    build_opsi1
    build_opsi3
    build_opsi4
    build_opsi5
    build_blog
    ;;
  *)
    echo "Pemakaian: $0 [opsi1|opsi3|opsi4|opsi5|blog|all]" >&2
    exit 1
    ;;
esac
