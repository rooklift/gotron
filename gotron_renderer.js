"use strict";

/*

   Summary of the comms protocol:
   Each message has a 1 char type indicator, followed by the blobs of the message.
   The type indicator and the blobs are separated from each other by 0x1e (30).
   The fields inside a blob are separated by 0x1f (31).

   v (30) p (31) #ffffff (31) 25.2 (31) 54.7 (31) 2.2 (31) 1.3 (30) p (31) #ff0000 (31) 127.4 (31) 339.7 (31) -1.0 (31) 0.4
   |   |                                                         |
   |   |  ---------------------- blob ------------------------   |  ------------------------- blob ------------------------
   |   |                                                         |
   | recsep                                                    recsep
   |
  type

*/

const alert = require("./modules/alert");
const child_process = require("child_process");
const fs = require("fs");
const readline = require("readline");

const REC_SEP = "\x1e";
const UNIT_SEP = "\x1f";

const config = JSON.parse(fs.readFileSync("gotron.cfg", "utf8"));
const channel_max = 8;
const canvas = document.querySelector("canvas");
const virtue = canvas.getContext("2d");

// ------------------------------------------------------------------------------------------------------------------------

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let client = {};

client.iteration = 0;
client.sprites = {};
client.sounds = {};
client.all_things = [];
client.last_frame_time = Date.now();

client.go = child_process.spawn(config.executable);

let scanner = readline.createInterface({
	input: client.go.stdout,
	output: undefined,
	terminal: false
});

scanner.on("line", (line) => {

	let stuff = line.split(REC_SEP);

	let len = stuff.length;
	if (len === 0) {
		return;
	}

	let frame_type = stuff[0];

	if (frame_type === "v") {

		// Deal with visual frames...

		client.all_things.length = 0;         // Clear our list of drawables.

		client.go_frames += 1;
		client.last_frame_time = Date.now();

		for (let n = 1; n < len; n++) {

			let elements = stuff[n].split(UNIT_SEP);

			switch (elements[0]) {

			case "f":
				client.parse_frect(elements);
				break;
			case "l":
				client.parse_line(elements);
				break;
			case "p":
				client.parse_point(elements);
				break;
			case "po":
				client.parse_polygon(elements);
				break;
			case "s":
				client.parse_sprite(elements);
				break;
			case "t":
				client.parse_text(elements);
				break;
			}
		}

	} else if (frame_type === "a") {

		// Deal with audio events...

		for (let n = 1; n < len; n++) {
			let filename = stuff[n];
			client.play_multi_sound(filename);
		}

	} else if (frame_type === "d") {

		// Debug messages...

		if (len > 0) {
			let msg = stuff[1];
			client.display_debug_message(msg);
		}

	} else if (frame_type === "r") {

		// Register sprites...

		if (len > 1) {
			let elements = stuff[1].split(UNIT_SEP);
			client.register_sprite(elements);
		}

	} else if (frame_type === "s") {

		// Register sounds...

		if (len > 1) {
			let elements = stuff[1].split(UNIT_SEP);
			client.register_sound(elements);
		}
	}
});

let err_scanner = readline.createInterface({
	input: client.go.stderr,
	output: undefined,
	terminal: false
});

err_scanner.on("line", (line) => {
	console.log(line);
});

// ------------------------------------------------------------------------------------------------------------------------

client.parse_frect = (elements) => {
	client.all_things.push({
		type:		elements[0],
		colour:		elements[1],
		x1:			parseFloat(elements[2]),
		y1:			parseFloat(elements[3]),
		x2:			parseFloat(elements[4]),
		y2:			parseFloat(elements[5]),
		speedx:		parseFloat(elements[6]),
		speedy:		parseFloat(elements[7]),
	});
};

client.parse_line = (elements) => {
	client.all_things.push({
		type:		elements[0],
		colour:		elements[1],
		x1:			parseFloat(elements[2]),
		y1:			parseFloat(elements[3]),
		x2:			parseFloat(elements[4]),
		y2:			parseFloat(elements[5]),
		speedx:		parseFloat(elements[6]),
		speedy:		parseFloat(elements[7]),
	});
};

