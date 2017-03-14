"use strict";

const electron = require("electron");
const windows = require("./modules/windows");
const alert = require("./modules/alert").alert;
const fs = require('fs');

electron.app.on("ready", () => {
    const config = JSON.parse(fs.readFileSync("config.json", "utf8"));
    windows.new(config.width, config.height, "file:", "gotron.html");
    menu_build();
});

electron.app.on("window-all-closed", () => {
    electron.app.quit();
});

function menu_build() {
    const template = [
        {
            label: "Menu",
            submenu: [
                {
                    label: "About",
                    click: () => {
                        alert("This is a test program.");
                    }
                },
                {
                    role: "toggledevtools"
                }
            ]
        }
    ];

    const menu = electron.Menu.buildFromTemplate(template);
    electron.Menu.setApplicationMenu(menu);
}
