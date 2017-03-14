"use strict";

// All this is so simple that one should simply do the required test in the caller instead.

exports.is_renderer = () => {
    if (process.type === "renderer") {
        return true;
    } else {
        return false;
    }
}

// For whatever reason, the "main" process is called "browser".

exports.is_main = () => {
    if (process.type === "browser") {
        return true;
    } else {
        return false;
    }
}

exports.get_type = () => {
    if (process.type === "browser") {
        return "main";
    } else {
        return process.type;
    }
}