client.parse_point = (elements) => {
	client.all_things.push({
		type:		elements[0],
		colour:		elements[1],
		x:			parseFloat(elements[2]),
		y:			parseFloat(elements[3]),
		speedx:		parseFloat(elements[4]),
		speedy:		parseFloat(elements[5]),
	});
};

client.parse_polygon = (elements) => {

	let thing = {
		type:		elements[0],
		colour:		elements[1]
	};

	thing.speedx = elements[elements.length - 2];
	thing.speedy = elements[elements.length - 1];

	thing.points = elements.slice(2, elements.length - 2)

	if (thing.points.length > 2 && thing.points.length % 2 === 0) {
		client.all_things.push(thing);
	}
};

client.parse_sprite = (elements) => {
	client.all_things.push({
		type:		elements[0],
		varname:	elements[1],
		x:			parseFloat(elements[2]),
		y:			parseFloat(elements[3]),
		speedx:		parseFloat(elements[4]),
		speedy:		parseFloat(elements[5]),
	});
};

client.parse_text = (elements) => {

	if (elements.length < 9) {
		return;
	}

	client.all_things.push({
		type:		elements[0],
		colour:		elements[1],
		size:		parseFloat(elements[2]),
		font:		elements[3],
		x:			parseFloat(elements[4]),
		y:			parseFloat(elements[5]),
		speedx:		parseFloat(elements[6]),
		speedy:		parseFloat(elements[7]),
		text:		elements[8]
	});
};

// ------------------------------------------------------------------------------------------------------------------------

client.register_sprite = (elements) => {
	let filename = elements[0];
	let varname = elements[1];
	client.sprites[varname] = new Image();
	client.sprites[varname].src = filename;
};

client.register_sound = (elements) => {
	let filename = elements[0];
	let varname = elements[1];
	client.sounds[varname] = new Audio();
	client.sounds[varname].src = filename;
};

// ------------------------------------------------------------------------------------------------------------------------

client.draw_frect = (r, time_offset) => {

	if (r.x2 < r.x1) {
		[r.x1, r.x2] = [r.x2, r.x1];
	}
	if (r.y2 < r.y1) {
		[r.y1, r.y2] = [r.y2, r.y1];
	}

	let width = r.x2 - r.x1;
	let height = r.y2 - r.y1;

	let x1 = r.x1 + r.speedx * time_offset / 1000;
	let y1 = r.y1 + r.speedy * time_offset / 1000;

	virtue.fillStyle = r.colour;
	virtue.fillRect(x1, y1, width, height); 
}

client.draw_line = (li, time_offset) => {
	let x1 = li.x1 + li.speedx * time_offset / 1000;
	let y1 = li.y1 + li.speedy * time_offset / 1000;
	let x2 = li.x2 + li.speedx * time_offset / 1000;
	let y2 = li.y2 + li.speedy * time_offset / 1000;

	virtue.strokeStyle = li.colour;
	virtue.beginPath();
	virtue.moveTo(x1, y1);
	virtue.lineTo(x2, y2);
	virtue.stroke();
};

client.draw_point = (p, time_offset) => {
	let x = Math.floor(p.x + p.speedx * time_offset / 1000);
	let y = Math.floor(p.y + p.speedy * time_offset / 1000);
	virtue.fillStyle = p.colour;
	virtue.fillRect(x, y, 1, 1);
};

client.draw_polygon = (p, time_offset) => {

	let x_offset = p.speedx * time_offset / 1000;
	let y_offset = p.speedy * time_offset / 1000;

	console.log(p);

	virtue.fillStyle = p.colour;

	virtue.beginPath();
	virtue.moveTo(p.points[0] + x_offset, p.points[1] + y_offset);

	for (let n = 2; n < p.points.length; n += 2) {
		virtue.lineTo(p.points[n] + x_offset, p.points[n + 1] + y_offset);
	}

	virtue.closePath();
	virtue.fill();
};

