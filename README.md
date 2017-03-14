# Gotron

A small library that allows Golang programs to draw to the screen by sending messages to an Electron (NodeJS) frontend.

![Gotron Screenshot](https://raw.githubusercontent.com/fohristiwhirl/gotron/master/screenshot.gif | width=624)

Usage:

* Write a Go app that uses the Gotron API; for an example see `basic.go`, `electra.go`, or `swarmz.go`
* Compile your Go app
* Edit config.json to point to the executable
* Run Electron in the directory, e.g. `electron .`
