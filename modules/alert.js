"use strict";

const electron = require("electron");

function alert_main(msg) {
    electron.dialog.showMessageBox({
        message: msg,
        title: "Alert",
        buttons: ["OK"]
    });
}

function alert_renderer(msg) {
    electron.remote.dialog.showMessageBox({
        message: msg,
        title: "Alert",
        buttons: ["OK"]
    });
}

exports.alert = (msg) => {
    if (process.type === "renderer") {
        alert_renderer(msg);
    } else {
        alert_main(msg);
    }
}
