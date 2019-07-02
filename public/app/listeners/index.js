const loadSpace = require('./loadSpace');
const saveSpace = require('./saveSpace');
const getSpace = require('./getSpace');
const getSpaces = require('./getSpaces');
const deleteSpace = require('./deleteSpace');
const showSyncSpacePrompt = require('./showSyncSpacePrompt');
const syncSpace = require('./syncSpace');

module.exports = {
  loadSpace,
  saveSpace,
  getSpace,
  getSpaces,
  showSyncSpacePrompt,
  syncSpace,
  deleteSpace,
};