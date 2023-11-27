#!/usr/bin/env bash
src="vtraag--libleidenalg"
out="$HOME/Logs/$src$1.log"
ulimit -s unlimited
printf "" > "$out"

# Download leidenalg
if [[ "$DOWNLOAD" != "0" ]]; then
  rm -rf $src
  git clone https://github.com/wolfram77/$src
  cd $src
fi

# Convert graph to binary format, run leidenalg, and clean up
runLeiden() {
  stdbuf --output=L printf "Converting $1 to $1.edges ...\n"         | tee -a "$out"
  lines="$(node process.js header-lines "$1")"
  tail -n +$((lines+1)) "$1" > "$1.edges"
  stdbuf --output=L example/build/example "$1.edges" "$1.part"  2>&1 | tee -a "$out"
  stdbuf --output=L printf "\n\n"                                    | tee -a "$out"
  rm -rf "$1.edges"
}

# Build and run leidenalg
mkdir build
cd build
cmake -DCMAKE_INSTALL_PREFIX=$HOME/.local -DBUILD_SHARED_LIBS=OFF ..
cmake --build . --target install
cd ../example
mkdir build
cd build
cmake -DCMAKE_INSTALL_PREFIX=$HOME/.local -DBUILD_SHARED_LIBS=OFF ..
cmake --build .
cd ../..

# Run leidenalg on all graphs
runAll() {
  # runLeiden "$HOME/Data/web-Stanford.mtx"
  runLeiden "$HOME/Data/indochina-2004.mtx"
  runLeiden "$HOME/Data/uk-2002.mtx"
  runLeiden "$HOME/Data/arabic-2005.mtx"
  runLeiden "$HOME/Data/uk-2005.mtx"
  runLeiden "$HOME/Data/webbase-2001.mtx"
  runLeiden "$HOME/Data/it-2004.mtx"
  runLeiden "$HOME/Data/sk-2005.mtx"
  runLeiden "$HOME/Data/com-LiveJournal.mtx"
  runLeiden "$HOME/Data/com-Orkut.mtx"
  runLeiden "$HOME/Data/asia_osm.mtx"
  runLeiden "$HOME/Data/europe_osm.mtx"
  runLeiden "$HOME/Data/kmer_A2a.mtx"
  runLeiden "$HOME/Data/kmer_V1r.mtx"
}

# Run leidenalg 5 times
for i in {1..5}; do
  runAll
done

# Signal completion
curl -X POST "https://maker.ifttt.com/trigger/puzzlef/with/key/${IFTTT_KEY}?value1=$src$1"
