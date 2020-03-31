# Gotron

A small library that allows Golang programs to draw to the screen by sending messages to an Electron (NodeJS) frontend. Also relays key presses and mouse clicks.

![Gotron Screenshot](https://raw.githubusercontent.com/fohristiwhirl/gotron/master/examples/screenshot.gif)

## Usage:

* Write a Go app that uses the Gotron API; for a simple example see `examples/basic.go`
* Compile your Go app
* Edit `gotron.cfg` to point to the executable
* Run Electron in the directory, e.g. `electron .`

## Some notes on framerates:

Roughly, there are 2 ways to keep a steady framerate:

* Declare your intended framerate when calling Start(), or
* Syncing with the front-end draws, with Sync()
