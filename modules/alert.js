"use strict";

const electron = require("electron");

function alert_main(msg) {
    electron.dialog.showMessageBox({
        message: msg.toString(),
        title: "Alert",
        buttons: ["OK"]
    }, () => {});               // Providing a callback makes the window not block the process
}

function alert_renderer(msg) {
    electron.remote.dialog.showMessageBox({
        message: msg.toString(),
        title: "Alert",
        buttons: ["OK"]
    }, () => {});
}

function object_to_string(o) {
    let msg = JSON.stringify(o);
    return msg;
}

module.exports = (msg) => {
    if (typeof(msg) === "object") {
        msg = object_to_string(msg);
    }
    if (process.type === "renderer") {
        alert_renderer(msg);
    } else {
        alert_main(msg);
    }
}
