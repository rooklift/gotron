# Gotron

A small library that allows Golang programs to draw to the screen by sending messages to an Electron (NodeJS) frontend. Also relays key presses and mouse clicks.

![Gotron Screenshot](https://raw.githubusercontent.com/fohristiwhirl/gotron/master/screenshot.gif)

Usage:

* Write a Go app that uses the Gotron API; for an example see `basic.go`, `electra.go`, or `swarmz.go`
* Compile your Go app
* Edit config.json to point to the executable
* Run Electron in the directory, e.g. `electron .`
