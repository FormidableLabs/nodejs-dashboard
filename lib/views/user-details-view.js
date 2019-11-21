"use strict";

const os = require("os");
const BaseDetailsView = require("./base-details-view");

const UserDetailsView = function UserDetailsView(options) {
  BaseDetailsView.call(this, options);
};

UserDetailsView.prototype = Object.create(BaseDetailsView.prototype);

UserDetailsView.prototype.getDefaultLayoutConfig = function () {
  return {
    label: " User ",
    border: "line",
    tags: true,
    height: "shrink",
    style: {
      border: {
        fg: "white"
      }
    }
  };
};

UserDetailsView.prototype.getDetails = function () {
  // Node version 6 added userInfo function
  if (!os.userInfo) {
    return [
      {
        label: "User Information",
        data: "Not supported on this version of Node"
      }
    ];
  }

  const userInfo = os.userInfo({ encoding: "utf8" });

  return [
    {
      label: "User Name",
      data: userInfo.username
    }, {
      label: "Home",
      data: userInfo.homedir
    }, {
      label: "User ID",
      data: userInfo.uid
    }, {
      label: "Group ID",
      data: userInfo.gid
    }, {
      label: "Shell",
      data: userInfo.shell
    }
  ];
};

module.exports = UserDetailsView;