client.draw_sprite = (sp, time_offset) => {
	let x = sp.x + sp.speedx * time_offset / 1000;
	let y = sp.y + sp.speedy * time_offset / 1000;

	if (client.sprites[sp.varname] === undefined) {
		alert("Got bad sprite: " + sp.varname);
	}

	virtue.drawImage(client.sprites[sp.varname], x - client.sprites[sp.varname].width / 2, y - client.sprites[sp.varname].height / 2);
};

client.draw_text = (t, time_offset) => {
	let x = Math.floor(t.x + t.speedx * time_offset / 1000);
	let y = Math.floor(t.y + t.size / 2 + t.speedy * time_offset / 1000);
	virtue.fillStyle = t.colour;
	virtue.textAlign = "center";
	virtue.font = t.size.toString() + "px " + t.font;
	virtue.fillText(t.text, x, y);
};

// ------------------------------------------------------------------------------------------------------------------------

client.draw = () => {

	virtue.clearRect(0, 0, canvas.width, canvas.height);     // The best way to clear the canvas??

	// As a relatively simple way of dealing with arbitrary timings of incoming data, we
	// always try to draw the object "where it is now" taking into account how long it's
	// been since we received info about it. This is done with this "time_offset" let.

	let time_offset = Date.now() - client.last_frame_time;
	let len = client.all_things.length;

	for (let n = 0; n < len; n++) {

		let thing = client.all_things[n];

		switch (thing.type) {
		case "f":
			client.draw_frect(thing, time_offset);
			break;
		case "l":
			client.draw_line(thing, time_offset);
			break;
		case "p":
			client.draw_point(thing, time_offset);
			break;
		case "po":
			client.draw_polygon(thing, time_offset);
			break;
		case "s":
			client.draw_sprite(thing, time_offset);
			break;
		case "t":
			client.draw_text(thing, time_offset);
			break;
		}
	}
};

client.main = () => {
	client.iteration++;
	if (client.iteration % 60 === 0) {
		let new_width = window.innerWidth;
		let new_height = window.innerHeight;
		if (new_width !== canvas.width || new_height !== canvas.height) {
			canvas.width = new_width;
			canvas.height = new_height;
			client.send_resize();
		}
	}
	client.draw();
	client.go.stdin.write("sync\n");
	requestAnimationFrame(client.main);
};

client.display_debug_message = (s) => {
	document.title = s;
};

client.send_resize = () => {
	client.go.stdin.write("resize " + canvas.width.toString() + " " + canvas.height.toString() +"\n");
};

// Sound from Thomas Sturm: http://www.storiesinflight.com/html5/audio.html

client.init_sound = () => {
	client.audiochannels = [];
	while (client.audiochannels.length < channel_max) {
		client.audiochannels.push({
			channel: new Audio(),
			finished: -1
		});
	}
};

client.play_multi_sound = (s) => {
	let thistime = Date.now()
	for (let a = 0; a < client.audiochannels.length; a++) {
		if (client.audiochannels[a].finished < thistime) {
			client.audiochannels[a].finished = thistime + client.sounds[s].duration * 1000;
			client.audiochannels[a].channel.src = client.sounds[s].src;
			client.audiochannels[a].channel.load();
			client.audiochannels[a].channel.play();
			break;
		}
	}
};

// Setup keyboard and mouse...

document.addEventListener("keydown", (evt) => {
	if (evt.key === " ") {
		client.go.stdin.write("keydown space\n");
	} else {
		client.go.stdin.write("keydown " + evt.key + "\n");
	}
});

document.addEventListener("keyup", (evt) => {
	if (evt.key === " ") {
		client.go.stdin.write("keyup space\n");
	} else {
		client.go.stdin.write("keyup " + evt.key + "\n");
	}
});

canvas.addEventListener("mousedown", (evt) => {
	let x = evt.clientX - canvas.offsetLeft;
	let y = evt.clientY - canvas.offsetTop;
	client.go.stdin.write("click " + evt.button.toString() + " " + x.toString() + " " + y.toString() + "\n");
});

// Start...

client.send_resize();
client.init_sound();
requestAnimationFrame(client.main);
