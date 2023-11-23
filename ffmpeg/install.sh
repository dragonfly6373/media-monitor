#!/usr/bin/env bash

# Installs ffmpeg from source (HEAD) with libaom and libx265, as well as a few
# other common libraries
# binary will be at ~/bin/ffmpeg

sudo apt update && sudo apt upgrade -y

mkdir -p /app/sources
export PATH="$HOME/bin:$PATH"

sudo apt install -y \
  autoconf \
  automake \
  build-essential \
  cmake \
  git \
  libass-dev \
  libfreetype6-dev \
  libsdl2-dev \
  libtheora-dev \
  libtool \
  libva-dev \
  libvdpau-dev \
  libvorbis-dev \
  libxcb1-dev \
  libxcb-shm0-dev \
  libxcb-xfixes0-dev \
  mercurial \
  pkg-config \
  texinfo \
  wget \
  zlib1g-dev \
  nasm \
  yasm \
  libvpx-dev \
  libopus-dev \
  libx264-dev \
  libmp3lame-dev \
  libfdk-aac-dev

# Install libaom from source.
mkdir -p /app/sources/libaom && \
  cd /app/sources/libaom && \
  git clone https://aomedia.googlesource.com/aom && \
  cmake ./aom && \
  make && \
  sudo make install

# Install libx265 from source.
cd /app/sources && \
  git clone https://github.com/videolan/x265 && \
  cd x265/build/linux && \
  cmake -G "Unix Makefiles" -DCMAKE_INSTALL_PREFIX="$HOME/ffmpeg_build" -DENABLE_SHARED:bool=off ../../source && \
  make && \
  make install

cd /app/sources && \
  # wget -O ffmpeg-6.0.1.tar.xz https://ffmpeg.org/releases/ffmpeg-6.0.1.tar.xz && \
  # tar xjvf ffmpeg-6.0.1.tar.xz && \
  # cd ffmpeg && \
  cd ffmpeg-6.0.1 && \
  PKG_CONFIG_PATH="$HOME/ffmpeg_build/lib/pkgconfig" ./configure \
    --prefix="$HOME/ffmpeg_build" \
    --pkg-config-flags="--static" \
    --extra-cflags="-I$HOME/ffmpeg_build/include" \
    --extra-ldflags="-L$HOME/ffmpeg_build/lib" \
    --extra-libs="-lpthread -lm" \
    --bindir="$HOME/bin" \
    --enable-gpl \
    --enable-libass \
    --enable-libfdk-aac \
    --enable-libmp3lame \
    --enable-libx264 \
    --enable-libx265 \
    --enable-libtheora \
    --enable-libfreetype \
    --enable-libvorbis \
    --enable-libopus \
    --enable-libvpx \
    --enable-libaom \
    --enable-nonfree && \
  make && \
  make install && \
  hash -r