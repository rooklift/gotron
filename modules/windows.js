"use strict";

const electron = require("electron");
const url = require("url");
const alert = require("./alert").alert;

const all = [];

exports.new = (width, height, protocol, page) => {

    // The screen may be zoomed, we can compensate...

    let zoom_factor = 1 / electron.screen.getPrimaryDisplay().scaleFactor;

    let win = new electron.BrowserWindow({
        width: width * zoom_factor,
        height: height * zoom_factor,
        backgroundColor: "#000000",
        useContentSize: true,
        resizable: false,
        webPreferences: { zoomFactor: zoom_factor }
    });

    win.loadURL(url.format({
        protocol: protocol,
        pathname: page,
        slashes: true
    }));

    all.push(win);

    win.on("closed", () => {
        let n;
        for (n = 0; n < all.length; n += 1) {
            if (all[n] === win) {
                all.splice(n, 1);
                break;
            }
        }
    });
};

exports.change_zoom = (diff) => {
    let n;
    for (n = 0; n < all.length; n += 1) {
        let contents = all[n].webContents;
        contents.getZoomFactor((val) => {
            contents.setZoomFactor(val + diff);
        });
    }
};

exports.set_zoom = (val) => {
    let n;
    for (n = 0; n < all.length; n += 1) {
        let contents = all[n].webContents;
        contents.setZoomFactor(val);
    }
};
