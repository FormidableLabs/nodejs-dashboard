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
          limit: 30
        },
        {
          type: "eventLoop",
          title: "event loop",
          limit: 30
        },
        {
          type: "memory",
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
          limit: 30
        },
        {
          type: "eventLoop",
          limit: 30
        },
        {
          type: "memoryGraph"
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
  ],
  [
    {
      views: [
        {
          position: {
            grow: 2
          },
          type: "panel",
          views: [
            {
              type: "panel",
              views: [
                {
                  type: "nodeDetails"
                },
                {
                  type: "systemDetails"
                }
              ]
            },
            {
              type: "panel",
              views: [
                {
                  type: "cpuDetails"
                },
                {
                  type: "userDetails"
                }
              ]
            }
          ]
        },
        {
          position: {
            grow: 5
          },
          type: "envDetails"
        }
      ]
    }
  ]
];
