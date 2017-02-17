"use strict";

module.exports = [
  [
    {
      position: {
        grow: 3
      },
      views: [
        {
          type: "log",
          title: "stdout",
          borderColor: "green",
          streams: ["stdout"]
        },
        {
          type: "log",
          title: "stderr",
          borderColor: "red",
          streams: ["stderr"]
        }
      ]
    },
    {
      views: [
        {
          type: "cpu",
          title: "cpu utilization",
          limit: 30
        },
        {
          type: "eventLoop",
          title: "EL delay",
          limit: 30
        },
        {
          type: "memory",
          title: "memory",
          position: {
            size: 15
          }
        }
      ]
    }
  ],
  [
    {
      position: {
        grow: 3
      },
      views: [
        {
          type: "log",
          title: "log",
          borderColor: "light-blue",
          streams: ["stdout", "stderr"]
        }
      ]
    },
    {
      views: [
        {
          type: "cpu",
          title: "cpu utilization",
          limit: 30
        },
        {
          type: "eventLoop",
          title: "EL delay",
          limit: 30
        },
        {
          type: "memory",
          title: "memory",
          position: {
            size: 15
          }
        }
      ]
    }
  ],
  [
    {
      views: [
        {
          type: "cpu",
          title: "cpu utilization",
          limit: 30
        },
        {
          type: "eventLoop",
          title: "event loop delay",
          limit: 30
        }
      ]
    }
  ],
  [
    {
      views: [
        {
          type: "log",
          title: "stdout",
          borderColor: "green",
          streams: ["stdout"]
        },
        {
          type: "log",
          title: "stdout",
          borderColor: "red",
          streams: ["stderr"]
        }
      ]
    }
  ],
  [
    {
      views: [
        {
          type: "log",
          title: "log",
          borderColor: "light-blue",
          streams: ["stdout", "stderr"]
        }
      ]
    }
  ]
];
