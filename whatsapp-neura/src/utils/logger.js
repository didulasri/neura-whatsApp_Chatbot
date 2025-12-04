module.exports.log = (...msg) => {
  console.log("[LOG]", ...msg);
};

module.exports.error = (...msg) => {
  console.error("[ERROR]", ...msg);
};
