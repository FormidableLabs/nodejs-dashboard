"use strict";

module.exports = [
  [
    {
      views: [
        {
          type: "cpu",
          limit: 30
        },
        {
          type: "eventLoop",
          limit: 30
        },
        {
          type: "memory",
          position: {
            size: 15
          }
        }
      ]
    },
    {
      position: {
        grow: 3
      },
      views: [
        {
          type: "log",
          streams: ["stdout"],
          exclude: "^\\[STATUS\\]"
        },
        {
          type: "log",
          streams: ["stderr"],
          exclude: "^\\[STATUS\\]",
          position: {
            size: 15
          }
        },
        {
          type: "log",
          title: "status",
          borderColor: "light-blue",
          fgColor: "",
          bgColor: "",
          streams: ["stdout", "stderr"],
          include: "^\\[STATUS\\](.*)",
          position: {
            size: 3
          }
        }
      ]
    }
  ]
];
