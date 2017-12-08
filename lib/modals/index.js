"use strict";

var _ = require("lodash");
var HelpView = require("./help");
var GotoTimeView = require("./goto-time");

var KIND = [
  {
    keys: ["?", "h", "S-h"],
    modal: HelpView
  },
  {
    keys: ["g", "S-g"],
    modal: GotoTimeView
  }
];

var Modals = function Modals(modalOptions) {
  this.modals = _.reduce(KIND, function (memo, modal) {
    var Modal = modal.modal;
    var instance = new Modal(modalOptions);
    return memo.concat({
      keys: modal.keys,
      instance: instance,
      action: this._toggleModal.bind(this, instance)
    });
  }.bind(this), []);
};

/**
 * Get array of keys and action handlers.
 *
 * @returns {Object[]}
 * Array of Objects with lists of keys that should trigger actions
 */
Modals.prototype.getKeyActions = function () {
  return _.reduce(this.modals, function (memo, modal) {
    return memo.concat({
      keys: modal.keys,
      action: modal.action
    });
  }, []);
};

/**
 * Hide all modals with the exception of param
 *
 * @param {Object} what
 * Modal for exception to allow to stay visible
 *
 * @returns {Void}
 * All modals are hidden except the param
 */
Modals.prototype.hideModals = function (what) {
  _.each(this.modals, function (modal) {
    if (modal.instance !== what) {
      modal.instance.hide();
    }
  });
};

/**
 * Get the modal that is currently showing
 *
 * @returns {Void}
 * Instance of current showing modal or null if none showing
 */
Modals.prototype.showingModal = function () {
  var found = this.modals.find(function (modal) {
    return modal.instance.isVisible();
  });
  if (!found) {
    return null;
  }
  return found.instance;
};

/**
 * Bring the showing modal if any to the front
 *
 * @returns {Void}
 * Visable modal is top most
 */
Modals.prototype.bringShowingToFront = function () {
  // Move showing modal to front
  var showingModal = this.showingModal();
  if (showingModal) {
    showingModal.node.setFront();
  }
};

Modals.prototype._toggleModal = function (what) {
  // Hide other modals
  this.hideModals(what);
  // Show
  what.toggle();
};

module.exports = Modals;
