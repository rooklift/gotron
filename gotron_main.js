"use strict";

const alert = require("./modules/alert");
const electron = require("electron");
const fs = require("fs");
const path = require("path");
const url = require("url");

let win;
let config = JSON.parse(fs.readFileSync("gotron.cfg", "utf8"));
let menu = menu_build();

if (electron.app.isReady()) {
	startup();
} else {
	electron.app.once("ready", () => {
		startup();
	});
}

// ----------------------------------------------------------------------------------

function startup() {

	win = new electron.BrowserWindow({
		width: config.width,
		height: config.height,
		backgroundColor: "#000000",
		resizable: config.resizable,
		show: false,
		useContentSize: true,
		webPreferences: {
			backgroundThrottling: false,
			nodeIntegration: true,
			zoomFactor: 1 / electron.screen.getPrimaryDisplay().scaleFactor		// Unreliable, see https://github.com/electron/electron/issues/10572
		}
	});

	win.once("ready-to-show", () => {
		win.webContents.zoomFactor = 1 / electron.screen.getPrimaryDisplay().scaleFactor;
		win.show();
		win.focus();
	});

	electron.app.on("window-all-closed", () => {
		electron.app.quit();
	});

	// Actually load the page last, I guess, so the event handlers above are already set up...

	win.loadURL(url.format({
		protocol: "file:",
		pathname: path.join(__dirname, "gotron.html"),
		slashes: true
	}));

	electron.Menu.setApplicationMenu(menu);
}

function menu_build() {
	const template = [
		{
			label: "Menu",
			submenu: [
				{
					label: "About",
					click: () => {
						alert("Gotron: Golang graphics via Electron " + process.versions.electron);
					}
				},
				{
					role: "reload"
				},
				{
					role: "quit"
				},
				{
					type: "separator"
				},
				{
					role: "toggledevtools"
				}
			]
		}
	];

	return electron.Menu.buildFromTemplate(template);
}
