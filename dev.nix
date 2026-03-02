{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = [
    pkgs.python311
    pkgs.nodejs_20
    pkgs.ffmpeg_7
  ];

  shellHook = ''
    echo "The Artist Engine development environment loaded."
    echo "Python version: $(python --version)"
    echo "Node.js version: $(node --version)"
    echo "FFmpeg version: $(ffmpeg -version | head -n 1)"
  '';
}
