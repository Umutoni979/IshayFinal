let _io = null;

const init = (io) => { _io = io; };
const getIO = () => _io;

module.exports = { init, getIO };
